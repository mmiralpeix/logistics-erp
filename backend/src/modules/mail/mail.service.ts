import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private logger = new Logger('MailService');

  constructor() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      this.logger.log(`SMTP Transporter configurado para: ${smtpHost}`);
    } else {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'demo@ethereal.email',
          pass: 'demopassword',
        },
      });
      this.logger.warn('SMTP_HOST no configurado. Utilizando transportador simulado de desarrollo.');
    }
  }

  async sendActivationEmail(email: string, firstName: string, token: string) {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const activationLink = `${appUrl}/activate?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 16px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #334155;">
          <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">LogisticsPro ERP</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Gestión Integral de Flotas & Minería</p>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="color: #ffffff; font-size: 20px;">¡Hola, ${firstName}!</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Tu cuenta corporativa ha sido registrada exitosamente. Para comenzar a operar en la plataforma, por favor activa tu cuenta haciendo clic en el siguiente botón:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${activationLink}" style="background: linear-gradient(to right, #2563eb, #4f46e5); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
              Activar Mi Cuenta
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
            Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br/>
            <a href="${activationLink}" style="color: #3b82f6; word-break: break-all;">${activationLink}</a>
          </p>
        </div>
        <div style="border-top: 1px solid #334155; padding-top: 16px; text-align: center; color: #64748b; font-size: 12px;">
          © ${new Date().getFullYear()} LogisticsPro ERP. Todos los derechos reservados.
        </div>
      </div>
    `;

    try {
      if (process.env.SMTP_HOST) {
        await this.transporter.sendMail({
          from: `"LogisticsPro ERP" <${process.env.SMTP_FROM || 'noreply@logisticspro.com'}>`,
          to: email,
          subject: 'Activa tu cuenta en LogisticsPro ERP',
          html,
        });
      }
      this.logger.log(`[EMAIL ACTIVACION] Enviado a ${email}. Enlace: ${activationLink}`);
      return { success: true, activationLink };
    } catch (err: any) {
      this.logger.error(`Error enviando correo a ${email}: ${err.message}`);
      return { success: false, activationLink };
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string) {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 16px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #334155;">
          <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">LogisticsPro ERP</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Restablecimiento de Contraseña</p>
        </div>
        <div style="padding: 24px 0;">
          <h2 style="color: #ffffff; font-size: 20px;">¡Hola, ${firstName}!</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Recibimos una solicitud para restablecer tu contraseña. Este enlace expira en 15 minutos. Haz clic en el botón para definir tu nueva clave:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="background: linear-gradient(to right, #059669, #10b981); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
              Restablecer Mi Contraseña
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
            Si no solicitaste este cambio, puedes ignorar este correo de forma segura.<br/>
            Enlace directo: <a href="${resetLink}" style="color: #3b82f6; word-break: break-all;">${resetLink}</a>
          </p>
        </div>
        <div style="border-top: 1px solid #334155; padding-top: 16px; text-align: center; color: #64748b; font-size: 12px;">
          © ${new Date().getFullYear()} LogisticsPro ERP. Todos los derechos reservados.
        </div>
      </div>
    `;

    try {
      if (process.env.SMTP_HOST) {
        await this.transporter.sendMail({
          from: `"LogisticsPro ERP" <${process.env.SMTP_FROM || 'noreply@logisticspro.com'}>`,
          to: email,
          subject: 'Restablecer contraseña - LogisticsPro ERP',
          html,
        });
      }
      this.logger.log(`[EMAIL RESTABLECIMIENTO] Enviado a ${email}. Enlace: ${resetLink}`);
      return { success: true, resetLink };
    } catch (err: any) {
      this.logger.error(`Error enviando correo a ${email}: ${err.message}`);
      return { success: false, resetLink };
    }
  }
}
