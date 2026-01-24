// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'modules/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    // ưu tiên sub (id) vì ổn định nhất
    const userId = payload?.sub;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.status === 'BLOCKED') {
      throw new UnauthorizedException('User is blocked');
    }

    // ✅ request.user thống nhất keys
    return {
      user_id: user._id,
      email: user.email,
      username: user.username,
      roles_admin: user.roles_admin,
      roles_group: user.roles_group,
    };
  }
}