import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CategoriaDocumento } from '../../generated/prisma/enums.js';

export class CreateDocumentoDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsEnum(CategoriaDocumento)
  categoria!: CategoriaDocumento;

  @IsOptional()
  @IsDateString()
  dataPublicacao?: string;

   @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
  @IsBoolean()
  ativo?: boolean;
}
