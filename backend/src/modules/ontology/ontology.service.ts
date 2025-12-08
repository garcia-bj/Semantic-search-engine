import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { SparqlService } from "../sparql/sparql.service";
import { EmbeddingsService } from "../embeddings/embeddings.service";
import { ElasticsearchService } from "../elasticsearch/elasticsearch.service";
import * as $rdf from "rdflib";
import * as fs from "fs";
import { promisify } from "util";

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

@Injectable()
export class OntologyService {
  private readonly logger = new Logger(OntologyService.name);

  constructor(
    private prisma: PrismaService,
    private sparqlService: SparqlService,
    private embeddingsService: EmbeddingsService,
    private elasticsearchService: ElasticsearchService,
  ) { }

  async uploadOwlDocument(file: Express.Multer.File) {
    let filePathToProcess = file.path;
    let isConverted = false;

    try {
      let fileContent = await readFile(file.path, "utf-8");

      // Verificar si es OWL/XML (no soportado por rdflib)
      if (fileContent.includes("<Ontology") || fileContent.includes("<owl:Ontology")) {
        if (!fileContent.includes("<rdf:RDF")) {
          this.logger.log("OWL/XML format detected. Converting to RDF/XML using Python script...");

          // Declarar variables en el scope correcto para que estén disponibles en el catch
          let pythonPath = process.env.PYTHON_PATH || 'python';
          let scriptPath = '';

          try {
            const { exec } = require('child_process');
            const util = require('util');
            const execPromise = util.promisify(exec);

            // Ruta al script de Python (usando process.cwd() para mayor robustez)
            scriptPath = require('path').join(process.cwd(), 'scripts', 'convert_owl.py');

            this.logger.log(`Executing Python script at: ${scriptPath}`);

            // Detectar la ruta de Python dinámicamente con múltiples fallbacks

            try {
              // Intentar primero con 'python3' (común en Linux/Mac)
              try {
                const { stdout: python3Path } = await execPromise('python3 -c "import sys; print(sys.executable)"');
                pythonPath = python3Path.trim();
                this.logger.log(`Using Python3 at: ${pythonPath}`);
              } catch (python3Error) {
                // Si falla python3, intentar con 'python'
                const { stdout: pythonExePath } = await execPromise('python -c "import sys; print(sys.executable)"');
                pythonPath = pythonExePath.trim();
                this.logger.log(`Using Python at: ${pythonPath}`);
              }
            } catch (err) {
              this.logger.warn(`Could not detect Python path automatically: ${err.message}`);
              this.logger.warn(`Using fallback: ${pythonPath}`);
              this.logger.warn('Tip: Set PYTHON_PATH environment variable to specify Python location explicitly');
            }

            // Ejecutar script
            const { stdout, stderr } = await execPromise(`"${pythonPath}" "${scriptPath}" "${file.path}"`);

            if (stderr && stderr.trim().length > 0) {
              this.logger.warn(`Python script warning/error: ${stderr}`);
            }

            const convertedFilePath = stdout.trim();
            this.logger.log(`Conversion successful. New file: ${convertedFilePath}`);

            // Actualizar variables para procesar el archivo convertido
            filePathToProcess = convertedFilePath;
            fileContent = await readFile(convertedFilePath, "utf-8");
            isConverted = true;

          } catch (conversionError) {
            this.logger.error(`Failed to convert OWL/XML: ${conversionError.message}`);
            this.logger.error(`Python path used: ${pythonPath}`);
            this.logger.error(`Script path: ${scriptPath}`);

            // Proporcionar mensaje de error más detallado
            let errorMessage = "Failed to convert OWL/XML file. ";
            if (conversionError.message.includes('owlready2')) {
              errorMessage += "The owlready2 library is not installed. Please run: pip install owlready2";
            } else if (conversionError.message.includes('python')) {
              errorMessage += "Python is not accessible. Please ensure Python 3.x is installed and in PATH, or set PYTHON_PATH environment variable.";
            } else {
              errorMessage += `Error: ${conversionError.message}`;
            }

            throw new Error(errorMessage);
          }
        }
      }

      this.logger.log(`Parsing file: ${file.filename}, Content start: ${fileContent.substring(0, 200)}`);

      const store = $rdf.graph();
      const contentType = "application/rdf+xml";
      const baseUrl = `http://localhost/uploads/${file.filename}`;

      const document = await new Promise((resolve, reject) => {
        try {
          $rdf.parse(fileContent, store, baseUrl, contentType, async (err) => {
            if (err) {
              reject(new Error(`Failed to parse RDF: ${err}`));
              return;
            }

            const triples = store.statements.map((statement) => ({
              subject: statement.subject.value,
              predicate: statement.predicate.value,
              object: statement.object.value,
              language: (statement.object as any).language || null,
            }));

            try {
              const doc = await this.saveDocument(
                file.originalname,
                file.path, // Guardamos la ruta original
                triples,
                fileContent,
              );
              resolve(doc);
            } catch (error) {
              reject(error);
            }
          });
        } catch (e) {
          reject(new Error(`Failed to parse RDF: ${e.message}`));
        }
      });

      return document;
    } finally {
      // Limpiar archivo temporal original
      try {
        await unlink(file.path);
      } catch (err) {
        this.logger.warn(`Failed to delete original file ${file.path}:`, err);
      }

      // Limpiar archivo convertido si existe
      if (isConverted && filePathToProcess !== file.path) {
        try {
          await unlink(filePathToProcess);
        } catch (err) {
          this.logger.warn(`Failed to delete converted file ${filePathToProcess}:`, err);
        }
      }
    }
  }

