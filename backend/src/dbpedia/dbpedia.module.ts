import { Module } from "@nestjs/common";
import { DbpediaController } from "./dbpedia.controller";
import { DbpediaService } from "./dbpedia.service";

@Module({
  controllers: [DbpediaController],
  providers: [DbpediaService],
})
export class DbpediaModule {}
