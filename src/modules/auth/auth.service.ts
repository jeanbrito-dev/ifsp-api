import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail');
    }

    const hashedPassword = await bcrypt.hash(dto.senha, 10);

    const user = await this.prisma.usuario.create({
      data: {
        nome: dto.nome.trim(),
        email: normalizedEmail,
        senha: hashedPassword,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        criadoEm: true,
      },
    });

    const payload = { sub: user.id, email: user.email, cargo: user.cargo };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      user,
      accessToken,
    };
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const isPasswordValid = await bcrypt.compare(dto.senha, user.senha);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const payload = { sub: user.id, email: user.email, cargo: user.cargo };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
        criadoEm: user.criadoEm,
      },
      accessToken,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        cargo: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expiraEm = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      await this.prisma.codigoResetSenha.create({
        data: {
          codigo,
          expiraEm,
          usuarioId: user.id,
        },
      });

      this.logger.log(`Código de recuperação gerado para ${normalizedEmail}: ${codigo}`);
    }

    return {
      message:
        'Se o e-mail informado estiver cadastrado, um código de verificação foi enviado.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new BadRequestException('Código inválido ou expirado');
    }

    const codeRecord = await this.prisma.codigoResetSenha.findFirst({
      where: {
        usuarioId: user.id,
        codigo: dto.codigo.trim(),
        usadoEm: null,
        expiraEm: { gt: new Date() },
      },
      orderBy: { criadoEm: 'desc' },
    });

    if (!codeRecord) {
      throw new BadRequestException('Código inválido ou expirado');
    }

    const hashedPassword = await bcrypt.hash(dto.novaSenha, 10);

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: user.id },
        data: { senha: hashedPassword },
      }),
      this.prisma.codigoResetSenha.update({
        where: { id: codeRecord.id },
        data: { usadoEm: new Date() },
      }),
    ]);

    return {
      message: 'Senha alterada com sucesso!',
    };
  }
}

