import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'João da Silva',
    description: 'Nome completo do usuário',
  })
  @IsString({ message: 'Nome deve ser um texto' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  nome!: string;

  @ApiProperty({
    example: 'joao.silva@ifsp.edu.br',
    description: 'E-mail institucional do usuário',
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

