# IFSP Eventos API

API independente do sistema, destinada ao repositório `ifsp-eventos-api`. É a única aplicação autorizada a acessar o PostgreSQL e define o contrato consumido por mobile e admin.

## Stack

NestJS 11, TypeScript, Prisma ORM 7, PostgreSQL 17, Docker Compose, JWT/Passport (futuro), bcrypt (futuro), Class Validator/Transformer, Swagger, Helmet, Throttler, Vitest e Nodemailer (futuro).

## Primeira execução

```powershell
Copy-Item .env.example .env
docker compose up -d
npm ci
npm run prisma:generate
npm run start:dev
```

A API atende em `http://localhost:3000/api` e o Swagger em `http://localhost:3000/docs`. Confirme que Docker Desktop está aberto antes do `docker compose up -d`; use `docker compose ps` para conferir o healthcheck do PostgreSQL.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | sim | conexão PostgreSQL; não commitar produção |
| `PORT` | não | porta HTTP, padrão 3000 |
| `CORS_ORIGINS` | não | origens separadas por vírgula |
| `SWAGGER_ENABLED` | não | desligue somente onde a liderança aprovar |
| `NODE_ENV` | não | development, test ou production |

## Arquitetura

```text
src/common/       filtros, guards, decorators e interceptors genéricos
src/config/       validação e leitura de configuração
src/database/     PrismaService e módulo global
src/modules/      módulos existentes da API
src/{homenagens,calendario,documentos}/ módulos do Panorama IFSP
prisma/           schema e migrations somente versionadas
src/generated/    Prisma Client gerado; não editar manualmente
test/             testes de integração e unitários
```

Cada domínio deverá seguir `modules/<domain>/{<domain>.module,<domain>.controller,<domain>.service,dto/}`. Controllers não contêm regras de negócio; services não manipulam `Request`/`Response`; DTOs validam entrada; acesso ao banco ocorre via `PrismaService`.

## Banco e Prisma 7

O schema contém os modelos existentes da API e os modelos de Homenagens, Calendário Acadêmico e Documentos/Editais. Ao modelar uma mudança, atualize schema, gere migration nomeada, revise o SQL e execute:

```powershell
npm run prisma:migrate -- --name <descricao-em-kebab-case>
npm run prisma:generate
```

Não altere migrations aplicadas. O client Prisma é gerado em `src/generated/prisma` e usa o adaptador `@prisma/adapter-pg`, obrigatório no Prisma 7.

## Contrato, respostas e segurança

Todas as rotas usam `/api`, `ValidationPipe` global e whitelist. Erros passam pelo filtro global e retornam `statusCode`, `path`, `timestamp` e `error`. Documente cada endpoint no Swagger, incluindo códigos de erro. Novas rotas protegidas devem usar guard JWT e autorização por papel; nunca implementem autorização somente no frontend. Helmet, CORS configurável e rate limiting já estão ativos.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `npm run start:dev` | servidor com recarga |
| `npm run prisma:validate` | valida schema |
| `npm run prisma:generate` | gera client |
| `npm run prisma:migrate` | cria/aplica migration de desenvolvimento |
| `npm run lint`, `typecheck`, `test`, `build` | verificações obrigatórias |

## Branches planejadas

Todas partem de `develop`; migrations e mudança de contrato precisam estar no mesmo PR da API.

| Branch | Escopo |
| --- | --- |
| `chore/api-project-setup` | CI, tooling e documentação técnica |
| `feature/auth-jwt` | usuários base, senha, JWT, refresh e e-mail |
| `feature/users` | perfil, preferências e dados do usuário |
| `feature/institutions` | instituições e vínculo administrativo |
| `feature/categories` | categorias de eventos |
| `feature/events` | eventos, publicação, busca e filtros |
| `feature/comments-favorites-followers` | interações sociais |
| `feature/content-modules` | Panorama, homenagens, calendário e documentos |
| `feature/admin-permissions` | RBAC e auditoria administrativa |
| `test/api-integration` | cobertura de contratos e fluxos críticos |

## ESTRUTURA FINAL DA API

Os módulos previstos são autenticação, usuários, categorias, instituições, eventos, seguidores, favoritos, comentários, homenagens, calendário, documentos/editais, Panorama IFSP e permissões administrativas. A ordem final depende dos contratos aprovados e das issues do projeto.

## Módulo de Autenticação (Documentação de Alterações)

Implementação do módulo de autenticação integrado ao PostgreSQL através do Prisma ORM (`Usuario` e `CodigoResetSenha`), com hashing de senha via bcrypt, emissão e validação de tokens JWT via Passport, DTOs validados via class-validator, documentação no Swagger e cobertura por testes unitários no Vitest.

### Endpoints Disponíveis (`/api/auth`)

| Método | Rota | Proteção | Descrição |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Pública | Cadastra um novo usuário, gera o hash seguro da senha e retorna dados do perfil e token JWT. |
| `POST` | `/api/auth/login` | Pública | Valida credenciais no banco de dados e retorna o token de acesso JWT. |
| `POST` | `/api/auth/forgot-password` | Pública | Gera código aleatório com validade temporária associado ao usuário na tabela `CodigoResetSenha`. |
| `POST` | `/api/auth/reset-password` | Pública | Valida o código, atualiza o hash da nova senha no banco e invalida o código utilizado. |
| `GET` | `/api/auth/me` | Bearer JWT | Retorna o perfil completo do usuário autenticado a partir do token. |

### Arquivos Alterados

