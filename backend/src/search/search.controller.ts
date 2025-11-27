import { Controller, Get, Query } from "@nestjs/common";
import { SearchService } from "./search.service";

@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query("q") query: string, @Query("lang") language?: string) {
    if (!query) {
      return { results: [] };
    }

    const results = await this.searchService.semanticSearch(query, language);
    return { results };
  }
}
