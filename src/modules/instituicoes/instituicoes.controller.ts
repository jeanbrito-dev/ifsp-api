import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InstituicoesService } from './instituicoes.service.js';
import { CreateInstituicaoDto } from './dto/create-instituicao.dto.js';
import { UpdateInstituicaoDto } from './dto/update-instituicao.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Instituições')
@Controller('instituicoes')
export class InstituicoesController {
  constructor(private readonly instituicoesService: InstituicoesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as instituições cadastradas' })
  @ApiQuery({
    name: 'busca',
    required: false,
    description: 'Filtrar por nome, slug ou descrição',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de instituições retornada com sucesso',
  })
  async findAll(@Query('busca') busca?: string) {
    return this.instituicoesService.findAll(busca);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter dados de uma instituição por ID' })
  @ApiResponse({ status: 200, description: 'Instituição encontrada' })
  @ApiResponse({ status: 404, description: 'Instituição não encontrada' })
  async findOne(@Param('id') id: string) {
    return this.instituicoesService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obter dados de uma instituição por Slug' })
  @ApiResponse({ status: 200, description: 'Instituição encontrada' })
  @ApiResponse({ status: 404, description: 'Instituição não encontrada' })
  async findBySlug(@Param('slug') slug: string) {
    return this.instituicoesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastrar nova instituição para utilização nos eventos',
  })
  @ApiResponse({ status: 201, description: 'Instituição cadastrada com sucesso' })
  @ApiResponse({ status: 409, description: 'Slug já existente' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async create(@Body() dto: CreateInstituicaoDto) {
    return this.instituicoesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar dados de uma instituição' })
  @ApiResponse({ status: 200, description: 'Instituição atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Instituição não encontrada' })
  @ApiResponse({ status: 409, description: 'Slug em conflito' })
  async update(@Param('id') id: string, @Body() dto: UpdateInstituicaoDto) {
    return this.instituicoesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir uma instituição sem eventos vinculados' })
  @ApiResponse({ status: 200, description: 'Instituição excluída com sucesso' })
  @ApiResponse({ status: 409, description: 'Instituição possui eventos vinculados' })
  async remove(@Param('id') id: string) {
    return this.instituicoesService.remove(id);
  }
}

