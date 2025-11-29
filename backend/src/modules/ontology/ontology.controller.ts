import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { OntologyService } from "./ontology.service";

@Controller("upload")
export class OntologyController {
  constructor(private readonly ontologyService: OntologyService) { }

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException("No file uploaded", HttpStatus.BAD_REQUEST);
    }

    try {
      const document = await this.ontologyService.uploadOwlDocument(file);
      return {
        message: "File uploaded and processed successfully",
        document,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to process file",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("documents")
  async getDocuments() {
    return this.ontologyService.getDocuments();
  }

  @Delete("documents/:id")
  async deleteDocument(@Param("id") id: string) {
    try {
      await this.ontologyService.deleteDocument(id);
      return { message: "Document deleted successfully" };
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to delete document",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
