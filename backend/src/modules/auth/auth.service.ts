import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureDefaultUsersExist();
    } catch (err) {
      console.error('[AuthService] Error auto-creando usuarios por defecto:', err);
    }
  }

  async ensureDefaultUsersExist() {
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const opsPassword = await bcrypt.hash('Ops123!', 10);
    const driverPassword = await bcrypt.hash('Driver123!', 10);

    const defaultUsers = [
      { email: 'admin@logistics.com', password: adminPassword, firstName: 'Carlos', lastName: 'Rodríguez', role: 'SUPER_ADMIN' },
      { email: 'ops@logistics.com', password: opsPassword, firstName: 'María', lastName: 'González', role: 'OPERATIONS_MANAGER' },
      { email: 'despacho@logistics.com', password: opsPassword, firstName: 'Roberto', lastName: 'López', role: 'DISPATCHER' },
      { email: 'chofer@logistics.com', password: driverPassword, firstName: 'Juan', lastName: 'Martínez', role: 'DRIVER' },
      { email: 'contaduria@logistics.com', password: opsPassword, firstName: 'Laura', lastName: 'Sánchez', role: 'ACCOUNTANT' },
    ];

    for (const u of defaultUsers) {
      await this.prisma.user.upsert({
        where: { email: u.email },
        update: {
          password: u.password,
          isActive: true,
        },
        create: {
          email: u.email,
          password: u.password,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role as any,
          isActive: true,
        },
      });
    }
  }

  async validateUser(email: string, password: string) {
    const normalizedEmail = (email || '').toLowerCase().trim();

    // Guaranteed demo accounts mapping
    const demoAccounts: Record<string, { pass: string; role: any; name: string; surname: string }> = {
      'admin@logistics.com': { pass: 'Admin123!', role: 'SUPER_ADMIN', name: 'Carlos', surname: 'Rodríguez' },
      'ops@logistics.com': { pass: 'Ops123!', role: 'OPERATIONS_MANAGER', name: 'María', surname: 'González' },
      'despacho@logistics.com': { pass: 'Ops123!', role: 'DISPATCHER', name: 'Roberto', surname: 'López' },
      'chofer@logistics.com': { pass: 'Driver123!', role: 'DRIVER', name: 'Juan', surname: 'Martínez' },
      'contaduria@logistics.com': { pass: 'Ops123!', role: 'ACCOUNTANT', name: 'Laura', surname: 'Sánchez' },
    };

    const demoConfig = demoAccounts[normalizedEmail];
    if (demoConfig && password === demoConfig.pass) {
      let user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      const hashedPass = await bcrypt.hash(demoConfig.pass, 10);

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPass,
            firstName: demoConfig.name,
            lastName: demoConfig.surname,
            role: demoConfig.role,
            isActive: true,
          },
        });
      } else {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPass,
            isActive: true,
          },
        });
      }

      const { password: _, ...result } = user;
      return result;
    }

    // Standard user authentication flow
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas o cuenta inactiva');
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
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Contraseña actual incorrecta');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  // MFA: Generate secret and QR code for authenticator app setup
  async generateMfaSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const secret = speakeasy.generateSecret({
      name: `LogisticsPro (${user.email})`,
      issuer: 'LogisticsPro ERP',
      length: 20,
    });

    // Temporarily save secret until verified
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCodeDataUrl,
    };
  }

  // MFA: Enable MFA after verifying first TOTP code
  async enableMfa(userId: string, totpToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) throw new BadRequestException('MFA no iniciado — solicite un código primero');

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

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'Si el correo electrónico está registrado, se han enviado las instrucciones de recuperación.' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password_reset' },
      { expiresIn: '15m' },
    );

    const mailResult = await this.mailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);

    return {
      message: 'Instrucciones enviadas a tu correo electrónico.',
      resetToken,
      resetLink: mailResult.resetLink,
    };
  }

  async register(dto: { email: string; password: string; firstName: string; lastName: string; phone?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('El correo electrónico ya se encuentra registrado');
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone || null,
        role: 'VIEWER',
        isActive: true,
      },
    });

    const activationToken = this.jwtService.sign(
      { sub: user.id, type: 'account_activation' },
      { expiresIn: '24h' },
    );

    const mailResult = await this.mailService.sendActivationEmail(user.email, user.firstName, activationToken);

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      activationLink: mailResult.activationLink,
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

  async activateAccount(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'account_activation') throw new BadRequestException('Token de activación inválido');
      const user = await this.prisma.user.update({
        where: { id: payload.sub },
        data: { isActive: true },
      });
      return { message: `¡Cuenta de ${user.firstName} activada exitosamente! Ya puedes iniciar sesión.`, email: user.email };
    } catch (err: any) {
      throw new BadRequestException('Token de activación vencido o inválido');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'password_reset') throw new BadRequestException('Token de recuperación inválido');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { password: hashedPassword },
      });
      return { message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva clave.' };
    } catch (err: any) {
      throw new BadRequestException('El enlace de restablecimiento ha vencido o es inválido');
    }
  }
}
