import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CategoriaDocumento } from '../../generated/prisma/enums.js';

export class QueryDocumentoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;

  @IsOptional()
  @IsEnum(CategoriaDocumento)
  categoria?: CategoriaDocumento;

  @IsOptional()
  @IsString()
  busca?: string;
}
