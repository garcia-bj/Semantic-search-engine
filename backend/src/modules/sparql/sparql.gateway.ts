import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SearchService } from '../search/search.service';

interface SearchQuery {
    query: string;
    language?: string;
    type?: 'simple' | 'fuzzy' | 'pattern';
    threshold?: number;
}

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SparqlGateway {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(SparqlGateway.name);

    constructor(private searchService: SearchService) { }

    @SubscribeMessage('search:query')
    async handleSearch(
        @MessageBody() data: SearchQuery,
        @ConnectedSocket() client: Socket,
    ) {
        this.logger.log(`Search query received: ${data.query}`);

        try {
            // Enviar progreso inicial
            client.emit('search:progress', {
                status: 'started',
                message: 'Iniciando búsqueda...',
            });

            let results;

            // Ejecutar búsqueda según el tipo
            switch (data.type) {
                case 'fuzzy':
                    client.emit('search:progress', {
                        status: 'processing',
                        message: 'Ejecutando búsqueda difusa...',
                    });
                    results = await this.searchService.fuzzySearch(
                        data.query,
                        data.threshold || 0.7,
                        data.language,
                    );
                    break;

                case 'pattern':
                    client.emit('search:progress', {
                        status: 'processing',
                        message: 'Ejecutando búsqueda por patrón...',
                    });
                    results = await this.searchService.searchByPattern(
                        JSON.parse(data.query),
                        data.language,
                    );
                    break;

                default:
                    client.emit('search:progress', {
                        status: 'processing',
                        message: 'Ejecutando búsqueda semántica...',
                    });
                    results = await this.searchService.semanticSearch(
                        data.query,
                        data.language,
                    );
            }

            // Enviar resultados
            client.emit('search:results', {
                results,
                count: results.length,
                query: data.query,
            });

            // Enviar completado
            client.emit('search:complete', {
                status: 'success',
                message: `Búsqueda completada. ${results.length} resultados encontrados.`,
            });

            this.logger.log(`Search completed: ${results.length} results`);
        } catch (error) {
            this.logger.error(`Search failed: ${error.message}`);

            client.emit('search:error', {
                status: 'error',
                message: error.message,
            });
        }
    }

    @SubscribeMessage('search:cancel')
    handleCancel(@ConnectedSocket() client: Socket) {
        this.logger.log('Search cancelled by client');
        client.emit('search:cancelled', {
            status: 'cancelled',
            message: 'Búsqueda cancelada',
        });
    }

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
}
