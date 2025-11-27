import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { UploadModule } from "./upload/upload.module";
import { SearchModule } from "./search/search.module";
import { DbpediaModule } from "./dbpedia/dbpedia.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UploadModule,
    SearchModule,
    DbpediaModule,
  ],
})
export class AppModule {}
