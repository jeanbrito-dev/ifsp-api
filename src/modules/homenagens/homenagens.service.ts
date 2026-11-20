import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateHomenagemDto } from './dto/create-homenagem.dto.js';
import { QueryHomenagemDto } from './dto/query-homenagem.dto.js';
import { UpdateHomenagemDto } from './dto/update-homenagem.dto.js';

@Injectable()
export class HomenagensService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateHomenagemDto, userId?: number) {
    return this.prisma.homenagem.create({
      data: { ...dto, data: new Date(dto.data), criadoPorId: userId },
    });
  }

  async findAll({ page = 1, limit = 10, busca }: QueryHomenagemDto) {
    const where = busca
      ? {
          OR: [
            { titulo: { contains: busca, mode: 'insensitive' as const } },
            { homenageado: { contains: busca, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.homenagem.findMany({
        where,
        orderBy: { data: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.homenagem.count({ where }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number) {
    const item = await this.prisma.homenagem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Homenagem não encontrada');
    return item;
  }

  async update(id: number, dto: UpdateHomenagemDto) {
    await this.findOne(id);
    return this.prisma.homenagem.update({
      where: { id },
      data: { ...dto, ...(dto.data && { data: new Date(dto.data) }) },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.homenagem.delete({ where: { id } });
  }
}
