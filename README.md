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
src/modules/      um diretório por domínio de negócio
prisma/           schema e migrations somente versionadas
src/generated/    Prisma Client gerado; não editar manualmente
test/             testes de integração e unitários
```

Cada domínio deverá seguir `modules/<domain>/{<domain>.module,<domain>.controller,<domain>.service,dto/}`. Controllers não contêm regras de negócio; services não manipulam `Request`/`Response`; DTOs validam entrada; acesso ao banco ocorre via `PrismaService`.

## Banco e Prisma 7

O schema atual é intencionalmente vazio: não crie entidade de negócio sem alinhamento com liderança backend. Ao modelar uma mudança, atualize schema, gere migration nomeada, revise o SQL e execute:

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
