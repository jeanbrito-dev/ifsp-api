import { Module } from '@nestjs/common';
import { InstituicoesController } from './instituicoes.controller.js';
import { InstituicoesService } from './instituicoes.service.js';

@Module({
  controllers: [InstituicoesController],
  providers: [InstituicoesService],
  exports: [InstituicoesService],
})
export class InstituicoesModule {}

