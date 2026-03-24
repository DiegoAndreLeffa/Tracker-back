import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class AuthDto {
  @IsEmail({}, { message: 'Por favor, insira um e-mail válido.' })
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;
}
