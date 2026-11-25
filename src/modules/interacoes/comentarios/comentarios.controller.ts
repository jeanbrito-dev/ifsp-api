
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

import {
  AuthenticatedUser,
  CurrentUser,
} from '../../auth/decorators/current-user.decorator.js';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

import { CriarComentarioDto } from './criar-comentarios.dto.js';
import { ComentariosService } from './comentarios.service.js';

@ApiTags('Comentários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('eventos/:eventoId/comentarios')
export class ComentariosController {
  constructor(
    private readonly comentariosService: ComentariosService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar comentários de um evento',
  })
  async listar(
    @Param('eventoId', ParseUUIDPipe) eventoId: string,
  ) {
    return this.comentariosService.listarPorEvento(eventoId);
  }

  @Post()
  @ApiOperation({
    summary: 'Criar comentário em um evento',
  })
  async criar(
    @Param('eventoId', ParseUUIDPipe) eventoId: string,
    @Body() dto: CriarComentarioDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comentariosService.criar(
      user.id,
      eventoId,
      dto.conteudo,
    );
  }

  @Delete(':comentarioId')
  @ApiOperation({
    summary: 'Excluir comentário próprio',
  })
  async excluir(
    @Param('eventoId', ParseUUIDPipe) eventoId: string,
    @Param('comentarioId', ParseUUIDPipe) comentarioId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comentariosService.excluir(
      comentarioId,
      user.id,
      eventoId,
    );
  }
}
