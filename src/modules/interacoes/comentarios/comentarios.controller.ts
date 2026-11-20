
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';

import { CriarComentarioDto } from './criar-comentarios.dto.js';
import { ComentariosService } from './comentarios.service.js';

@ApiTags('Comentários')
@Controller('eventos/:eventoId/comentarios')
export class ComentariosController {
  constructor(
    private readonly comentariosService: ComentariosService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar um comentário em um evento' })
  async criar(
    @Param('eventoId', ParseUUIDPipe) eventoId: string,
    @Body() body: CriarComentarioDto,
  ) {
    return this.comentariosService.criar(
      body.usuarioId,
      eventoId,
      body.conteudo,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar comentários de um evento' })
  async listar(
    @Param('eventoId', ParseUUIDPipe) eventoId: string,
  ) {
    return this.comentariosService.listarPorEvento(eventoId);
  }

  @Delete(':comentarioId')
  @ApiOperation({ summary: 'Excluir um comentário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        usuarioId: { type: 'string', format: 'uuid' },
      },
      required: ['usuarioId'],
    },
  })
  async excluir(
    @Param('eventoId', ParseUUIDPipe) eventoId: string,
    @Param('comentarioId', ParseUUIDPipe) comentarioId: string,
    @Body() body: { usuarioId: string },
  ) {
    return this.comentariosService.excluir(
      comentarioId,
      body.usuarioId,
      eventoId,
    );
  }
}
