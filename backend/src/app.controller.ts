import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './modules/database/prisma.service';

@Controller()
export class AppController {
    constructor(private prisma: PrismaService) { }

    @Get('health')
    async healthCheck() {
        try {
            // Check database connection
            await this.prisma.$queryRaw`SELECT 1`;

            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'connected',
                    api: 'running',
                },
            };
        } catch (error) {
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'disconnected',
                    api: 'running',
                },
                error: error.message,
            };
        }
    }

    @Get()
    getRoot() {
        return {
            name: 'Semantic Search API',
            version: '1.0.0',
            status: 'running',
            endpoints: {
                health: '/health',
                search: '/search',
                upload: '/ontology/upload',
                dbpedia: '/dbpedia-cache/search',
            },
        };
    }
}
