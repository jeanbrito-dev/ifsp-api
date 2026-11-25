import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, Matches, MinLength } from 'class-validator';

export class CreateInstitutionDto {
  @ApiProperty({ example: 'IFSP Campus Caraguatatuba' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  nome!: string;

  @ApiProperty({ example: 'ifsp-caraguatatuba' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'O slug deve conter apenas letras minúsculas, números e hífens.',
  })
  slug!: string;

  @ApiPropertyOptional({ example: 'Instituição federal de ensino.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    example: 'https://exemplo.com/logo.png',
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}
