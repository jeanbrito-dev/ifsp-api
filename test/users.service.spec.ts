import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UsersService } from '../src/modules/users/users.service.js';

const admin = { id: 'admin-id', cargo: 'ADMIN' } as const;
const common = { id: 'user-id', cargo: 'USUARIO' } as const;

function createService(mocks: Record<string, ReturnType<typeof vi.fn>> = {}) {
  const usuario = {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...mocks,
  };
  return { service: new UsersService({ usuario } as never), usuario };
}

const newUser = { nome: 'Ana', email: 'ana@ifsp.edu.br', senha: 'Senha@1234' };

describe('UsersService.create', () => {
  it('salva a senha criptografada e nunca a retorna', async () => {
    const { service, usuario } = createService();
    usuario.create.mockResolvedValue({ id: '1', nome: 'Ana' });

    await service.create(newUser, admin);

    expect(usuario.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'ana@ifsp.edu.br',
        senha: expect.stringMatching(/^\$2[aby]\$/),
      }),
      select: expect.not.objectContaining({ senha: true }),
    });
  });

  it('lança ConflictException quando o e-mail já existe', async () => {
    const { service, usuario } = createService();
    usuario.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.create(newUser, admin)).rejects.toBeInstanceOf(ConflictException);
  });

  it('bloqueia quem não é ADMIN', async () => {
    const { service, usuario } = createService();

    await expect(service.create(newUser, common)).rejects.toBeInstanceOf(ForbiddenException);
    expect(usuario.create).not.toHaveBeenCalled();
  });
});

describe('UsersService.findAll', () => {
  it('retorna a lista paginada sem selecionar a senha', async () => {
    const { service, usuario } = createService();
    usuario.findMany.mockResolvedValue([{ id: '1' }]);
    usuario.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 10 }, admin);

    expect(result).toEqual({
      data: [{ id: '1' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    expect(usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: expect.not.objectContaining({ senha: true }) }),
    );
  });

  it('bloqueia quem não é ADMIN', async () => {
    const { service } = createService();

    await expect(service.findAll({ page: 1, limit: 10 }, common)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('UsersService.findOne', () => {
  it('retorna o usuário pelo ID', async () => {
    const { service, usuario } = createService();
    usuario.findUnique.mockResolvedValue({ id: '1', nome: 'Ana' });

    await expect(service.findOne('1', admin)).resolves.toEqual({ id: '1', nome: 'Ana' });
    expect(usuario.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      select: expect.not.objectContaining({ senha: true }),
    });
  });

  it('lança NotFoundException quando não existe', async () => {
    const { service, usuario } = createService();
    usuario.findUnique.mockResolvedValue(null);

    await expect(service.findOne('x', admin)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('UsersService.update', () => {
  it('permite ao usuário alterar o próprio nome', async () => {
    const { service, usuario } = createService();
    usuario.update.mockResolvedValue({ id: common.id, nome: 'Novo' });

    await expect(service.update(common.id, { nome: 'Novo' }, common)).resolves.toEqual({
      id: common.id,
      nome: 'Novo',
    });
  });

  it('impede alterar a conta de outro usuário', async () => {
    const { service, usuario } = createService();

    await expect(service.update('outro-id', { nome: 'X' }, common)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(usuario.update).not.toHaveBeenCalled();
  });

  it('impede usuário comum de alterar o cargo', async () => {
    const { service } = createService();

    await expect(service.update(common.id, { cargo: 'ADMIN' }, common)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('permite ao ADMIN alterar o cargo de outro usuário', async () => {
    const { service, usuario } = createService();
    usuario.update.mockResolvedValue({ id: 'outro-id', cargo: 'ADMIN' });

    await service.update('outro-id', { cargo: 'ADMIN' }, admin);

    expect(usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'outro-id' } }),
    );
  });

  it('rejeita requisição sem nenhum campo', async () => {
    const { service } = createService();

    await expect(service.update(common.id, {}, common)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('converte P2002 em ConflictException', async () => {
    const { service, usuario } = createService();
    usuario.update.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.update(common.id, { email: 'x@ifsp.edu.br' }, common),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('converte P2025 em NotFoundException', async () => {
    const { service, usuario } = createService();
    usuario.update.mockRejectedValue({ code: 'P2025' });

    await expect(service.update('id-x', { nome: 'Ana' }, admin)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('UsersService.remove', () => {
  it('exclui o usuário e retorna mensagem', async () => {
    const { service, usuario } = createService();
    usuario.delete.mockResolvedValue({});

    await expect(service.remove('outro-id', admin)).resolves.toEqual({
      message: 'Usuário removido com sucesso.',
    });
    expect(usuario.delete).toHaveBeenCalledWith({ where: { id: 'outro-id' } });
  });

  it('bloqueia quem não é ADMIN', async () => {
    const { service, usuario } = createService();

    await expect(service.remove('outro-id', common)).rejects.toBeInstanceOf(ForbiddenException);
    expect(usuario.delete).not.toHaveBeenCalled();
  });

  it('impede o ADMIN de excluir a própria conta', async () => {
    const { service } = createService();

    await expect(service.remove(admin.id, admin)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('converte P2025 em NotFoundException', async () => {
    const { service, usuario } = createService();
    usuario.delete.mockRejectedValue({ code: 'P2025' });

    await expect(service.remove('id-x', admin)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('converte P2003 (eventos vinculados) em ConflictException', async () => {
    const { service, usuario } = createService();
    usuario.delete.mockRejectedValue({ code: 'P2003' });

    await expect(service.remove('id-x', admin)).rejects.toBeInstanceOf(ConflictException);
  });
});