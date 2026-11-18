import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ user?: { id?: string } }>();
  const id = request.user?.id;

  if (!id) {
    throw new UnauthorizedException('Usuário não autenticado.');
  }

  return id;
});