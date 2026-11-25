import 'reflect-metadata';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { hash as bcryptHash } from 'bcrypt';
import bcryptjs from 'bcryptjs';
import request from 'supertest';

import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { envValidationSchema } from '../src/config/env.validation.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { CategoriaDocumento, StatusEvento, TipoEvento, TipoUsuario } from '../src/generated/prisma/enums.js';
import { AuthController } from '../src/modules/auth/auth.controller.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { RegisterDto } from '../src/modules/auth/dto/register.dto.js';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard.js';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy.js';
import { CalendarioController } from '../src/modules/calendario/calendario.controller.js';
import { CalendarioService } from '../src/modules/calendario/calendario.service.js';
import { CreateEventoDto } from '../src/modules/calendario/dto/create-evento.dto.js';
import { DocumentosController } from '../src/modules/documentos/documentos.controller.js';
import { DocumentosService } from '../src/modules/documentos/documentos.service.js';
import { CreateDocumentoDto } from '../src/modules/documentos/dto/create-documento.dto.js';
import { CreateEventDto } from '../src/modules/events/dto/create-event.dto.js';
import { EventsController } from '../src/modules/events/events.controller.js';
import { EventsService } from '../src/modules/events/events.service.js';
import { CreateHomenagemDto } from '../src/modules/homenagens/dto/create-homenagem.dto.js';
import { HomenagensController } from '../src/modules/homenagens/homenagens.controller.js';
import { HomenagensService } from '../src/modules/homenagens/homenagens.service.js';
import { CreateInstitutionDto } from '../src/modules/institutions/dto/create-institution.dto.js';
import { InstitutionsController } from '../src/modules/institutions/institutions.controller.js';
import { InstitutionsService } from '../src/modules/institutions/institutions.service.js';
import { ComentariosController } from '../src/modules/interacoes/comentarios/comentarios.controller.js';
import { ComentariosService } from '../src/modules/interacoes/comentarios/comentarios.service.js';
import { CriarComentarioDto } from '../src/modules/interacoes/comentarios/criar-comentarios.dto.js';
import { CurtidasController } from '../src/modules/interacoes/curtidas/curtidas.controlles.js';
import { CurtidasService } from '../src/modules/interacoes/curtidas/curtidas.service.js';
import { CreateUserDto } from '../src/modules/users/dto/create-user.dto.js';
import { UsersController } from '../src/modules/users/users.controller.js';
import { UsersService } from '../src/modules/users/users.service.js';

const VALID_UUID_1 = '11111111-1111-4111-8111-111111111111';
const VALID_UUID_2 = '22222222-2222-4222-8222-222222222222';
const VALID_UUID_3 = '33333333-3333-4333-8333-333333333333';

function createPrismaMock() {
  const mock = {
    usuario: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    codigoResetSenha: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    evento: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    instituicao: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    instituicaoSeguidor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    eventoCalendario: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    homenagem: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    documento: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    comentario: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    curtida: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(async (operations) => {
      if (Array.isArray(operations)) {
        return Promise.all(operations);
      }
      return operations(mock);
    }),
  };

  return mock;
}

