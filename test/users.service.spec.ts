import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { describe, expect, it, vi } from 'vitest';
import { UsersService } from '../src/modules/users/users.service.js';

const admin = { id: 'admin-id', cargo: 'ADMIN' } as const;
const common = { id: 'user-id', cargo: 'USUARIO' } as const;

function createService() {
  const usuario = {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return { service: new UsersService({ usuario } as never), usuario };
}

const newUser = { nome: 'Ana', email: 'ana@ifsp.edu.br', senha: 'Senha@1234' };

describe('UsersService.create', () => {
  it('salva a senha criptografada, sem cargo, e nunca a retorna', async () => {
    const { service, usuario } = createService();
    usuario.create.mockResolvedValue({ id: '1', nome: 'Ana' });

    await service.create(newUser);

    const args = usuario.create.mock.calls[0][0];
    expect(args.data.senha).toMatch(/^\$2[aby]\$/);
    expect(args.data.senha).not.toBe(newUser.senha);
    expect(args.data).not.toHaveProperty('cargo');
    expect(args.select).not.toHaveProperty('senha');
  });

  it('lança ConflictException quando o e-mail já existe', async () => {
    const { service, usuario } = createService();
    usuario.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.create(newUser)).rejects.toBeInstanceOf(ConflictException);
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
    expect(usuario.findMany.mock.calls[0][0].select).not.toHaveProperty('senha');
  });

  it('bloqueia quem não é ADMIN', async () => {
    const { service } = createService();

    await expect(service.findAll({ page: 1, limit: 10 }, common)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('UsersService.findOne', () => {
  it('retorna o usuário pelo ID sem selecionar a senha', async () => {
    const { service, usuario } = createService();
    usuario.findUnique.mockResolvedValue({ id: '1', nome: 'Ana' });

    await expect(service.findOne('1', admin)).resolves.toEqual({ id: '1', nome: 'Ana' });
    expect(usuario.findUnique.mock.calls[0][0].select).not.toHaveProperty('senha');
  });

  it('lança NotFoundException quando não existe', async () => {
    const { service, usuario } = createService();
    usuario.findUnique.mockResolvedValue(null);

    await expect(service.findOne('x', admin)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('bloqueia quem não é ADMIN', async () => {
    const { service } = createService();

    await expect(service.findOne('1', common)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('UsersService.update', () => {
  it('permite ao usuário alterar a própria conta', async () => {
    const { service, usuario } = createService();
    usuario.update.mockResolvedValue({ id: common.id, nome: 'Novo' });

    await expect(service.update(common.id, { nome: 'Novo' }, common)).resolves.toEqual({
      id: common.id,
      nome: 'Novo',
    });
    expect(usuario.update.mock.calls[0][0].data).not.toHaveProperty('cargo');
  });

  it('impede alterar a conta de outro usuário', async () => {
    const { service, usuario } = createService();

    await expect(service.update('outro-id', { nome: 'X' }, common)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(usuario.update).not.toHaveBeenCalled();
  });

  it('impede até o ADMIN de alterar a conta de outro usuário', async () => {
    const { service, usuario } = createService();

    await expect(service.update('outro-id', { nome: 'X' }, admin)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(usuario.update).not.toHaveBeenCalled();
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

    await expect(service.update(common.id, { nome: 'Ana' }, common)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('UsersService.update (senha)', () => {
  it('altera a senha quando a senha atual está correta', async () => {
    const { service, usuario } = createService();
    usuario.findUnique.mockResolvedValue({ senha: await hash('SenhaAtual@1', 4) });
    usuario.update.mockResolvedValue({ id: common.id });

    await service.update(common.id, { senhaAtual: 'SenhaAtual@1', senha: 'SenhaNova@1' }, common);

    const args = usuario.update.mock.calls[0][0];
    expect(args.data.senha).toMatch(/^\$2[aby]\$/);
    expect(args.data.senha).not.toBe('SenhaNova@1');
    expect(args.select).not.toHaveProperty('senha');
  });

  it('rejeita quando a senha atual está incorreta', async () => {
    const { service, usuario } = createService();
    usuario.findUnique.mockResolvedValue({ senha: await hash('SenhaAtual@1', 4) });

    await expect(
      service.update(common.id, { senhaAtual: 'Errada@123', senha: 'SenhaNova@1' }, common),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuario.update).not.toHaveBeenCalled();
  });

  it('exige a senha atual para trocar a senha', async () => {
    const { service, usuario } = createService();

    await expect(
      service.update(common.id, { senha: 'SenhaNova@1' }, common),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuario.update).not.toHaveBeenCalled();
  });

  it('rejeita nova senha igual à atual', async () => {
    const { service, usuario } = createService();
    usuario.findUnique.mockResolvedValue({ senha: await hash('SenhaAtual@1', 4) });

    await expect(
      service.update(common.id, { senhaAtual: 'SenhaAtual@1', senha: 'SenhaAtual@1' }, common),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuario.update).not.toHaveBeenCalled();
  });

  it('lança NotFoundException quando o usuário não existe', async () => {
    const { service, usuario } = createService();
    usuario.findUnique.mockResolvedValue(null);

    await expect(
      service.update(common.id, { senhaAtual: 'SenhaAtual@1', senha: 'SenhaNova@1' }, common),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('impede alterar a senha de outro usuário', async () => {
    const { service, usuario } = createService();

    await expect(
      service.update('outro-id', { senhaAtual: 'SenhaAtual@1', senha: 'SenhaNova@1' }, admin),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(usuario.findUnique).not.toHaveBeenCalled();
  });
});

describe('UsersService.remove', () => {
  it('permite ao usuário excluir a própria conta', async () => {
    const { service, usuario } = createService();
    usuario.delete.mockResolvedValue({});

    await expect(service.remove(common.id, common)).resolves.toEqual({
      message: 'Usuário removido com sucesso.',
    });
    expect(usuario.delete).toHaveBeenCalledWith({ where: { id: common.id } });
  });

  it('impede usuário comum de excluir outra conta', async () => {
    const { service, usuario } = createService();

    await expect(service.remove('outro-id', common)).rejects.toBeInstanceOf(ForbiddenException);
    expect(usuario.delete).not.toHaveBeenCalled();
  });

  it('permite ao ADMIN excluir qualquer conta', async () => {
    const { service, usuario } = createService();
    usuario.delete.mockResolvedValue({});

    await service.remove('outro-id', admin);

    expect(usuario.delete).toHaveBeenCalledWith({ where: { id: 'outro-id' } });
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