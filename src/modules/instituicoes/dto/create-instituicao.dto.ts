import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateInstituicaoDto {
  @ApiProperty({
    example: 'IFSP - Câmpus São Paulo',
    description: 'Nome oficial da instituição ou câmpus',
  })
  @IsString({ message: 'Nome deve ser um texto' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  @MaxLength(120, { message: 'O nome deve ter no máximo 120 caracteres' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome!: string;

  @ApiProperty({
    example: 'ifsp-spo',
    description: 'Identificador único amigável para URLs e vínculos de eventos',
  })
  @IsString({ message: 'Slug deve ser um texto' })
  @MinLength(2, { message: 'O slug deve ter no mínimo 2 caracteres' })
  @MaxLength(120, { message: 'O slug deve ter no máximo 120 caracteres' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens',
  })
  @IsNotEmpty({ message: 'Slug é obrigatório' })
  slug!: string;

  @ApiPropertyOptional({
    example: 'Câmpus central do Instituto Federal de São Paulo.',
    description: 'Descrição ou apresentação da instituição/polo',
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser um texto' })
  @MaxLength(500, { message: 'A descrição deve ter no máximo 500 caracteres' })
  descricao?: string;

  @ApiPropertyOptional({
    example: 'https://spo.ifsp.edu.br/logo.png',
    description: 'URL do logotipo da instituição',
  })
  @IsOptional()
  @IsString({ message: 'URL do logotipo deve ser um texto' })
  @IsUrl({}, { message: 'URL do logotipo inválida' })
  logoUrl?: string;
}

