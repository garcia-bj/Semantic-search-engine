import { fusekiConfig } from '../../../config/fuseki.config';

export class SparqlQueryBuilder {
    private selectVars: string[] = [];
    private wherePatterns: string[] = [];
    private filters: string[] = [];
    private limitValue?: number;
    private offsetValue?: number;
    private orderByClause?: string;

    /**
     * Agrega variables a SELECT
     */
    select(...vars: string[]): this {
        this.selectVars.push(...vars);
        return this;
    }

    /**
     * Agrega un patrón WHERE
     */
    where(subject: string, predicate: string, object: string): this {
        this.wherePatterns.push(`${subject} ${predicate} ${object} .`);
        return this;
    }

    /**
     * Agrega un filtro
     */
    filter(condition: string): this {
        this.filters.push(`FILTER(${condition})`);
        return this;
    }

    /**
     * Agrega filtro de búsqueda por texto
     */
    filterTextSearch(variable: string, searchTerm: string): this {
        const escapedTerm = searchTerm.replace(/"/g, '\\"');
        this.filters.push(`FILTER(regex(str(${variable}), "${escapedTerm}", "i"))`);
        return this;
    }

    /**
     * Agrega filtro de idioma
     */
    filterLanguage(variable: string, language: string): this {
        this.filters.push(`FILTER(lang(${variable}) = "${language}")`);
        return this;
    }

    /**
     * Establece LIMIT
     */
    limit(value: number): this {
        this.limitValue = value;
        return this;
    }

    /**
     * Establece OFFSET
     */
    offset(value: number): this {
        this.offsetValue = value;
        return this;
    }

    /**
     * Establece ORDER BY
     */
    orderBy(variable: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
        this.orderByClause = `ORDER BY ${direction}(${variable})`;
        return this;
    }

    /**
     * Construye la query SPARQL
     */
    build(): string {
        const prefixes = this.getPrefixes();
        const selectClause = `SELECT ${this.selectVars.length > 0 ? this.selectVars.join(' ') : '*'}`;
        const whereClause = `WHERE {\n  ${this.wherePatterns.join('\n  ')}\n  ${this.filters.join('\n  ')}\n}`;
        const orderBy = this.orderByClause || '';
        const limit = this.limitValue ? `LIMIT ${this.limitValue}` : '';
        const offset = this.offsetValue ? `OFFSET ${this.offsetValue}` : '';

        return `${prefixes}\n\n${selectClause}\n${whereClause}\n${orderBy}\n${limit}\n${offset}`.trim();
    }

    /**
     * Genera los prefijos SPARQL
     */
    private getPrefixes(): string {
        return Object.entries(fusekiConfig.prefixes)
            .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
            .join('\n');
    }

    /**
     * Crea una nueva instancia del builder
     */
    static create(): SparqlQueryBuilder {
        return new SparqlQueryBuilder();
    }
}

/**
 * Builder para queries SPARQL UPDATE
 */
export class SparqlUpdateBuilder {
    private insertTriples: string[] = [];
    private deleteTriples: string[] = [];
    private wherePatterns: string[] = [];

    /**
     * Agrega tripletas para INSERT
     */
    insert(subject: string, predicate: string, object: string): this {
        this.insertTriples.push(`${subject} ${predicate} ${object} .`);
        return this;
    }

    /**
     * Agrega tripletas para DELETE
     */
    delete(subject: string, predicate: string, object: string): this {
        this.deleteTriples.push(`${subject} ${predicate} ${object} .`);
        return this;
    }

    /**
     * Agrega patrón WHERE para DELETE/INSERT condicional
     */
    where(subject: string, predicate: string, object: string): this {
        this.wherePatterns.push(`${subject} ${predicate} ${object} .`);
        return this;
    }

    /**
     * Construye la query SPARQL UPDATE
     */
    build(): string {
        const prefixes = this.getPrefixes();
        let query = prefixes + '\n\n';

        if (this.deleteTriples.length > 0 && this.wherePatterns.length > 0) {
            query += `DELETE {\n  ${this.deleteTriples.join('\n  ')}\n}\n`;
        }

        if (this.insertTriples.length > 0 && this.wherePatterns.length > 0) {
            query += `INSERT {\n  ${this.insertTriples.join('\n  ')}\n}\n`;
        }

        if (this.wherePatterns.length > 0) {
            query += `WHERE {\n  ${this.wherePatterns.join('\n  ')}\n}`;
        } else if (this.insertTriples.length > 0) {
            query = `${prefixes}\n\nINSERT DATA {\n  ${this.insertTriples.join('\n  ')}\n}`;
        } else if (this.deleteTriples.length > 0) {
            query = `${prefixes}\n\nDELETE DATA {\n  ${this.deleteTriples.join('\n  ')}\n}`;
        }

        return query.trim();
    }

    /**
     * Genera los prefijos SPARQL
     */
    private getPrefixes(): string {
        return Object.entries(fusekiConfig.prefixes)
            .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
            .join('\n');
    }

    /**
     * Crea una nueva instancia del builder
     */
    static create(): SparqlUpdateBuilder {
        return new SparqlUpdateBuilder();
    }
}
