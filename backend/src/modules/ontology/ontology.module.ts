import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { OntologyController } from "./ontology.controller";
import { OntologyService } from "./ontology.service";
import { SparqlModule } from "../sparql/sparql.module";
import { ElasticsearchModule } from "../elasticsearch/elasticsearch.module";

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, file.fieldname + "-" + uniqueSuffix + ".owl");
        },
      }),
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === "application/rdf+xml" ||
          file.originalname.endsWith(".owl") ||
          file.originalname.endsWith(".rdf")
        ) {
          cb(null, true);
        } else {
          cb(new Error("Only OWL/RDF files are allowed!"), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
    SparqlModule,
    ElasticsearchModule,
  ],
  controllers: [OntologyController],
  providers: [OntologyService],
  exports: [OntologyService],
})
export class OntologyModule { }
