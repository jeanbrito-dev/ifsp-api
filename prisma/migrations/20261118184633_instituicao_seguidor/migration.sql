-- CreateTable
CREATE TABLE "InstituicaoSeguidor" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "instituicaoId" UUID NOT NULL,
    "criadoEm" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstituicaoSeguidor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstituicaoSeguidor_instituicaoId_criadoEm_idx" ON "InstituicaoSeguidor"("instituicaoId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "InstituicaoSeguidor_usuarioId_instituicaoId_key" ON "InstituicaoSeguidor"("usuarioId", "instituicaoId");

-- AddForeignKey
ALTER TABLE "InstituicaoSeguidor" ADD CONSTRAINT "InstituicaoSeguidor_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstituicaoSeguidor" ADD CONSTRAINT "InstituicaoSeguidor_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "Instituicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
