import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { StatusEvento } from '../../../generated/prisma/enums.js';

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  titulo!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  descricao!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  local?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imagemUrl?: string;

  @ApiProperty({ example: '2026-12-01T14:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  inicioEm!: Date;

  @ApiProperty({ example: '2026-12-01T16:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  finalEm!: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registroUrl?: string;

  @ApiPropertyOptional({ enum: StatusEvento })
  @IsOptional()
  @IsEnum(StatusEvento)
  status?: StatusEvento;

  @ApiProperty()
  @IsUUID()
  instituicaoId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @ApiProperty()
  @IsUUID()
  criadoPorId!: string;
}
