import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async semanticSearch(query: string, language?: string) {
    const normalizedQuery = query.toLowerCase().trim();

    // Build where clause for language filtering
    const languageFilter = language ? { language } : {};

    // Search in subject, predicate, and object fields
    const results = await this.prisma.triple.findMany({
      where: {
        ...languageFilter,
        OR: [
          {
            subject: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            predicate: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            object: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        document: {
          select: {
            id: true,
            filename: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit results
    });

    return results;
  }

  async advancedSemanticSearch(query: string, language?: string) {
    // This method can be extended for more advanced semantic matching
    // For now, it uses the basic search
    return this.semanticSearch(query, language);
  }
}
