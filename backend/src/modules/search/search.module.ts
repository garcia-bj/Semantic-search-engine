import { Module, forwardRef } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SparqlModule } from '../sparql/sparql.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { PrismaModule } from '../database/prisma.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { QueryExpansionService } from './query-expansion.service';

@Module({
  imports: [forwardRef(() => SparqlModule), ElasticsearchModule, PrismaModule, EmbeddingsModule],
  controllers: [SearchController],
  providers: [SearchService, QueryExpansionService],
  exports: [SearchService],
})
export class SearchModule { }
