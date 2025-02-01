import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from 'src/user/entities/user.entity';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  tokenBlock: jest.fn(),
  issueToken: jest.fn(),
};

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    it('should register and return user', async () => {
      const user = {
        email: 'test@test.com',
        password: 'pwd',
      };
      const token = 'Basic dGVzdEB0ZXN0LmNvbToxMjMxMjM=';

      jest.spyOn(authService, 'register').mockResolvedValue(user as User);

      const result = await authController.registerUser(token);
      expect(result).toBe(user);
      expect(authService.register).toHaveBeenCalledWith(token);
    });
  });

  describe('loginUser', () => {
    it('should login and return jwt token', async () => {
      const token = 'Bearer dGVzdEB0ZXN0LmNvbToxMjMxMjM=';
      const jwt = {
        accessToken: 'access',
        refreshToken: 'refresh',
      };

      jest.spyOn(authService, 'login').mockResolvedValue(jwt);

      const result = await authController.loginUser(token);
      expect(result).toBe(jwt);
      expect(authService.login).toHaveBeenCalledWith(token);
    });
  });

  describe('blockToken', () => {
    it('should block token and return true', async () => {
      const token = 'Bearer dGVzdEB0ZXN0LmNvbToxMjMxMjM=';

      jest.spyOn(authService, 'tokenBlock').mockResolvedValue(true);

      const result = await authController.blockToken(token);
      expect(result).toBe(true);
      expect(authService.tokenBlock).toHaveBeenCalledWith(token);
    });
  });

  describe('rotateAccessToken', () => {
    it('should rotate access token and return it', async () => {
      const req = {
        user: {},
      };
      const accessToken = 'access';
      jest.spyOn(authService, 'issueToken').mockResolvedValue(accessToken);

      const result = await authController.rotateAccessToken(req);
      expect(result).toStrictEqual({
        accessToken,
      });
      expect(authService.issueToken).toHaveBeenCalledWith(req.user, false);
    });
  });

  describe('logUserPassport', () => {
    it('should return refreshToken and accessToken', async () => {
      const req = {
        user: {},
      };
      const accessToken = 'access';
      const refreshToken = 'access';

      jest.spyOn(authService, 'issueToken').mockResolvedValueOnce(refreshToken);
      jest.spyOn(authService, 'issueToken').mockResolvedValueOnce(accessToken);

      const result = await authController.logUserPassport(req);
      expect(result).toStrictEqual({ refreshToken, accessToken });
      expect(authService.issueToken).toHaveBeenNthCalledWith(1, req.user, true);
      expect(authService.issueToken).toHaveBeenNthCalledWith(
        2,
        req.user,
        false,
      );
    });
  });

  describe('private', () => {
    it('should return user', async () => {
      const req = {
        user: {},
      };

      const result = await authController.private(req);
      expect(result).toBe(req.user);
    });
  });
});
