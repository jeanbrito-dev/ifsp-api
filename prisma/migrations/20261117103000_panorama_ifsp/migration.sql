-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('FERIADO', 'PROVA', 'RECESSO', 'MATRICULA', 'INICIO_AULAS', 'FIM_AULAS', 'OUTRO');

-- CreateEnum
CREATE TYPE "CategoriaDocumento" AS ENUM ('EDITAL', 'PORTARIA', 'RESOLUCAO', 'OUTRO');

-- CreateTable
CREATE TABLE "homenagens" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "homenageado" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "criadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homenagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_calendario" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "tipo" "TipoEvento" NOT NULL DEFAULT 'OUTRO',
    "campus" TEXT,
    "anoLetivo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" "CategoriaDocumento" NOT NULL,
    "arquivoNome" TEXT NOT NULL,
    "arquivoPath" TEXT NOT NULL,
    "arquivoMimetype" TEXT NOT NULL,
    "arquivoTamanho" INTEGER NOT NULL,
    "dataPublicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eventos_calendario_anoLetivo_dataInicio_idx" ON "eventos_calendario"("anoLetivo", "dataInicio");

-- CreateIndex
CREATE INDEX "documentos_categoria_dataPublicacao_idx" ON "documentos"("categoria", "dataPublicacao");
