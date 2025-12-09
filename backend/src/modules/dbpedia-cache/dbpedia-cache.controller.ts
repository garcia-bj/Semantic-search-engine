import { Controller, Get, Query, Param, Post } from '@nestjs/common';
import { DBpediaCacheService } from './dbpedia-cache.service';

@Controller('dbpedia-cache')
export class DBpediaCacheController {
    constructor(private readonly cacheService: DBpediaCacheService) { }

    /**
     * Búsqueda con fallback automático
     */
    @Get('search')
    async search(@Query('q') query: string, @Query('lang') language?: string) {
        if (!query) {
            return { error: 'Query parameter is required' };
        }

        // Usar español por defecto si no se especifica idioma
        const lang = language || 'es';

        try {
            const result = await this.cacheService.searchWithFallback(query, lang);
            return {
                success: true,
                ...result,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                source: 'none',
                results: [],
            };
        }
    }

    /**
     * Verificar entrada de caché
     */
    @Post('verify/:id')
    async verifyEntry(@Param('id') id: string) {
        const isValid = await this.cacheService.verifyEntry(id);
        return {
            success: true,
            verified: isValid,
        };
    }

    /**
     * Estadísticas de caché
     */
    @Get('stats')
    async getStats() {
        const stats = await this.cacheService.getCacheStats();
        return {
            success: true,
            stats,
        };
    }
}
