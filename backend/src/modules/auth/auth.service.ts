import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Credenciales inválidas');
    const { password: _, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);

    // If MFA is enabled, require TOTP token
    if (user.mfaEnabled) {
      if (!dto.totpToken) {
        return { mfaRequired: true, userId: user.id };
      }
      const isValidToken = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: dto.totpToken,
        window: 1,
      });
      if (!isValidToken) throw new UnauthorizedException('Código MFA inválido');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, phone: true, lastLogin: true, createdAt: true, mfaEnabled: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Contraseña actual incorrecta');
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Contraseña actualizada exitosamente' };
  }

  // MFA: Generate secret and QR code for authenticator app setup
  async generateMfaSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.mfaEnabled) throw new BadRequestException('MFA ya está habilitado para este usuario');

    const secret = speakeasy.generateSecret({
      name: `LogisticsPro (${user.email})`,
      issuer: 'LogisticsPro ERP',
      length: 32,
    });

    // Store secret temporarily (not yet active — activated on first verify)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCode: qrCodeDataUrl,
    };
  }

  // MFA: Verify TOTP and activate MFA on the account
  async enableMfa(userId: string, totpToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (!user.mfaSecret) throw new BadRequestException('Primero debe generar el secreto MFA');
    if (user.mfaEnabled) throw new BadRequestException('MFA ya está activo');

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: totpToken,
      window: 1,
    });

    if (!isValid) throw new BadRequestException('Código TOTP inválido — verifique que la hora del dispositivo sea correcta');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { message: 'MFA activado exitosamente. Guarde su secreto de recuperación.' };
  }

  // MFA: Disable MFA (requires current password for security)
  async disableMfa(userId: string, currentPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (!user.mfaEnabled) throw new BadRequestException('MFA no está activo');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Contraseña incorrecta');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    return { message: 'MFA desactivado exitosamente' };
  }
}
