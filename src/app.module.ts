import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CalendarioModule } from './calendario/calendario.module.js';
import { DocumentosModule } from './documentos/documentos.module.js';
import { HomenagensModule } from './homenagens/homenagens.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { InteracoesModule } from './interacoes/interacoes.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    DatabaseModule,
    UsersModule,
    EventsModule,
    HomenagensModule,
    CalendarioModule,
    DocumentosModule,
    InteracoesModule,
  ],
})
export class AppModule {}