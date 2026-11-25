import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateInstituicaoDto } from './dto/create-instituicao.dto.js';
import { UpdateInstituicaoDto } from './dto/update-instituicao.dto.js';

@Injectable()
export class InstituicoesService {
  private readonly logger = new Logger(InstituicoesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(busca?: string) {
    const where = busca
      ? {
          OR: [
            { nome: { contains: busca, mode: 'insensitive' as const } },
            { slug: { contains: busca, mode: 'insensitive' as const } },
            { descricao: { contains: busca, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.instituicao.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: {
        _count: {
          select: { eventos: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const instituicao = await this.prisma.instituicao.findUnique({
      where: { id },
      include: {
        _count: {
          select: { eventos: true },
        },
      },
    });

    if (!instituicao) {
      throw new NotFoundException(`Instituição com ID "${id}" não encontrada`);
    }

    return instituicao;
  }

  async findBySlug(slug: string) {
    const instituicao = await this.prisma.instituicao.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      include: {
        _count: {
          select: { eventos: true },
        },
      },
    });

    if (!instituicao) {
      throw new NotFoundException(`Instituição com slug "${slug}" não encontrada`);
    }

    return instituicao;
  }

  async create(dto: CreateInstituicaoDto) {
    const normalizedSlug = dto.slug.trim().toLowerCase();

    const existingSlug = await this.prisma.instituicao.findUnique({
      where: { slug: normalizedSlug },
    });

    if (existingSlug) {
      throw new ConflictException(
        `Já existe uma instituição cadastrada com o slug "${normalizedSlug}"`,
      );
    }

    const created = await this.prisma.instituicao.create({
      data: {
        nome: dto.nome.trim(),
        slug: normalizedSlug,
        descricao: dto.descricao?.trim() || null,
        logoUrl: dto.logoUrl?.trim() || null,
      },
    });

    this.logger.log(`Instituição "${created.nome}" cadastrada com sucesso (ID: ${created.id})`);
    return created;
  }

  async update(id: string, dto: UpdateInstituicaoDto) {
    await this.findOne(id);

    if (dto.slug) {
      const normalizedSlug = dto.slug.trim().toLowerCase();
      const existingSlug = await this.prisma.instituicao.findUnique({
        where: { slug: normalizedSlug },
      });

      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictException(
          `Já existe outra instituição cadastrada com o slug "${normalizedSlug}"`,
        );
      }
    }

    return this.prisma.instituicao.update({
      where: { id },
      data: {
        ...(dto.nome ? { nome: dto.nome.trim() } : {}),
        ...(dto.slug ? { slug: dto.slug.trim().toLowerCase() } : {}),
        ...(dto.descricao !== undefined ? { descricao: dto.descricao?.trim() || null } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl?.trim() || null } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const eventosCount = await this.prisma.evento.count({
      where: { instituicaoId: id },
    });

    if (eventosCount > 0) {
      throw new ConflictException(
        `Não é possível excluir esta instituição pois existem ${eventosCount} evento(s) vinculados a ela`,
      );
    }

    await this.prisma.instituicao.delete({
      where: { id },
    });

    this.logger.log(`Instituição com ID "${id}" excluída com sucesso`);
    return { message: 'Instituição excluída com sucesso' };
  }
}
