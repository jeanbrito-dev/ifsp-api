
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CriarComentarioDto {
  @IsUUID()
  usuarioId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  conteudo!: string;
}