  private async saveDocument(
    filename: string,
    filePath: string,
    triples: any[],
    rdfContent: string,
  ) {
    try {
      // 1. Guardar metadatos en PostgreSQL
      const document = await this.prisma.document.create({
        data: {
          filename,
          filePath,
          tripleCount: triples.length,
        },
      });

      this.logger.log(
        `Document metadata saved: ${document.id} with ${triples.length} triples at ${filePath}`,
      );

      // 2. Inyectar documentId en el contenido RDF
      // Agregar triples adicionales que vinculan cada sujeto con el documentId
      const documentIdPredicate = 'http://example.org/hasDocumentId';

      // Extraer todos los sujetos únicos
      const uniqueSubjects = [...new Set(triples.map(t => t.subject))];

      // Crear triples adicionales para documentId
      const documentIdTriples = uniqueSubjects.map(subject => {
        // Escapar el subject para RDF/XML
        const escapedSubject = subject.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `  <rdf:Description rdf:about="${escapedSubject}">
    <hasDocumentId xmlns="http://example.org/">${document.id}</hasDocumentId>
  </rdf:Description>`;
      }).join('\n');

      // Inyectar los triples de documentId en el RDF
      let enrichedRdfContent = rdfContent;

      // Buscar la etiqueta de cierre </rdf:RDF> e insertar antes de ella
      if (enrichedRdfContent.includes('</rdf:RDF>')) {
        enrichedRdfContent = enrichedRdfContent.replace(
          '</rdf:RDF>',
          `${documentIdTriples}\n</rdf:RDF>`
        );
      } else {
        // Si no tiene la estructura esperada, envolver el contenido
        enrichedRdfContent = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
${documentIdTriples}
${rdfContent}
</rdf:RDF>`;
      }

      this.logger.log(`Injected documentId metadata for ${uniqueSubjects.length} unique subjects`);

      // 3. Guardar tripletas enriquecidas en Fuseki
      try {
        await this.sparqlService.uploadRdf(enrichedRdfContent, "application/rdf+xml");
        this.logger.log(`Triples with documentId uploaded to Fuseki for document ${document.id}`);
      } catch (fusekiError) {
        // Si falla Fuseki, eliminar el documento de PostgreSQL
        await this.prisma.document.delete({ where: { id: document.id } });
        throw new Error(
          `Failed to upload triples to Fuseki: ${fusekiError.message}`,
        );
      }

      // 3. Generar embeddings e indexar en Elasticsearch (si está disponible)
      if (this.embeddingsService.isAvailable()) {
        try {
          await this.indexDocumentWithEmbeddings(document.id, triples);
        } catch (indexError) {
          this.logger.warn(
            `Failed to index with embeddings: ${indexError.message}. Document saved but semantic search may be limited.`,
          );
        }
      } else {
        this.logger.warn(
          'Embedding service not available. Document saved but semantic search will be limited.',
        );
      }

      return document;
    } catch (error) {
      throw new Error(`Failed to save document: ${error.message}`);
    }
  }

  /**
   * Indexa un documento con embeddings en Elasticsearch
   */
  private async indexDocumentWithEmbeddings(
    documentId: string,
    triples: any[],
  ): Promise<void> {
    try {
      // Extraer textos únicos de las tripletas
      const textsToEmbed = new Set<string>();

      for (const triple of triples) {
        const text = `${triple.subject} ${triple.predicate} ${triple.object}`.trim();
        if (text.length > 0) {
          textsToEmbed.add(text);
        }
      }

      const uniqueTexts = Array.from(textsToEmbed);
      this.logger.log(`Generating embeddings for ${uniqueTexts.length} unique texts`);

      // Generar embeddings en batch
      const embeddings = await this.embeddingsService.generateEmbeddings(uniqueTexts);

      // Preparar documentos para Elasticsearch
      const esDocuments = triples.map((triple) => {
        const text = `${triple.subject} ${triple.predicate} ${triple.object}`.trim();
        const embedding = embeddings.get(text);

        return {
          subject: triple.subject,
          predicate: triple.predicate,
          object: triple.object,
          language: triple.language,
          documentId,
          text,
          embedding,
        };
      });

      // Indexar en Elasticsearch
      await this.elasticsearchService.indexTriplesWithEmbeddings(
        esDocuments,
        embeddings,
      );

      this.logger.log(
        `Successfully indexed ${esDocuments.length} triples with embeddings for document ${documentId}`,
      );
    } catch (error) {
      throw new Error(`Failed to index with embeddings: ${error.message}`);
    }
  }

  async getDocuments() {
    return this.prisma.document.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteDocument(id: string) {
    try {
      // TODO: Implementar eliminación de tripletas en Fuseki
      // Por ahora solo eliminamos los metadatos
      await this.prisma.document.delete({
        where: { id },
      });
      this.logger.log(`Document ${id} deleted from PostgreSQL`);
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
}
