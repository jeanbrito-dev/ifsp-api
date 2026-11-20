
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { TipoUsuario } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../database/prisma.service.js';
import { AuthUser } from './decorators/current-user.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

const SALT_ROUNDS = 10;

const USER_SELECT = {
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
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateUserDto) {
    const senha = await hash(dto.senha, SALT_ROUNDS);

    try {
      return await this.prisma.usuario.create({
        data: { nome: dto.nome, email: dto.email, senha },
        select: USER_SELECT,
      });
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        throw new ConflictException('Este e-mail já está em uso.');
      }

      this.handleDatabaseError(error);
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

    try {
      const [data, total] = await Promise.all([
        this.prisma.usuario.findMany({
          where,
          select: USER_SELECT,
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
    } catch (error) {
      this.handleDatabaseError(error);
    }
  }

  async findOne(id: string, actor: AuthUser) {
    if (actor.cargo !== TipoUsuario.ADMIN && actor.id !== id) {
      throw new ForbiddenException(
        'Você só pode consultar o próprio perfil.',
      );
    }

    this.assertAdmin(actor);

    try {
      const user = await this.prisma.usuario.findUnique({
        where: { id },
        select: USER_SELECT,
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDatabaseError(error);
    }
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    if (actor.id !== id) {
      throw new ForbiddenException('Você só pode alterar a própria conta.');
    }

    if (dto.nome === undefined && dto.email === undefined && dto.senha === undefined) {
      throw new BadRequestException('Informe ao menos um campo para atualizar.');
    }

    let novoHash: string | undefined;

    if (dto.senha !== undefined) {
      if (!dto.senhaAtual) {
        throw new BadRequestException('Informe a senha atual para alterar a senha.');
      }

      let current;

      try {
        current = await this.prisma.usuario.findUnique({
          where: { id },
          select: { senha: true },
        });
      } catch (error) {
        this.handleDatabaseError(error);
      }

      if (!current) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      const matches = await compare(dto.senhaAtual, current.senha);

      if (!matches) {
        throw new BadRequestException('Senha atual incorreta.');
      }

      if (dto.senha === dto.senhaAtual) {
        throw new BadRequestException('A nova senha deve ser diferente da atual.');
      }

      novoHash = await hash(dto.senha, SALT_ROUNDS);
    }

    try {
      return await this.prisma.usuario.update({
        where: { id },
        data: { nome: dto.nome, email: dto.email, senha: novoHash },
        select: USER_SELECT,
      });
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        throw new ConflictException('Este e-mail já está em uso.');
      }

      if (hasPrismaCode(error, 'P2025')) {
        throw new NotFoundException('Usuário não encontrado.');
      }

      this.handleDatabaseError(error);
    }
  }

  async remove(id: string, actor: AuthUser) {
    const isAdmin = actor.cargo === TipoUsuario.ADMIN;

    if (!isAdmin && actor.id !== id) {
      throw new ForbiddenException('Você só pode excluir a própria conta.');
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

      this.handleDatabaseError(error);
    }

    return { message: 'Usuário removido com sucesso.' };
  }

  private handleDatabaseError(error: unknown): never {
    const unavailableCodes = [
      'P1000',
      'P1001',
      'P1002',
      'P1008',
      'P1017',
      'P2024',
    ];

    if (
      unavailableCodes.some((code) => hasPrismaCode(error, code))
    ) {
      throw new ServiceUnavailableException(
        'O banco de dados está temporariamente indisponível. Tente novamente mais tarde.',
      );
    }

    throw error;
  }

  private assertAdmin(actor: AuthUser) {
    if (actor.cargo !== TipoUsuario.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem executar esta ação.',
      );
    }
  }
}