describe('1. Configuração de Ambiente e Filtro Global de Exceções', () => {
  describe('envValidationSchema', () => {
    it('valida configuração mínima válida e aplica defaults esperados', () => {
      const { error, value } = envValidationSchema.validate({
        DATABASE_URL: 'postgresql://ifsp_eventos:ifsp_eventos@localhost:5432/ifsp_eventos',
      });

      expect(error).toBeUndefined();
      expect(value.NODE_ENV).toBe('development');
      expect(value.PORT).toBe(3000);
      expect(value.SWAGGER_ENABLED).toBe(true);
      expect(value.JWT_EXPIRES_IN).toBe('7d');
    });

    it('rejeita ausência de DATABASE_URL ou protocolo inválido', () => {
      const missing = envValidationSchema.validate({});
      expect(missing.error).toBeDefined();

      const wrongScheme = envValidationSchema.validate({
        DATABASE_URL: 'mysql://root:aluno@localhost:3306/db',
      });
      expect(wrongScheme.error).toBeDefined();
    });

    it('rejeita NODE_ENV ou PORT inválidos', () => {
      const invalidEnv = envValidationSchema.validate({
        DATABASE_URL: 'postgresql://ifsp_eventos:ifsp_eventos@localhost:5432/db',
        NODE_ENV: 'staging',
        PORT: 99999,
      });

      expect(invalidEnv.error).toBeDefined();
    });
  });

  describe('HttpExceptionFilter', () => {
    function createHost(url = '/api/test', method = 'GET') {
      const json = jest.fn();
      const status = jest.fn().mockReturnValue({ json });
      const host = {
        switchToHttp: () => ({
          getResponse: () => ({ status }),
          getRequest: () => ({ url, method }),
        }),
      };
      return { host, status, json };
    }

    it('formata HttpException com statusCode, path, timestamp e error', () => {
      const filter = new HttpExceptionFilter();
      const { host, status, json } = createHost('/api/events/123', 'GET');

      filter.catch(new NotFoundException('Evento não encontrado.'), host);

      expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          path: '/api/events/123',
          timestamp: expect.any(String),
          error: expect.objectContaining({
            message: 'Evento não encontrado.',
            statusCode: 404,
          }),
        }),
      );
    });

    it('oculta detalhes internos e retorna 500 para erros inesperados', () => {
      const filter = new HttpExceptionFilter();
      const { host, status, json } = createHost('/api/internal', 'POST');
      const loggerErrorSpy = jest
        .spyOn(filter.logger, 'error')
        .mockImplementation(() => undefined);

      filter.catch(new Error('Falha sensível de driver SQL'), host);

      expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          path: '/api/internal',
          error: null,
        }),
      );
      expect(loggerErrorSpy).toHaveBeenCalled();
      loggerErrorSpy.mockRestore();
    });
  });
});

