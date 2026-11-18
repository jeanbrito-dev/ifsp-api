import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../../database/prisma.service.js';

describe('AuthService', () => {
  let authService: AuthService;

  const mockPrisma = {
    usuario: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    codigoResetSenha: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('fake-jwt-token'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(
      mockPrisma as unknown as PrismaService,
      mockJwtService as unknown as JwtService
    );
  });

  describe('register', () => {
    it('deve cadastrar um novo usuário com sucesso e retornar o token', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);
      mockPrisma.usuario.create.mockResolvedValue({
        id: 'user-uuid-1',
        nome: 'Aluno Teste',
        email: 'aluno@ifsp.edu.br',
        cargo: 'USUARIO',
        criadoEm: new Date(),
      });

      const result = await authService.register({
        nome: 'Aluno Teste',
        email: 'aluno@ifsp.edu.br',
        senha: 'password123',
      });

      expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'aluno@ifsp.edu.br' },
      });
      expect(mockPrisma.usuario.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('fake-jwt-token');
      expect(result.user.email).toBe('aluno@ifsp.edu.br');
    });

    it('deve lançar ConflictException se o e-mail já estiver cadastrado', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'aluno@ifsp.edu.br',
      });

      await expect(
        authService.register({
          nome: 'Outro Aluno',
          email: 'aluno@ifsp.edu.br',
          senha: 'password123',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('deve autenticar com sucesso quando credenciais forem válidas', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrisma.usuario.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        nome: 'Aluno Teste',
        email: 'aluno@ifsp.edu.br',
        senha: hashedPassword,
        cargo: 'USUARIO',
        criadoEm: new Date(),
      });

      const result = await authService.login({
        email: 'aluno@ifsp.edu.br',
        senha: 'password123',
      });

      expect(result.accessToken).toBe('fake-jwt-token');
      expect(result.user.nome).toBe('Aluno Teste');
    });

    it('deve lançar UnauthorizedException se a senha for incorreta', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword', 10);
      mockPrisma.usuario.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'aluno@ifsp.edu.br',
        senha: hashedPassword,
      });

      await expect(
        authService.login({
          email: 'aluno@ifsp.edu.br',
          senha: 'wrongPassword',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se o usuário não for encontrado', async () => {
      mockPrisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'inexistente@ifsp.edu.br',
          senha: 'qualquersenha',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
