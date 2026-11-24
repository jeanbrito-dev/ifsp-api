import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { createReadStream, existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateDocumentoDto } from './dto/create-documento.dto.js';
import { QueryDocumentoDto } from './dto/query-documento.dto.js';
import { UpdateDocumentoDto } from './dto/update-documento.dto.js';
import { UPLOAD_DIR } from './upload.config.js';

@Injectable()
export class DocumentosService {
  constructor(private readonly prisma: PrismaService) {}

  private async apagarArquivo(nomeNoDisco: string) {
    try {
      await unlink(join(UPLOAD_DIR, nomeNoDisco));
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return;
      throw error;
    }
  }

  async create(dto: CreateDocumentoDto, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Envie o arquivo PDF no campo "arquivo"');
    try {
      return await this.prisma.documento.create({
        data: {
          ...dto,
          dataPublicacao: dto.dataPublicacao ? new Date(dto.dataPublicacao) : undefined,
          arquivoNome: file.originalname,
          arquivoPath: file.filename,
          arquivoMimetype: file.mimetype,
          arquivoTamanho: file.size,
        },
      });
    } catch (error) {
      await this.apagarArquivo(file.filename);
      throw error;
    }
  }

  async findAll({ page = 1, limit = 10, categoria, busca }: QueryDocumentoDto) {
    const where: Prisma.DocumentoWhereInput = { ativo: true };
    if (categoria) where.categoria = categoria;
    if (busca) {
      where.OR = [
        { titulo: { contains: busca, mode: 'insensitive' } },
        { descricao: { contains: busca, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.documento.findMany({
        where,
        orderBy: { dataPublicacao: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.documento.count({ where }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

   async findOne(id: number, apenasAtivos = false) {
    const item = await this.prisma.documento.findUnique({ where: { id } });
    if (!item || (apenasAtivos && !item.ativo)) {
      throw new NotFoundException('Documento não encontrado');
    }
    return item;
  }

  async update(id: number, dto: UpdateDocumentoDto, file?: Express.Multer.File) {
    const atual = await this.findOne(id);
    const data: Prisma.DocumentoUpdateInput = {
      ...dto,
      ...(dto.dataPublicacao && { dataPublicacao: new Date(dto.dataPublicacao) }),
    };

    if (file) {
      data.arquivoNome = file.originalname;
      data.arquivoPath = file.filename;
      data.arquivoMimetype = file.mimetype;
      data.arquivoTamanho = file.size;
    }

    try {
      const atualizado = await this.prisma.documento.update({ where: { id }, data });
      if (file) await this.apagarArquivo(atual.arquivoPath);
      return atualizado;
    } catch (error) {
      if (file) await this.apagarArquivo(file.filename);
      throw error;
    }
  }

  async remove(id: number) {
    const doc = await this.findOne(id);
    await this.prisma.documento.delete({ where: { id } });
    await this.apagarArquivo(doc.arquivoPath);
  }

  async getArquivo(id: number) {
    const doc = await this.findOne(id);
    if (!doc.ativo) throw new NotFoundException('Documento não encontrado');

    const caminho = join(UPLOAD_DIR, doc.arquivoPath);
    if (!existsSync(caminho)) throw new NotFoundException('Arquivo não encontrado no servidor');

    return { doc, stream: createReadStream(caminho) };
  }
}
