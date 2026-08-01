import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: any;
  let jwtMock: any;
  let mailMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    jwtMock = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };
    mailMock = {
      sendPasswordReset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: MailService, useValue: mailMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials match', async () => {
      const hashedPassword = await bcrypt.hash('secret123', 10);
      const mockUser = {
        id: 'u-1',
        email: 'test@example.com',
        password: hashedPassword,
        isActive: true,
        role: 'ADMIN',
      };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'secret123');
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect((result as any).password).toBeUndefined();
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('none@example.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u-2',
        email: 'inactive@example.com',
        isActive: false,
      });

      await expect(service.validateUser('inactive@example.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
