import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { TipoUsuario } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../database/prisma.service.js';
import { AuthUser } from './decorators/current-user.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

const SALT_ROUNDS = 10;

const PROFILE_SELECT = {
  id: true,
  nome: true,
  email: true,
  cargo: true,
  criadoEm: true,
  atualizadoEm: true,
};

function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === code
  );
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Já existia na develop
  async getProfile(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async create(dto: CreateUserDto, actor: AuthUser) {
    this.assertAdmin(actor);

    const senha = await hash(dto.senha, SALT_ROUNDS);

    try {
      return await this.prisma.usuario.create({
        data: { nome: dto.nome, email: dto.email, senha, cargo: dto.cargo },
        select: PROFILE_SELECT,
      });
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        throw new ConflictException('Este e-mail já está em uso.');
      }
      throw error;
    }
  }

  async findAll(query: ListUsersQueryDto, actor: AuthUser) {
    this.assertAdmin(actor);

    const { page, limit, search } = query;

    const where = search
      ? {
          OR: [
            { nome: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: PROFILE_SELECT,
        orderBy: { nome: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, actor: AuthUser) {
    this.assertAdmin(actor);
    return this.getProfile(id);
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const isAdmin = actor.cargo === TipoUsuario.ADMIN;

    if (!isAdmin && actor.id !== id) {
      throw new ForbiddenException('Você só pode alterar a própria conta.');
    }

    if (!isAdmin && dto.cargo !== undefined) {
      throw new ForbiddenException('Apenas administradores podem alterar o cargo.');
    }

    if (dto.nome === undefined && dto.email === undefined && dto.cargo === undefined) {
      throw new BadRequestException('Informe ao menos um campo para atualizar.');
    }

    try {
      return await this.prisma.usuario.update({
        where: { id },
        data: { nome: dto.nome, email: dto.email, cargo: dto.cargo },
        select: PROFILE_SELECT,
      });
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        throw new ConflictException('Este e-mail já está em uso.');
      }
      if (hasPrismaCode(error, 'P2025')) {
        throw new NotFoundException('Usuário não encontrado.');
      }
      throw error;
    }
  }

  async remove(id: string, actor: AuthUser) {
    this.assertAdmin(actor);

    if (actor.id === id) {
      throw new BadRequestException('Você não pode excluir a própria conta.');
    }

    try {
      await this.prisma.usuario.delete({ where: { id } });
    } catch (error) {
      if (hasPrismaCode(error, 'P2025')) {
        throw new NotFoundException('Usuário não encontrado.');
      }
      if (hasPrismaCode(error, 'P2003')) {
        throw new ConflictException(
          'Este usuário possui eventos vinculados e não pode ser excluído.',
        );
      }
      throw error;
    }

    return { message: 'Usuário removido com sucesso.' };
  }

  private assertAdmin(actor: AuthUser) {
    if (actor.cargo !== TipoUsuario.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem executar esta ação.');
    }
  }
}