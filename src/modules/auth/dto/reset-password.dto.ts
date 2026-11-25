import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'joao.silva@ifsp.edu.br',
    description: 'E-mail do usuário',
  })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email!: string;

  @ApiProperty({
    example: 'A1B2C3',
    description: 'Código de verificação recebido por e-mail',
  })
  @IsString({ message: 'Código deve ser um texto' })
  @MinLength(4, { message: 'O código deve ter pelo menos 4 caracteres' })
  @IsNotEmpty({ message: 'Código é obrigatório' })
  codigo!: string;

  @ApiProperty({
    example: 'novasenha123',
    description: 'Nova senha do usuário (mínimo de 6 caracteres)',
  })
  @IsString({ message: 'Nova senha deve ser um texto' })
  @MinLength(6, { message: 'A nova senha deve ter no mínimo 6 caracteres' })
  @IsNotEmpty({ message: 'Nova senha é obrigatória' })
  novaSenha!: string;
}

