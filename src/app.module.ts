import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { envValidationSchema } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { InstituicoesModule } from './modules/instituicoes/instituicoes.module.js';

import { UsersModule } from './modules/users/users.module.js';
import { InstitutionsModule } from './modules/institutions/institutions.module.js';

import { CalendarioModule } from './modules/calendario/calendario.module.js';
import { DocumentosModule } from './modules/documentos/documentos.module.js';
import { HomenagensModule } from './modules/homenagens/homenagens.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { InteracoesModule } from './modules/interacoes/interacoes.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    UsersModule,
    EventsModule,
    InstitutionsModule,
    HomenagensModule,
    CalendarioModule,
    DocumentosModule,
    InteracoesModule,
  ],
})
export class AppModule {}
