import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TipoEvento } from '../../../generated/prisma/enums.js';

export class QueryEventoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ano?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsOptional()
  @IsEnum(TipoEvento)
  tipo?: TipoEvento;

  @IsOptional()
  @IsString()
  campus?: string;
}
