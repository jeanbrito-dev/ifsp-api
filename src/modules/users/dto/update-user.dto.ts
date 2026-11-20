import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ana Souza' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nome?: string;

  @ApiPropertyOptional({ example: 'ana@ifsp.edu.br' })
  @IsOptional()
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ description: 'Obrigatória ao informar a nova senha', maxLength: 72 })
  @IsOptional()
  @IsString()
  @MaxLength(72)
  senhaAtual?: string;

  @ApiPropertyOptional({ description: 'Nova senha', minLength: 8, maxLength: 72 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  senha?: string;
}