describe('2. Validações de DTOs via ValidationPipe Global', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  });

  const validateDto = (metatype, payload, type = 'body') =>
    pipe.transform(payload, { type, metatype });

  it('RegisterDto valida e-mail, tamanho mínimo de nome e senha', async () => {
    const valid = await validateDto(RegisterDto, {
      nome: 'Maria Silva',
      email: 'maria@ifsp.edu.br',
      senha: 'password123',
    });
    expect(valid).toBeInstanceOf(RegisterDto);

    await expect(
      validateDto(RegisterDto, {
        nome: 'Ma',
        email: 'email-invalido',
        senha: '123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('CreateUserDto aplica trim no nome, normaliza e-mail e rejeita campos extras', async () => {
    const transformed = await validateDto(CreateUserDto, {
      nome: '  Ana Souza  ',
      email: '  ANA@IFSP.EDU.BR ',
      senha: 'SenhaForte@1',
    });

    expect(transformed.nome).toBe('Ana Souza');
    expect(transformed.email).toBe('ana@ifsp.edu.br');

    await expect(
      validateDto(CreateUserDto, {
        nome: 'Ana Souza',
        email: 'ana@ifsp.edu.br',
        senha: 'SenhaForte@1',
        cargo: 'ADMIN',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('CreateEventDto transforma datas e valida UUIDs e enum StatusEvento', async () => {
    const valid = await validateDto(CreateEventDto, {
      titulo: 'Semana da Computação',
      descricao: 'Palestras e oficinas técnicas',
      inicioEm: '2026-12-01T14:00:00.000Z',
      finalEm: '2026-12-01T18:00:00.000Z',
      status: StatusEvento.PUBLICADO,
      instituicaoId: VALID_UUID_1,
      criadoPorId: VALID_UUID_2,
    });

    expect(valid.inicioEm).toBeInstanceOf(Date);
    expect(valid.finalEm).toBeInstanceOf(Date);

    await expect(
      validateDto(CreateEventDto, {
        titulo: 'AB',
        descricao: 'Curta',
        inicioEm: 'data-invalida',
        finalEm: '2026-12-01T18:00:00.000Z',
        status: 'INVALIDO',
        instituicaoId: 'nao-uuid',
        criadoPorId: VALID_UUID_2,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('CreateInstitutionDto normaliza slug e rejeita slug ou URL inválidos', async () => {
    const valid = await validateDto(CreateInstitutionDto, {
      nome: '  IFSP Caraguatatuba  ',
      slug: '  IFSP-Caraguatatuba ',
      logoUrl: 'https://imagens.ifsp.edu.br/wp-content/uploads/photo-gallery/Campus_CAR/thumb/Marca_IFSP_2015_Car_3.png?bwg=1724327442',
    });

    expect(valid.nome).toBe('IFSP Caraguatatuba');
    expect(valid.slug).toBe('ifsp-caraguatatuba');

    await expect(
      validateDto(CreateInstitutionDto, {
        nome: 'IFSP',
        slug: 'slug com espaco!',
        logoUrl: 'nao-e-url',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('CreateEventoDto (Calendário) valida intervalo de anoLetivo e enum TipoEvento', async () => {
    const valid = await validateDto(CreateEventoDto, {
      titulo: 'Início das aulas',
      dataInicio: '2026-02-09T08:00:00.000Z',
      tipo: TipoEvento.INICIO_AULAS,
      anoLetivo: '2026',
    });

    expect(valid.anoLetivo).toBe(2026);

    await expect(
      validateDto(CreateEventoDto, {
        titulo: 'Evento fora do limite',
        dataInicio: '1999-01-01',
        anoLetivo: 1999,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('CreateDocumentoDto converte ativo string e valida CategoriaDocumento', async () => {
    const valid = await validateDto(CreateDocumentoDto, {
      titulo: 'Edital 01/2026',
      categoria: CategoriaDocumento.EDITAL,
      ativo: 'true',
    });

    expect(valid.ativo).toBe(true);

    await expect(
      validateDto(CreateDocumentoDto, {
        titulo: '',
        categoria: 'INVALIDA',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('CreateHomenagemDto e CriarComentarioDto validam campos obrigatórios, URL e MaxLength', async () => {
    const homenagem = await validateDto(CreateHomenagemDto, {
      titulo: 'Docente Destaque',
      homenageado: 'Prof. Luiz',
      descricao: 'Contribuição acadêmica',
      fotoUrl: 'https://ifsp.edu.br/foto.jpg',
      data: '2026-10-15',
    });
    expect(homenagem.titulo).toBe('Docente Destaque');

    await expect(
      validateDto(CriarComentarioDto, {
        usuarioId: 'uuid-invalido',
        conteudo: 'x'.repeat(1001),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('3. Autenticação, JWT e Recuperação de Senha (AuthService & JwtStrategy)', () => {
  let prisma;
  let jwtService;
  let authService;
  let consoleErrorSpy;

  beforeEach(() => {
    prisma = createPrismaMock();
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('jwt-token-mock'),
    };
    authService = new AuthService(prisma, jwtService);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('register normaliza e-mail, criptografa senha com bcryptjs e retorna token', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.usuario.create.mockResolvedValue({
      id: VALID_UUID_1,
      nome: 'Helder Oliveira',
      email: 'helder@ifsp.edu.br',
      cargo: TipoUsuario.USUARIO,
      criadoEm: new Date(),
    });

    const result = await authService.register({
      nome: '  Helder Oliveira  ',
      email: '  HELDER@IFSP.EDU.BR ',
      senha: 'password123',
    });

    expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { email: 'helder@ifsp.edu.br' },
    });
    const createCall = prisma.usuario.create.mock.calls[0][0];
    expect(createCall.data.nome).toBe('Helder Oliveira');
    expect(createCall.data.email).toBe('helder@ifsp.edu.br');
    expect(createCall.data.senha).not.toBe('password123');
    expect(await bcryptjs.compare('password123', createCall.data.senha)).toBe(true);
    expect(createCall.select).not.toHaveProperty('senha');
    expect(result.accessToken).toBe('jwt-token-mock');
  });

  it('register lança ConflictException quando e-mail já está cadastrado', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ id: VALID_UUID_1 });

    await expect(
      authService.register({
        nome: 'Helder Oliveira',
        email: 'helder@ifsp.edu.br',
        senha: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('login autentica credenciais válidas e rejeita usuário/senha inválidos', async () => {
    const senhaHash = await bcryptjs.hash('Senha@123', 4);
    prisma.usuario.findUnique.mockResolvedValue({
      id: VALID_UUID_1,
      nome: 'Helder Oliveira',
      email: 'helder@ifsp.edu.br',
      senha: senhaHash,
      cargo: TipoUsuario.USUARIO,
      criadoEm: new Date(),
    });

    const ok = await authService.login({
      email: ' HELDER@IFSP.EDU.BR ',
      senha: 'Senha@123',
    });
    expect(ok.accessToken).toBe('jwt-token-mock');
    expect(ok.user).not.toHaveProperty('senha');

    await expect(
      authService.login({ email: 'helder@ifsp.edu.br', senha: 'errada' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    prisma.usuario.findUnique.mockResolvedValue(null);
    await expect(
      authService.login({ email: 'naoexiste@ifsp.edu.br', senha: 'Senha@123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('forgotPassword e resetPassword geram código temporário e invalidam código após uso', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: VALID_UUID_1,
      email: 'helder@ifsp.edu.br',
    });
    prisma.codigoResetSenha.create.mockResolvedValue({ id: 'code-1' });

    const forgotRes = await authService.forgotPassword({ email: 'helder@ifsp.edu.br' });
    expect(forgotRes.message).toContain('Se o e-mail informado estiver cadastrado');
    expect(prisma.codigoResetSenha.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        usuarioId: VALID_UUID_1,
        codigo: expect.stringMatching(/^\d{6}$/),
        expiraEm: expect.any(Date),
      }),
    });

    prisma.codigoResetSenha.findFirst.mockResolvedValue({
      id: 'code-1',
      usuarioId: VALID_UUID_1,
      codigo: '123456',
    });
    prisma.usuario.update.mockResolvedValue({});
    prisma.codigoResetSenha.update.mockResolvedValue({});

    const resetRes = await authService.resetPassword({
      email: 'helder@ifsp.edu.br',
      codigo: ' 123456 ',
      novaSenha: 'NovaSenha@123',
    });

    expect(resetRes).toEqual({ message: 'Senha alterada com sucesso!' });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.codigoResetSenha.update).toHaveBeenCalledWith({
      where: { id: 'code-1' },
      data: { usadoEm: expect.any(Date) },
    });
  });

  it('resetPassword rejeita código inválido ou expirado com BadRequestException', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ id: VALID_UUID_1 });
    prisma.codigoResetSenha.findFirst.mockResolvedValue(null);

    await expect(
      authService.resetPassword({
        email: 'helder@ifsp.edu.br',
        codigo: '000000',
        novaSenha: 'NovaSenha@123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('JwtStrategy.validate retorna o usuário ou lança UnauthorizedException se inexistente', async () => {
    const configService = { get: jest.fn().mockReturnValue('secret-test') };
    const strategy = new JwtStrategy(configService, prisma);

    prisma.usuario.findUnique.mockResolvedValue({
      id: VALID_UUID_1,
      nome: 'Helder',
      email: 'helder@ifsp.edu.br',
      cargo: TipoUsuario.USUARIO,
    });
    await expect(
      strategy.validate({ sub: VALID_UUID_1, email: 'helder@ifsp.edu.br', cargo: 'USUARIO' }),
    ).resolves.toMatchObject({ id: VALID_UUID_1 });

    prisma.usuario.findUnique.mockResolvedValue(null);
    await expect(
      strategy.validate({ sub: VALID_UUID_1, email: 'helder@ifsp.edu.br', cargo: 'USUARIO' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('4. Regras de Negócio e RBAC de Usuários (UsersService)', () => {
  let prisma;
  let service;
  const admin = { id: VALID_UUID_1, cargo: TipoUsuario.ADMIN };
  const comum = { id: VALID_UUID_2, cargo: TipoUsuario.USUARIO };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UsersService(prisma);
  });

  it('impede escalonamento de cargo e retorna ServiceUnavailableException se banco cair (P1001)', async () => {
    prisma.usuario.create.mockRejectedValue({ code: 'P1001' });

    await expect(
      service.create({ nome: 'Ana', email: 'ana@ifsp.edu.br', senha: 'Senha@1234' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('permite listagem apenas para ADMIN e valida metadados de paginação', async () => {
    await expect(service.findAll({ page: 1, limit: 10 }, comum)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    prisma.usuario.findMany.mockResolvedValue([{ id: VALID_UUID_2, nome: 'Ana' }]);
    prisma.usuario.count.mockResolvedValue(21);

    const page = await service.findAll({ page: 2, limit: 10, search: 'ana' }, admin);
    expect(page.meta).toEqual({ total: 21, page: 2, limit: 10, totalPages: 3 });
    expect(prisma.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('impede edição de conta de terceiros (até para ADMIN) e valida troca de senha', async () => {
    await expect(service.update(VALID_UUID_2, { nome: 'Hack' }, admin)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    await expect(service.update(VALID_UUID_2, {}, comum)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    const hashAtual = await bcryptHash('SenhaAtual@1', 4);
    prisma.usuario.findUnique.mockResolvedValue({ senha: hashAtual });

    await expect(
      service.update(
        VALID_UUID_2,
        { senhaAtual: 'SenhaAtual@1', senha: 'SenhaAtual@1' },
        comum,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.usuario.update.mockResolvedValue({ id: VALID_UUID_2, nome: 'Atualizado' });
    await expect(
      service.update(
        VALID_UUID_2,
        { senhaAtual: 'SenhaAtual@1', senha: 'SenhaNova@2' },
        comum,
      ),
    ).resolves.toMatchObject({ id: VALID_UUID_2 });
  });

  it('converte erro de FK (P2003) em ConflictException ao tentar remover usuário com eventos', async () => {
    prisma.usuario.delete.mockRejectedValue({ code: 'P2003' });

    await expect(service.remove(VALID_UUID_2, admin)).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('5. Eventos, Instituições e Seguidores (EventsService & InstitutionsService)', () => {
  let prisma;
  let eventsService;
  let institutionsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    eventsService = new EventsService(prisma);
    institutionsService = new InstitutionsService(prisma);
  });

  it('EventsService bloqueia evento duplicado na mesma data e instituição', async () => {
    prisma.evento.findFirst.mockResolvedValue({ id: VALID_UUID_1 });

    await expect(
      eventsService.create({
        titulo: 'Semana Tech',
        descricao: 'Evento anual',
        inicioEm: new Date('2026-12-01T14:00:00.000Z'),
        finalEm: new Date('2026-12-01T18:00:00.000Z'),
        instituicaoId: VALID_UUID_2,
        criadoPorId: VALID_UUID_3,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('EventsService lista com filtros e lança NotFoundException para ID inexistente', async () => {
    prisma.evento.findMany.mockResolvedValue([{ id: VALID_UUID_1, titulo: 'Feira' }]);
    prisma.evento.count.mockResolvedValue(1);

    const res = await eventsService.findAll({
      page: 1,
      limit: 10,
      search: 'Feira',
      categoriaId: VALID_UUID_2,
    });
    expect(res.meta.totalPages).toBe(1);

    prisma.evento.findUnique.mockResolvedValue(null);
    await expect(eventsService.findOne(VALID_UUID_1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('InstitutionsService impede slug duplicado e remoção de instituição com eventos vinculados', async () => {
    prisma.instituicao.findUnique.mockResolvedValue({ id: VALID_UUID_1 });
    await expect(
      institutionsService.create({ nome: 'IFSP', slug: 'ifsp-sp' }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.instituicao.findUnique.mockResolvedValue({ id: VALID_UUID_1, slug: 'ifsp-sp' });
    prisma.evento.count.mockResolvedValue(2);
    await expect(institutionsService.remove(VALID_UUID_1)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('InstitutionsService gerencia follow/unfollow e trata duplicidade (P2002)', async () => {
    prisma.instituicao.findUnique.mockResolvedValue({ id: VALID_UUID_1, slug: 'ifsp' });
    prisma.instituicaoSeguidor.findUnique.mockResolvedValue(null);
    prisma.instituicaoSeguidor.create.mockRejectedValue({ code: 'P2002' });

    await expect(
      institutionsService.followInstitution(VALID_UUID_2, VALID_UUID_1),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.instituicaoSeguidor.deleteMany.mockResolvedValue({ count: 0 });
    await expect(
      institutionsService.unfollowInstitution(VALID_UUID_2, VALID_UUID_1),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.instituicaoSeguidor.deleteMany.mockResolvedValue({ count: 1 });
    await expect(
      institutionsService.unfollowInstitution(VALID_UUID_2, VALID_UUID_1),
    ).resolves.toEqual({ message: 'Você deixou de seguir a instituição.' });
  });
});

describe('6. Calendário, Homenagens, Documentos e Interações Sociais', () => {
  let prisma;
  let calendarioService;
  let homenagensService;
  let documentosService;
  let comentariosService;
  let curtidasService;

  beforeEach(() => {
    prisma = createPrismaMock();
    calendarioService = new CalendarioService(prisma);
    homenagensService = new HomenagensService(prisma);
    documentosService = new DocumentosService(prisma);
    comentariosService = new ComentariosService(prisma);
    curtidasService = new CurtidasService(prisma);
  });

  it('CalendarioService rejeita dataFim anterior a dataInicio no create e no update', async () => {
    expect(() =>
      calendarioService.create({
        titulo: 'Provas',
        dataInicio: '2026-06-10T00:00:00.000Z',
        dataFim: '2026-06-05T00:00:00.000Z',
        anoLetivo: 2026,
      }),
    ).toThrow(BadRequestException);

    prisma.eventoCalendario.findUnique.mockResolvedValue({
      id: 1,
      dataInicio: new Date('2026-06-10T00:00:00.000Z'),
      dataFim: null,
    });

    await expect(
      calendarioService.update(1, { dataFim: '2026-06-01T00:00:00.000Z' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('HomenagensService realiza paginação e lança NotFoundException quando não encontrada', async () => {
    prisma.homenagem.findMany.mockResolvedValue([{ id: 1, titulo: 'Mérito' }]);
    prisma.homenagem.count.mockResolvedValue(1);

    const res = await homenagensService.findAll({ page: 1, limit: 10, busca: 'mérito' });
    expect(res).toEqual({ items: [{ id: 1, titulo: 'Mérito' }], total: 1, page: 1, totalPages: 1 });

    prisma.homenagem.findUnique.mockResolvedValue(null);
    await expect(homenagensService.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('DocumentosService exige PDF no create e oculta documentos inativos quando apenasAtivos=true', async () => {
    await expect(
      documentosService.create(
        { titulo: 'Edital', categoria: CategoriaDocumento.EDITAL },
        undefined,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.documento.findUnique.mockResolvedValue({ id: 10, ativo: false });
    await expect(documentosService.findOne(10, true)).rejects.toBeInstanceOf(NotFoundException);
    await expect(documentosService.findOne(10, false)).resolves.toMatchObject({ id: 10 });
  });

  it('ComentariosService valida usuário/evento e bloqueia exclusão por não-autor ou evento divergente', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    await expect(
      comentariosService.criar(VALID_UUID_1, VALID_UUID_2, 'Ótimo evento!'),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.comentario.findUnique.mockResolvedValue({
      id: VALID_UUID_3,
      usuarioId: VALID_UUID_1,
      eventoId: VALID_UUID_2,
    });

    await expect(
      comentariosService.excluir(VALID_UUID_3, VALID_UUID_1, '99999999-9999-4999-8999-999999999999'),
    ).rejects.toBeInstanceOf(NotFoundException);

    await expect(
      comentariosService.excluir(VALID_UUID_3, '88888888-8888-4888-8888-888888888888', VALID_UUID_2),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('CurtidasService realiza upsert idempotente e lança NotFoundException ao descurtir inexistente', async () => {
    prisma.usuario.findUnique.mockResolvedValue({ id: VALID_UUID_1 });
    prisma.evento.findUnique.mockResolvedValue({ id: VALID_UUID_2 });
    prisma.curtida.upsert.mockResolvedValue({
      id: VALID_UUID_3,
      usuarioId: VALID_UUID_1,
      eventoId: VALID_UUID_2,
    });

    const curtida = await curtidasService.curtir(VALID_UUID_1, VALID_UUID_2);
    expect(curtida.eventoId).toBe(VALID_UUID_2);

    prisma.curtida.findUnique.mockResolvedValue(null);
    await expect(curtidasService.descurtir(VALID_UUID_1, VALID_UUID_2)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('7. Testes HTTP de Integração (Controllers + Pipes + Guards + Filtro Global)', () => {
  let app;
  let prisma;
  let jwtService;
  let consoleErrorSpy;

  beforeAll(async () => {
    prisma = createPrismaMock();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: 'jest-test-secret-ifsp-2026',
              JWT_EXPIRES_IN: '1h',
              DATABASE_URL: 'postgresql://ifsp_eventos:ifsp_eventos@localhost:5432/test',
            }),
          ],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'jest-test-secret-ifsp-2026',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [
        AuthController,
        UsersController,
        EventsController,
        InstitutionsController,
        CalendarioController,
        HomenagensController,
        DocumentosController,
        ComentariosController,
        CurtidasController,
      ],
      providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        UsersService,
        EventsService,
        InstitutionsService,
        CalendarioService,
        HomenagensService,
        DocumentosService,
        ComentariosService,
        CurtidasService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    consoleErrorSpy.mockRestore();
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/auth/register retorna 201 para payload válido e 400 para campo não permitido', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);
    prisma.usuario.create.mockResolvedValue({
      id: VALID_UUID_1,
      nome: 'Aluno IFSP',
      email: 'aluno@ifsp.edu.br',
      cargo: TipoUsuario.USUARIO,
      criadoEm: new Date().toISOString(),
    });

    const okRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nome: 'Aluno IFSP',
        email: 'aluno@ifsp.edu.br',
        senha: 'password123',
      })
      .expect(201);

    expect(okRes.body.accessToken).toEqual(expect.any(String));
    expect(okRes.body.user.email).toBe('aluno@ifsp.edu.br');

    const badRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        nome: 'Aluno IFSP',
        email: 'aluno@ifsp.edu.br',
        senha: 'password123',
        cargo: 'ADMIN',
      })
      .expect(400);

    expect(badRes.body).toMatchObject({
      statusCode: 400,
      path: '/api/auth/register',
    });
  });

  it('GET /api/auth/me exige Bearer JWT válido (401 sem token, 200 com token válido)', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);

    const token = await jwtService.signAsync({
      sub: VALID_UUID_1,
      email: 'aluno@ifsp.edu.br',
      cargo: TipoUsuario.USUARIO,
    });

    prisma.usuario.findUnique
      .mockResolvedValueOnce({
        id: VALID_UUID_1,
        nome: 'Aluno IFSP',
        email: 'aluno@ifsp.edu.br',
        cargo: TipoUsuario.USUARIO,
      })
      .mockResolvedValueOnce({
        id: VALID_UUID_1,
        nome: 'Aluno IFSP',
        email: 'aluno@ifsp.edu.br',
        cargo: TipoUsuario.USUARIO,
        criadoEm: new Date().toISOString(),
        atualizadoEm: null,
      });

    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      id: VALID_UUID_1,
      email: 'aluno@ifsp.edu.br',
    });
  });

  it('GET /api/events/:id valida ParseUUIDPipe (400) e formato de erro 404 do filtro global', async () => {
    await request(app.getHttpServer()).get('/api/events/id-invalido').expect(400);

    prisma.evento.findUnique.mockResolvedValue(null);
    const notFound = await request(app.getHttpServer())
      .get(`/api/events/${VALID_UUID_1}`)
      .expect(404);

    expect(notFound.body).toMatchObject({
      statusCode: 404,
      path: `/api/events/${VALID_UUID_1}`,
      timestamp: expect.any(String),
    });
  });

  it('POST /api/events cria evento válido (201) e rejeita payload incompleto (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/events')
      .send({ titulo: 'Só título' })
      .expect(400);

    prisma.evento.findFirst.mockResolvedValue(null);
    prisma.evento.create.mockResolvedValue({
      id: VALID_UUID_1,
      titulo: 'Hackathon IFSP',
      descricao: 'Maratona de programação',
      instituicaoId: VALID_UUID_2,
      criadoPorId: VALID_UUID_3,
    });

    const created = await request(app.getHttpServer())
      .post('/api/events')
      .send({
        titulo: 'Hackathon IFSP',
        descricao: 'Maratona de programação',
        inicioEm: '2026-12-01T14:00:00.000Z',
        finalEm: '2026-12-01T20:00:00.000Z',
        instituicaoId: VALID_UUID_2,
        criadoPorId: VALID_UUID_3,
      })
      .expect(201);

    expect(created.body.titulo).toBe('Hackathon IFSP');
  });

  it('POST /api/institutions/:id/follow retorna 401 quando CurrentUser não está autenticado', async () => {
    await request(app.getHttpServer())
      .post(`/api/institutions/${VALID_UUID_1}/follow`)
      .expect(401);
  });

  it('POST /api/calendario e GET /api/eventos/:eventoId/curtidas/contagem validam entrada e resposta', async () => {
    await request(app.getHttpServer())
      .post('/api/calendario')
      .send({
        titulo: 'Feriado',
        dataInicio: '2026-05-10T00:00:00.000Z',
        dataFim: '2026-05-01T00:00:00.000Z',
        anoLetivo: 2026,
      })
      .expect(400);

    prisma.eventoCalendario.create.mockResolvedValue({
      id: 1,
      titulo: 'Recesso Escolar',
      anoLetivo: 2026,
    });

    await request(app.getHttpServer())
      .post('/api/calendario')
      .send({
        titulo: 'Recesso Escolar',
        dataInicio: '2026-07-01T00:00:00.000Z',
        dataFim: '2026-07-15T00:00:00.000Z',
        tipo: TipoEvento.RECESSO,
        anoLetivo: 2026,
      })
      .expect(201);

    prisma.curtida.count.mockResolvedValue(42);
    const countRes = await request(app.getHttpServer())
      .get(`/api/eventos/${VALID_UUID_1}/curtidas/contagem`)
      .expect(200);

    expect(countRes.body).toEqual({ total: 42 });
  });
});
