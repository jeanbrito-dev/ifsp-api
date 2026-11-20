
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { CurtidasService } from './curtidas.service.js';

@ApiTags('Curtidas')
@Controller('eventos/:eventoId/curtidas')
export class CurtidasController {
  constructor(
    private readonly curtidasService: CurtidasService,
  ) {}

  @Post(':usuarioId')
  @ApiOperation({ summary: 'Curtir um evento' })
  async curtir(
    @Param('eventoId', ParseUUIDPipe) eventoId: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
  ) {
    return this.curtidasService.curtir(usuarioId, eventoId);
  }

  @Delete(':usuarioId')
  @ApiOperation({ summary: 'Remover curtida de um evento' })
  async descurtir(
    @Param('eventoId', ParseUUIDPipe) eventoId: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
  ) {
    return this.curtidasService.descurtir(usuarioId, eventoId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar curtidas de um evento' })
  async listar(
    @Param('eventoId', ParseUUIDPipe) eventoId: string,
  ) {
    return this.curtidasService.listarPorEvento(eventoId);
  }

  @Get('contagem')
  @ApiOperation({ summary: 'Contar curtidas de um evento' })
  async contar(
    @Param('eventoId', ParseUUIDPipe) eventoId: string,
  ) {
    return {
      total: await this.curtidasService.contarPorEvento(eventoId),
    };
  }
}
