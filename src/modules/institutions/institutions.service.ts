import { ListInstitutionFollowersQueryDto } from './dto/list-institution-followers-query.dto.js';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import { CreateInstitutionDto } from './dto/create-institution.dto.js';
import { UpdateInstitutionDto } from './dto/update-institution.dto.js';
import { ListInstitutionsQueryDto } from './dto/list-institutions-query.dto.js';

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Criar instituição
  async create(dto: CreateInstitutionDto) {
    const existing = await this.prisma.instituicao.findUnique({
      where: { slug: dto.slug },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Já existe uma instituição com este slug.');
    }

    return this.prisma.instituicao.create({
      data: dto,
      include: {
        _count: {
          select: {
            eventos: true,
            seguidores: true,
          },
        },
      },
    });
  }

  // Listar instituições com paginação e pesquisa
  async findAll(query: ListInstitutionsQueryDto) {
    const { page, limit, search } = query;

    const where = search
      ? {
          OR: [
            {
              nome: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              descricao: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.instituicao.findMany({
        where,
        include: {
          _count: {
            select: {
              eventos: true,
              seguidores: true,
            },
          },
        },
        orderBy: {
          nome: 'asc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.instituicao.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Consultar detalhes de uma instituição
  async findOne(id: string) {
    const institution = await this.prisma.instituicao.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            eventos: true,
            seguidores: true,
          },
        },
      },
    });

    if (!institution) {
      throw new NotFoundException('Instituição não encontrada.');
    }

    return institution;
  }

  // Atualizar instituição
  async update(id: string, dto: UpdateInstitutionDto) {
    const institution = await this.findOne(id);

    if (dto.slug && dto.slug !== institution.slug) {
      const existing = await this.prisma.instituicao.findUnique({
        where: { slug: dto.slug },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException('Já existe uma instituição com este slug.');
      }
    }

    return this.prisma.instituicao.update({
      where: { id },
      data: dto,
      include: {
        _count: {
          select: {
            eventos: true,
            seguidores: true,
          },
        },
      },
    });
  }

  // Excluir instituição
  async remove(id: string) {
    await this.findOne(id);

    const eventCount = await this.prisma.evento.count({
      where: { instituicaoId: id },
    });

    if (eventCount > 0) {
      throw new ConflictException(
        'Não é possível excluir uma instituição que possui eventos associados.',
      );
    }

    await this.prisma.instituicao.delete({
      where: { id },
    });

    return {
      message: 'Instituição removida com sucesso.',
    };
  }

  // Seguir uma instituição
  async followInstitution(userId: string, institutionId: string) {
    await this.findOne(institutionId);

    const existing = await this.prisma.instituicaoSeguidor.findUnique({
      where: {
        usuarioId_instituicaoId: {
          usuarioId: userId,
          instituicaoId: institutionId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Você já está seguindo esta instituição.');
    }

    try {
      return await this.prisma.instituicaoSeguidor.create({
        data: {
          usuarioId: userId,
          instituicaoId: institutionId,
        },
        include: {
          instituicao: {
            select: {
              id: true,
              nome: true,
              slug: true,
              logoUrl: true,
            },
          },
        },
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Você já está seguindo esta instituição.');
      }

      throw error;
    }
  }

  // Deixar de seguir uma instituição
  async unfollowInstitution(userId: string, institutionId: string) {
    await this.findOne(institutionId);

    const result = await this.prisma.instituicaoSeguidor.deleteMany({
      where: {
        usuarioId: userId,
        instituicaoId: institutionId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Você não está seguindo esta instituição.');
    }

    return {
      message: 'Você deixou de seguir a instituição.',
    };
  }

  // Listar seguidores de uma instituição
  async findFollowers(institutionId: string, query: ListInstitutionFollowersQueryDto) {
    await this.findOne(institutionId);

    const { page, limit } = query;

    const where = {
      instituicaoId: institutionId,
    };

    const [data, total] = await Promise.all([
      this.prisma.instituicaoSeguidor.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          criadoEm: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.instituicaoSeguidor.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
