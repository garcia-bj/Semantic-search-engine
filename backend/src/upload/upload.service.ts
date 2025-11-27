import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as $rdf from "rdflib";
import * as fs from "fs";
import { promisify } from "util";

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  async uploadOwlDocument(file: Express.Multer.File) {
    const fileContent = await readFile(file.path, "utf-8");

    const store = $rdf.graph();
    const contentType = "application/rdf+xml";
    const baseUrl = `http://localhost/uploads/${file.filename}`;

    return new Promise((resolve, reject) => {
      try {
        $rdf.parse(fileContent, store, baseUrl, contentType, (err) => {
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

          this.saveDocument(file.originalname, triples, file.path)
            .then(resolve)
            .catch(reject);
        });
      } catch (e) {
        reject(new Error(`Failed to parse RDF: ${e.message}`));
      }
    });
  }

  private async saveDocument(
    filename: string,
    triples: any[],
    filePath: string,
  ) {
    try {
      const document = await this.prisma.document.create({
        data: {
          filename,
          triples: {
            create: triples,
          },
        },
        include: {
          _count: {
            select: { triples: true },
          },
        },
      });

      // Clean up uploaded file
      try {
        await unlink(filePath);
      } catch (err) {
        console.warn("Failed to delete temporary file:", err);
      }

      return document;
    } catch (error) {
      throw new Error(`Failed to save document: ${error.message}`);
    }
  }

  async getDocuments() {
    return this.prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { triples: true },
        },
      },
    });
  }

  async deleteDocument(id: string) {
    try {
      await this.prisma.document.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
}
