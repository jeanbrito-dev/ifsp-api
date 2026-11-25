
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { ComentariosController } from './comentarios/comentarios.controller.js';
import { ComentariosService } from './comentarios/comentarios.service.js';

import { CurtidasController } from './curtidas/curtidas.controlles.js';
import { CurtidasService } from './curtidas/curtidas.service.js';

@Module({
  imports: [AuthModule],

  controllers: [
    ComentariosController,
    CurtidasController,
  ],

  providers: [
    ComentariosService,
    CurtidasService,
  ],
})
export class InteracoesModule {}
