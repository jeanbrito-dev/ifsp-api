import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TipoUsuario } from '../../../generated/prisma/enums.js';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateUserDto {
  @ApiProperty({ example: 'Ana Souza' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nome!: string;

  @ApiProperty({ example: 'ana@ifsp.edu.br' })
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  senha!: string;

  @ApiPropertyOptional({ enum: TipoUsuario, default: TipoUsuario.USUARIO })
  @IsOptional()
  @IsEnum(TipoUsuario)
  cargo?: TipoUsuario;
}