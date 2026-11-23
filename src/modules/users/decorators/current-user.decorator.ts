import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TipoUsuario } from '../../../generated/prisma/enums.js';

export interface AuthUser {
  id: string;
  cargo: TipoUsuario;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();

  if (!request.user?.id) {
    throw new UnauthorizedException('Usuário não autenticado.');
  }

  return request.user;
});