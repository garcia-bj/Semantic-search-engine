import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TranslationService } from './translation.service';

@Controller('translation')
export class TranslationController {
    constructor(private readonly translationService: TranslationService) { }

    /**
     * Traducir texto
     */
    @Post('translate')
    async translate(
        @Body('text') text: string,
        @Body('targetLang') targetLang: 'en' | 'es' = 'es',
    ) {
        const result = await this.translationService.translate(text, targetLang);
        return {
            success: true,
            ...result,
        };
    }

    /**
     * Traducir a múltiples idiomas
     */
    @Post('translate-multi')
    async translateMulti(@Body('text') text: string) {
        const translations = await this.translationService.translateToMultipleLanguages(text);
        return {
            success: true,
            original: text,
            translations,
        };
    }

    /**
     * Detectar idioma
     */
    @Post('detect')
    async detectLanguage(@Body('text') text: string) {
        const language = await this.translationService.detectLanguage(text);
        return {
            success: true,
            text,
            language,
        };
    }

    /**
     * Estadísticas de caché
     */
    @Get('stats')
    async getStats() {
        const stats = await this.translationService.getCacheStats();
        return {
            success: true,
            stats,
        };
    }
}
