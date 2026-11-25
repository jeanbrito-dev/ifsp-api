
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class ComentariosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async verificarEvento(eventoId: string) {
    const evento = await this.prisma.evento.findUnique({
      where: {
        id: eventoId,
      },
      select: {
        id: true,
      },
    });

    if (!evento) {
      throw new NotFoundException('Evento não encontrado.');
    }
  }

  async criar(
    usuarioId: string,
    eventoId: string,
    conteudo: string,
  ) {
    await this.verificarEvento(eventoId);

    return this.prisma.comentario.create({
      data: {
        usuarioId,
        eventoId,
        conteudo: conteudo.trim(),
      },

      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async listarPorEvento(eventoId: string) {
    await this.verificarEvento(eventoId);

    return this.prisma.comentario.findMany({
      where: {
        eventoId,
      },

      orderBy: {
        criadoEm: 'desc',
      },

      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async excluir(
    comentarioId: string,
    usuarioId: string,
    eventoId: string,
  ) {
    const comentario = await this.prisma.comentario.findUnique({
      where: {
        id: comentarioId,
      },
    });

    if (!comentario || comentario.eventoId !== eventoId) {
      throw new NotFoundException(
        'Comentário não encontrado.',
      );
    }

    if (comentario.usuarioId !== usuarioId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este comentário.',
      );
    }

    return this.prisma.comentario.delete({
      where: {
        id: comentarioId,
      },
    });
  }
}
