import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { UsersService } from '../src/modules/users/users.service.js';

function createService(found: unknown) {
  const findUnique = vi.fn().mockResolvedValue(found);
  const prisma = { usuario: { findUnique } };
  return { service: new UsersService(prisma as never), findUnique };
}

describe('UsersService.getProfile', () => {
  it('retorna o perfil do usuário', async () => {
    const profile = { id: 'abc', nome: 'Ana', email: 'ana@ifsp.edu.br', cargo: 'USUARIO' };
    const { service } = createService(profile);

    await expect(service.getProfile('abc')).resolves.toEqual(profile);
  });

  it('nunca seleciona a senha', async () => {
    const { service, findUnique } = createService({ id: 'abc' });

    await service.getProfile('abc');

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'abc' },
      select: expect.not.objectContaining({ senha: true }),
    });
  });

  it('lança NotFoundException quando o usuário não existe', async () => {
    const { service } = createService(null);

    await expect(service.getProfile('inexistente')).rejects.toBeInstanceOf(NotFoundException);
  });
});