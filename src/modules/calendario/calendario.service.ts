import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { CreateEventoDto } from './dto/create-evento.dto.js';
import { QueryEventoDto } from './dto/query-evento.dto.js';
import { UpdateEventoDto } from './dto/update-evento.dto.js';

@Injectable()
export class CalendarioService {
  constructor(private readonly prisma: PrismaService) {}

  private validarDatas(inicio?: string, fim?: string) {
    if (inicio && fim && new Date(fim) < new Date(inicio)) {
      throw new BadRequestException('dataFim não pode ser anterior a dataInicio');
    }
  }

  create(dto: CreateEventoDto) {
    this.validarDatas(dto.dataInicio, dto.dataFim);
    return this.prisma.eventoCalendario.create({
      data: {
        ...dto,
        dataInicio: new Date(dto.dataInicio),
        dataFim: dto.dataFim ? new Date(dto.dataFim) : null,
      },
    });
  }

  findAll({ ano, mes, tipo, campus }: QueryEventoDto) {
    const where: Prisma.EventoCalendarioWhereInput = {};
    const and: Prisma.EventoCalendarioWhereInput[] = [];

    if (tipo) where.tipo = tipo;
    if (campus) where.campus = { equals: campus, mode: 'insensitive' };

    if (ano && mes) {
      const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
      const fimMes = new Date(Date.UTC(ano, mes, 1));
      and.push(
        { dataInicio: { lt: fimMes } },
        {
          OR: [
            { dataFim: { gte: inicioMes } },
            { dataFim: null, dataInicio: { gte: inicioMes } },
          ],
        },
      );
    } else if (ano) {
      where.anoLetivo = ano;
    }

    if (and.length) where.AND = and;

    return this.prisma.eventoCalendario.findMany({
      where,
      orderBy: { dataInicio: 'asc' },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.eventoCalendario.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Evento não encontrado');
    return item;
  }

  async update(id: number, dto: UpdateEventoDto) {
    const atual = await this.findOne(id);
    this.validarDatas(
      dto.dataInicio ?? atual.dataInicio.toISOString(),
      dto.dataFim ?? atual.dataFim?.toISOString(),
    );
    return this.prisma.eventoCalendario.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.dataInicio && { dataInicio: new Date(dto.dataInicio) }),
        ...(dto.dataFim && { dataFim: new Date(dto.dataFim) }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.eventoCalendario.delete({ where: { id } });
  }
}
