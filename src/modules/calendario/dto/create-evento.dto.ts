import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { TipoEvento } from '../../../generated/prisma/enums.js';

export class CreateEventoDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsDateString()
  dataInicio!: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsEnum(TipoEvento)
  tipo?: TipoEvento;

  @IsOptional()
  @IsString()
  campus?: string;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  anoLetivo!: number;
}
