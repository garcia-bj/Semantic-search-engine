import { Module } from '@nestjs/common';
import { DBpediaCacheService } from './dbpedia-cache.service';
import { DBpediaCacheController } from './dbpedia-cache.controller';
import { PrismaModule } from '../database/prisma.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [PrismaModule, HttpModule],
    controllers: [DBpediaCacheController],
    providers: [DBpediaCacheService],
    exports: [DBpediaCacheService],
})
export class DBpediaCacheModule { }
