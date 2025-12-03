import { Module } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { PrismaModule } from '../database/prisma.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        PrismaModule,
        HttpModule.register({
            timeout: 30000, // 30 segundos para embeddings grandes
            maxRedirects: 5,
        }),
    ],
    providers: [EmbeddingsService],
    exports: [EmbeddingsService],
})
export class EmbeddingsModule { }
