import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  CurrentUser,
  type AuthUser,
} from '../users/decorators/current-user.decorator.js';

import { CreateInstitutionDto } from './dto/create-institution.dto.js';
import { UpdateInstitutionDto } from './dto/update-institution.dto.js';
import { ListInstitutionsQueryDto } from './dto/list-institutions-query.dto.js';
import { ListInstitutionFollowersQueryDto } from './dto/list-institution-followers-query.dto.js';

import { InstitutionsService } from './institutions.service.js';

@ApiTags('Instituições')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  // Criar instituição
  @Post()
  @ApiOperation({ summary: 'Cadastrar uma instituição' })
  @ApiResponse({ status: 201, description: 'Instituição cadastrada.' })
  @ApiResponse({ status: 409, description: 'Slug já cadastrado.' })
  create(@Body() dto: CreateInstitutionDto) {
    return this.institutionsService.create(dto);
  }

  // Listar instituições
  @Get()
  @ApiOperation({ summary: 'Listar instituições' })
  @ApiResponse({ status: 200, description: 'Lista de instituições.' })
  findAll(@Query() query: ListInstitutionsQueryDto) {
    return this.institutionsService.findAll(query);
  }

  // Consultar detalhes de uma instituição
  @Get(':id')
  @ApiOperation({ summary: 'Consultar detalhes de uma instituição' })
  @ApiResponse({ status: 200, description: 'Detalhes da instituição.' })
  @ApiResponse({ status: 404, description: 'Instituição não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.institutionsService.findOne(id);
  }

  // Atualizar instituição
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma instituição' })
  @ApiResponse({ status: 200, description: 'Instituição atualizada.' })
  @ApiResponse({ status: 404, description: 'Instituição não encontrada.' })
  @ApiResponse({ status: 409, description: 'Slug já cadastrado.' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInstitutionDto) {
    return this.institutionsService.update(id, dto);
  }

  // Excluir instituição
  @Delete(':id')
  @ApiOperation({ summary: 'Excluir uma instituição' })
  @ApiResponse({ status: 200, description: 'Instituição removida.' })
  @ApiResponse({ status: 404, description: 'Instituição não encontrada.' })
  @ApiResponse({
    status: 409,
    description: 'Instituição possui eventos associados.',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.institutionsService.remove(id);
  }

  // Seguir instituição
  @Post(':id/follow')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seguir uma instituição' })
  @ApiResponse({ status: 201, description: 'Instituição seguida.' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado.' })
  @ApiResponse({ status: 404, description: 'Instituição não encontrada.' })
  @ApiResponse({ status: 409, description: 'Instituição já seguida.' })
  follow(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) institutionId: string,
  ) {
    return this.institutionsService.followInstitution(actor.id, institutionId);
  }

  // Deixar de seguir instituição
  @Delete(':id/follow')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deixar de seguir uma instituição' })
  @ApiResponse({ status: 200, description: 'Instituição não seguida.' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado.' })
  @ApiResponse({
    status: 404,
    description: 'Instituição não encontrada ou não seguida.',
  })
  unfollow(
    @CurrentUser() actor: AuthUser,
    @Param('id', ParseUUIDPipe) institutionId: string,
  ) {
    return this.institutionsService.unfollowInstitution(actor.id, institutionId);
  }

  // Listar seguidores da instituição
  @Get(':id/followers')
  @ApiOperation({ summary: 'Listar seguidores de uma instituição' })
  @ApiResponse({ status: 200, description: 'Lista de seguidores.' })
  @ApiResponse({ status: 404, description: 'Instituição não encontrada.' })
  findFollowers(
    @Param('id', ParseUUIDPipe) institutionId: string,
    @Query() query: ListInstitutionFollowersQueryDto,
  ) {
    return this.institutionsService.findFollowers(institutionId, query);
  }
}
