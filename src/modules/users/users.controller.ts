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
import { CurrentUser, type AuthUser } from './decorators/current-user.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria a própria conta (público, cargo USUARIO)' })
  @ApiResponse({ status: 201, description: 'Usuário criado, sem a senha.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'E-mail já está em uso.' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista usuários com paginação (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista paginada, sem senhas.' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  findAll(@Query() query: ListUsersQueryDto, @CurrentUser() actor: AuthUser) {
    return this.usersService.findAll(query, actor);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consulta um usuário pelo ID (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Dados do usuário, sem a senha.' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser) {
    return this.usersService.findOne(id, actor);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edita nome, e-mail e/ou senha da própria conta' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado, sem a senha.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos, nenhum campo informado ou senha atual incorreta.',
  })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado.' })
  @ApiResponse({ status: 403, description: 'Só é possível editar a própria conta.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 409, description: 'E-mail já está em uso.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.usersService.update(id, dto, actor);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exclui a própria conta, ou qualquer conta se for ADMIN' })
  @ApiResponse({ status: 200, description: 'Usuário removido.' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 409, description: 'Usuário possui dados vinculados.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser) {
    return this.usersService.remove(id, actor);
  }
}