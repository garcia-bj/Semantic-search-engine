import { Module } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';
import { PrismaModule } from '../database/prisma.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [PrismaModule, HttpModule],
    controllers: [TranslationController],
    providers: [TranslationService],
    exports: [TranslationService],
})
export class TranslationModule { }
