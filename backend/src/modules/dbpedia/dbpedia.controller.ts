import { Controller, Get, Query } from "@nestjs/common";
import { DbpediaService } from "./dbpedia.service";

@Controller("dbpedia")
export class DbpediaController {
  constructor(private readonly dbpediaService: DbpediaService) {}

  @Get("search")
  async search(@Query("q") query: string, @Query("lang") language?: string) {
    if (!query) {
      return { results: [] };
    }

    const results = await this.dbpediaService.searchDBpedia(query, language);
    return { results };
  }
}
