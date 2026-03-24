import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import { UserDocument } from '../users/schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: AuthDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Este e-mail já está em uso.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.usersService.create(dto.email, passwordHash);

    return this.generateToken(user);
  }

  async login(dto: AuthDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.generateToken(user);
  }

  private generateToken(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, plan: user.plan };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        plan: user.plan,
        riotAccount: user.riotAccount,
      },
    };
  }
}
