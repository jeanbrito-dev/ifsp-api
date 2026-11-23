import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service.js';

@Injectable()
export class CurtidasService {
  constructor(private readonly prisma: PrismaService) {}

  async curtir(usuarioId: string, eventoId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const evento = await this.prisma.evento.findUnique({
      where: { id: eventoId },
    });

    if (!evento) {
      throw new NotFoundException('Evento não encontrado.');
    }

    return this.prisma.curtida.upsert({
      where: {
        usuarioId_eventoId: {
          usuarioId,
          eventoId,
        },
      },
      create: {
        usuarioId,
        eventoId,
      },
      update: {},
    });
  }

  async descurtir(usuarioId: string, eventoId: string) {
    const curtida = await this.prisma.curtida.findUnique({
      where: {
        usuarioId_eventoId: {
          usuarioId,
          eventoId,
        },
      },
    });

    if (!curtida) {
      throw new NotFoundException('Curtida não encontrada.');
    }

    return this.prisma.curtida.delete({
      where: {
        usuarioId_eventoId: {
          usuarioId,
          eventoId,
        },
      },
    });
  }

  async listarPorEvento(eventoId: string) {
    return this.prisma.curtida.findMany({
      where: { eventoId },
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

  async contarPorEvento(eventoId: string) {
    return this.prisma.curtida.count({
      where: { eventoId },
    });
  }
}