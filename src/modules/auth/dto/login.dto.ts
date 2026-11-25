import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'aluno@ifsp.edu.br',
    description: 'E-mail cadastrado do usuário',
  })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha de acesso (mínimo de 6 caracteres)',
  })
  @IsString({ message: 'Senha deve ser um texto' })
  @MinLength(6, { message: 'A senha deve conter no mínimo 6 caracteres' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  senha!: string;
}

