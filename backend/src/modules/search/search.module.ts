import { Module, forwardRef } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { SparqlModule } from '../sparql/sparql.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';

@Module({
  imports: [forwardRef(() => SparqlModule), ElasticsearchModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule { }
