
import 'dotenv/config';
import { hash } from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { TipoUsuario } from '../src/generated/prisma/enums.js';

const email = process.env.ADMIN_EMAIL;
if (!email) {
  throw new Error('Configure ADMIN_EMAIL no .env');
}

const senha = process.env.ADMIN_PASSWORD;
if (!senha) {
  throw new Error('Configure ADMIN_PASSWORD no .env');
}

const nome = process.env.ADMIN_NAME ?? 'Administrador IFSP';

if (process.env.ALLOW_ADMIN_CREATION !== 'true') {
  throw new Error('Criação de administradores desabilitada.');
}

if (!process.env.DATABASE_URL) {
  throw new Error('Configure DATABASE_URL no .env');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const existente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existente) {
    await prisma.usuario.update({
      where: { email },
      data: { cargo: TipoUsuario.ADMIN },
    });

    console.log(`Usuário ${email} promovido para ADMIN.`);
    return;
  }

  const senhaHash = await hash(senha, 10);

  await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: senhaHash,
      cargo: TipoUsuario.ADMIN,
    },
  });

  console.log(`Administrador ${email} criado com sucesso.`);
}

main()
  .catch((error: unknown) => {
    console.error('Erro ao configurar administrador:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
