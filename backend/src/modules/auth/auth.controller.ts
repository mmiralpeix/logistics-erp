import { Controller, Post, Get, Body, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión (con soporte MFA)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña por correo' })
  forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registro público de nuevos usuarios' })
  register(@Body() body: { email: string; password: string; firstName: string; lastName: string; phone?: string }) {
    return this.authService.register(body);
  }

  @Public()
  @Post('activate')
  @ApiOperation({ summary: 'Activar cuenta mediante token recibido por correo' })
  activateAccount(@Body('token') token: string) {
    return this.authService.activateAccount(token);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Establecer nueva contraseña mediante token' })
  resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Get('profile')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Patch('change-password')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Cambiar contraseña' })
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @Post('mfa/generate')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Generar secreto MFA y QR para Google Authenticator' })
  generateMfa(@CurrentUser('id') userId: string) {
    return this.authService.generateMfaSecret(userId);
  }

  @Post('mfa/enable')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Verificar código TOTP y activar MFA' })
  enableMfa(
    @CurrentUser('id') userId: string,
    @Body() body: { totpToken: string },
  ) {
    return this.authService.enableMfa(userId, body.totpToken);
  }

  @Post('mfa/disable')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Desactivar MFA (requiere contraseña actual)' })
  disableMfa(
    @CurrentUser('id') userId: string,
    @Body() body: { currentPassword: string },
  ) {
    return this.authService.disableMfa(userId, body.currentPassword);
  }
}
