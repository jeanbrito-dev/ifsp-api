import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from './decorators/current-user-id.decorator.js';
import { UsersService } from './users.service.js';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Consulta o perfil do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário, sem dados sensíveis.' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  getProfile(@CurrentUserId() userId: string) {
    return this.usersService.getProfile(userId);
  }
}