| Arquivo | Descrição |
| --- | --- |
| `src/app.module.ts` | Importação e registro global do `AuthModule`. |
| `src/main.ts` | Configuração de autenticação Bearer no Swagger UI (`addBearerAuth`). |
| `src/config/env.validation.ts` | Adição de validação para `JWT_SECRET` e `JWT_EXPIRES_IN`. |
| `.env` / `.env.example` | Definição das variáveis de ambiente para assinatura e expiração de JWT. |
| `package.json` | Instalação de dependências: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcryptjs`. |

### Arquivos Criados

| Arquivo | Descrição |
| --- | --- |
| `src/modules/auth/auth.module.ts` | Módulo NestJS configurando Passport, JwtModule e exportando serviços e guards. |
| `src/modules/auth/auth.service.ts` | Regras de negócio, consultas Prisma e criptografia para autenticação. |
| `src/modules/auth/auth.controller.ts` | Rotas REST e anotações Swagger para o módulo `/auth`. |
| `src/modules/auth/auth.service.spec.ts` | Testes unitários com Vitest cobrindo fluxos de login, cadastro e erros. |
| `src/modules/auth/guards/jwt-auth.guard.ts` | Guard de autenticação para proteção de rotas privadas. |
| `src/modules/auth/strategies/jwt.strategy.ts` | Estratégia Passport para validação do payload JWT e consulta do usuário. |
| `src/modules/auth/decorators/current-user.decorator.ts` | Decorator customizado para injeção do usuário autenticado no controller. |
| `src/modules/auth/dto/login.dto.ts` | Validação de entrada para login (e-mail e senha). |
| `src/modules/auth/dto/register.dto.ts` | Validação de entrada para cadastro (nome, e-mail e senha). |
| `src/modules/auth/dto/forgot-password.dto.ts` | Validação de entrada para solicitação de código de recuperação. |
| `src/modules/auth/dto/reset-password.dto.ts` | Validação de entrada para redefinição com código e nova senha. |

### Comandos para Inclusão na Branch `feature/auth-jwt`

```powershell
cd ifsp-api

# Criar ou alternar para a branch planejada:
git checkout -b feature/auth-jwt

# Adicionar arquivos alterados e criados:
git add .env.example package.json package-lock.json README.md src/

# Realizar o commit:
git commit -m "feat(auth): modulo completo de autenticacao JWT, bcrypt e integracao Prisma"
```
### Teste Back-end (Helder)
#### Alterações realizadas
- package.json:
  . Adicionadas as dependências de desenvolvimento jest, ts-jest e @types/jest.
  . Atualizados os scripts: test e test:jest executam node --experimental-vm-modules node_modules/jest/bin/jest.js; o runner anterior foi mantido em test:vitest.
- jest.config.mjs:
   . Configurado para ambiente node, módulos ESM (extensionsToTreatAsEsm: ['.ts']), mapeamento de imports .js para arquivos .ts (NodeNext), testMatch: ['<rootDir>/test/test.js'] e ts-jest com useESM: true.
   . Prisma Client: gerado em src/generated/prisma via prisma generate para resolução dos enums e tipos do schema.
   . test/test.js (37 testes em 7 blocos):
     1 - Ambiente e Filtro Global (envValidationSchema e HttpExceptionFilter): validação de DATABASE_URL/defaults e formatação de erros HTTP e erro 500 sem vazamento de detalhes internos.
     2 - DTOs via ValidationPipe (whitelist, transform, forbidNonWhitelisted): validação e transformação de
     - RegisterDto, 
     - CreateUserDto, 
     - CreateEventDto, 
     - CreateInstitutionDto, 
     - CreateEventoDto, 
     - CreateDocumentoDto, 
     - CreateHomenagemDto e 
     - CriarComentarioDto.
     3 - Autenticação e JWT (AuthService e JwtStrategy): normalização de e-mail, hash bcryptjs, emissão de token, conflito de e-mail (ConflictException), credenciais inválidas (UnauthorizedException), forgotPassword/resetPassword com $transaction e validação de payload JWT.
     4 - Usuários e RBAC (UsersService): restrição ADMIN em findAll, bloqueio de alteração de terceiros, regras de troca de senha e mapeamento de códigos Prisma (P1001 → 503, P2003 → 409).
     5 - Eventos, Instituições e Seguidores (EventsService e InstitutionsService): bloqueio de evento duplicado e slug duplicado, exclusão com eventos vinculados e fluxos de follow/unfollow.
     6 - Conteúdo e Interações (CalendarioService, HomenagensService, DocumentosService, ComentariosService e CurtidasService): validação de datas, paginação, obrigatoriedade de PDF, ocultação de inativos, autoria na exclusão de comentários e upsert idempotente de curtidas.
     7 - Integração HTTP (@nestjs/testing + supertest): testes ponta a ponta nos controllers com PrismaService mockado, validando POST /api/auth/register, GET /api/auth/me (guard JWT), GET /api/events/:id (ParseUUIDPipe e HttpExceptionFilter), POST /api/events, POST /api/institutions/:id/follow, POST /api/calendario e GET /api/eventos/:eventoId/curtidas/contagem.

#### Resultados das verificações
- npm.cmd test (jest): 1 suíte aprovada, 37/37 testes passando (64.063 s).
- npm.cmd run typecheck (tsc --noEmit): aprovado sem erros.
- npm.cmd run lint: reportou apenas 2 erros pré-existentes de imports não utilizados em src/app.module.ts (AuthModule e InstituicoesModule), fora das alterações desta tarefa.
