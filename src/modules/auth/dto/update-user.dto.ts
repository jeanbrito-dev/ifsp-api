import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Novo Nome',
    description: 'Novo nome do usuário',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @ApiPropertyOptional({
    example: 'novo@ifsp.edu.br',
    description: 'Novo e-mail do usuário',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty()
  email?: string;

  @ApiPropertyOptional({
    example: '654321',
    description: 'Nova senha (mínimo de 6 caracteres)',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  senha?: string;
}