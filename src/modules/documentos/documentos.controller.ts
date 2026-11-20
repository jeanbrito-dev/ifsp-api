import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CreateDocumentoDto } from './dto/create-documento.dto.js';
import { QueryDocumentoDto } from './dto/query-documento.dto.js';
import { UpdateDocumentoDto } from './dto/update-documento.dto.js';
import { DocumentosService } from './documentos.service.js';
import { documentoUploadOptions } from './upload.config.js';

const documentoBody = (obrigatorio: boolean) => ({
  schema: {
    type: 'object',
    required: obrigatorio ? ['titulo', 'categoria', 'arquivo'] : [],
    properties: {
      titulo: { type: 'string' },
      descricao: { type: 'string' },
      categoria: { type: 'string', enum: ['EDITAL', 'PORTARIA', 'RESOLUCAO', 'OUTRO'] },
      dataPublicacao: { type: 'string', format: 'date-time' },
      ativo: { type: 'boolean' },
      arquivo: { type: 'string', format: 'binary' },
    },
  },
});

@ApiTags('Documentos')
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly service: DocumentosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista documentos ativos (paginado, com filtros)' })
  findAll(@Query() query: QueryDocumentoDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um documento ativo pelo id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id, true);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Baixa o PDF do documento' })
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { doc, stream } = await this.service.getArquivo(id);
    res.set({
      'Content-Type': doc.arquivoMimetype,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(doc.arquivoNome)}`,
    });
    return new StreamableFile(stream);
  }

  @Post() // TODO: proteger com admin
  @ApiOperation({ summary: 'Cria documento com upload de PDF (máx. 10 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(documentoBody(true))
  @UseInterceptors(FileInterceptor('arquivo', documentoUploadOptions))
  create(@Body() dto: CreateDocumentoDto, @UploadedFile() file: Express.Multer.File) {
    return this.service.create(dto, file);
  }

  @Put(':id') // TODO: proteger com admin
  @ApiOperation({ summary: 'Atualiza documento (PDF opcional)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(documentoBody(false))
  @UseInterceptors(FileInterceptor('arquivo', documentoUploadOptions))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.update(id, dto, file);
  }

  @Delete(':id') // TODO: proteger com admin
  @ApiOperation({ summary: 'Remove documento e o arquivo' })
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}