// src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'modules/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password, full_name } = registerDto;

    // (khuyên) check cả username nếu bạn cho login bằng username
    const existingEmail = await this.usersService.findOneByEmail(email);
    if (existingEmail) throw new ConflictException('Email already exists');

    // Nếu có hàm findOneByUsername thì check luôn
    const existingUsername = await this.usersService.findOneByUsername(username);
    if (existingUsername) throw new ConflictException('Username already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.createUser({
      username,
      email,
      full_name,
      password: hashedPassword,
    });

    const { password: _pw, ...result } = user.toObject();
    return result;
  }

  async login(loginDto: LoginDto) {
    const { identifier, password } = loginDto;

    // 1) Xác định identifier là email hay username
    const normalized = identifier.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);

    // 2) Tìm user theo email hoặc username
    const user = isEmail
      ? await this.usersService.findOneByEmail(normalized.toLowerCase())
      : await this.usersService.findOneByUsername(normalized);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3) So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4) Tạo JWT (nên dùng key thống nhất)
    const payload = {
      sub: String(user._id),
      email: user.email,
      roles_admin: user.roles_admin,
      roles_group: user.roles_group,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.full_name,
        roles_admin: user.roles_admin,
        roles_group: user.roles_group,
      },
    };
  }

  async changePassword(userId: string, changePasswordDto: any) {
    const { current_password, new_password, confirm_password } = changePasswordDto;

    // Validate passwords match
    if (new_password !== confirm_password) {
      throw new UnauthorizedException('Passwords do not match');
    }

    // Get user with password field
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get user with password field (need to select it explicitly)
    const userWithPassword = await this.usersService.findOneByEmail(user.email);
    if (!userWithPassword) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, userWithPassword.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(new_password, 10);

    // Update password
    const updatedUser = await this.usersService.updateUser(userId, {
      password: hashedNewPassword,
    });

    const { password: _pw, ...result } = updatedUser.toObject();
    return result;
  }
}