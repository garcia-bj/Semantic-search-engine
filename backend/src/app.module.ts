import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./modules/database/prisma.module";
import { OntologyModule } from "./modules/ontology/ontology.module";
import { SearchModule } from "./modules/search/search.module";
import { DbpediaModule } from "./modules/dbpedia/dbpedia.module";
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
    PrismaModule,
    OntologyModule,
    SearchModule,
    DbpediaModule,
  ],
})
export class AppModule { }
