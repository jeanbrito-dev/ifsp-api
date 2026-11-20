import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateHomenagemDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsNotEmpty()
  homenageado!: string;

  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @IsOptional()
  @IsUrl()
  fotoUrl?: string;

  @IsDateString()
  data!: string;
}
