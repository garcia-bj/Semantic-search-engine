import { Module, forwardRef } from '@nestjs/common';
import { SparqlService } from './sparql.service';
import { SparqlGateway } from './sparql.gateway';
import { SearchModule } from '../search/search.module';

@Module({
    imports: [forwardRef(() => SearchModule)],
    providers: [SparqlService, SparqlGateway],
    exports: [SparqlService],
})
export class SparqlModule { }
