import { IsNotEmpty, IsString } from 'class-validator';

export class LinkAccountDto {
  @IsString()
  @IsNotEmpty()
  gameName: string; // Ex: Faker

  @IsString()
  @IsNotEmpty()
  tagLine: string; // Ex: T1
}
