import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { ListEventsQueryDto } from './dto/list-events-query.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto) {
    const existing = await this.prisma.evento.findFirst({
      where: {
        titulo: { equals: dto.titulo, mode: 'insensitive' },
        inicioEm: dto.inicioEm,
        instituicaoId: dto.instituicaoId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Já existe um evento com este título, data de início e instituição.',
      );
    }

    return this.prisma.evento.create({ data: dto });
  }

  async findAll(query: ListEventsQueryDto) {
    const { page, limit, search, categoriaId } = query;

    const where = {
      ...(categoriaId ? { categoriaId } : {}),
      ...(search
        ? {
            OR: [
              { titulo: { contains: search, mode: 'insensitive' as const } },
              { descricao: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.evento.findMany({
        where,
        orderBy: { inicioEm: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.evento.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const event = await this.prisma.evento.findUnique({
      where: { id },
      include: { categoria: true, instituicao: true },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.findOne(id);

    return this.prisma.evento.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.evento.delete({
      where: { id },
    });

    return { message: 'Evento removido com sucesso.' };
  }
}
