import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { Role, User } from 'src/user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from 'src/user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUserRepository = {
  findOne: jest.fn(),
};

const mockUserService = {
  create: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockJwtService = {
  decode: jest.fn(),
  verifyAsync: jest.fn(),
  signAsync: jest.fn(),
};

const mockCacheManager = {
  set: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let userService: UserService;
  let configService: ConfigService;
  let jwtService: JwtService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('tokenBlock', () => {
    it('should return true to block the token', async () => {
      const token = 'token';
      const tokenKey = `BLOCK_TOKEN_${token}`;
      const payload = { exp: 1737623485 };
      const now = +Date.now();
      const differenceInSeconds = (payload.exp - now) / 1000;
      jest.spyOn(mockJwtService, 'decode').mockReturnValue(payload);

      const result = await authService.tokenBlock(token);
      expect(result).toBe(true);
      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        tokenKey,
        payload,
        Math.max(differenceInSeconds * 1000, 1),
      );
    });
  });

  describe('parseBasicToken', () => {
    it('should parsing BasicToken and return it', () => {
      const email = 'test@test.com';
      const password = '123123';
      const token = `${email}:${password}`;
      const rawToken = `basic ${Buffer.from(token, 'utf-8').toString('base64')}`;
      const result = authService.parseBasicToken(rawToken);
      expect(result).toStrictEqual({ email, password });
    });

    it('should throw BadRequest if rawToken to be not "basic $token" format', () => {
      const rawToken = `basic`;

      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequest if rawToken to be not include basic string', () => {
      const email = 'test@test.com';
      const password = '123123';
      const token = `${email}:${password}`;
      const rawToken = `bearer ${Buffer.from(token, 'utf-8').toString('base64')}`;

      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequest if rawToken to be not include email or password', () => {
      const email = 'test@test.com';
      const token = `${email}`;
      const rawToken = `basic ${Buffer.from(token, 'utf-8').toString('base64')}`;

      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('parseBearerToken', () => {
    it('should parse accessToken and return payload', async () => {
      const email = 'test@test.com';
      const password = '123123';
      const basicToken = `${email}:${password}`;
      const rawToken = `bearer ${basicToken}`;
      const payload = {
        type: 'access',
      };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(configService, 'get').mockReturnValue('accessSecret');

      const result = await authService.parseBearerToken(rawToken, false);
      expect(result).toBe(payload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(basicToken, {
        secret: 'accessSecret',
      });
      expect(configService.get).toHaveBeenCalledWith(expect.anything());
    });
  });

  it('should parse refresh and return payload', async () => {
    const email = 'test@test.com';
    const password = '123123';
    const basicToken = `${email}:${password}`;
    const rawToken = `bearer ${basicToken}`;
    const payload = {
      type: 'refresh',
    };
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
    jest.spyOn(configService, 'get').mockReturnValue('refreshSecret');

    const result = await authService.parseBearerToken(rawToken, true);
    expect(result).toBe(payload);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(basicToken, {
      secret: 'refreshSecret',
    });
    expect(configService.get).toHaveBeenCalledWith(expect.anything());
  });

  it('should throw Unauthorized Error if expired toeken', async () => {
    const email = 'test@test.com';
    const password = '123123';
    const basicToken = `${email}:${password}`;
    const rawToken = `bearer ${basicToken}`;
    const payload = {
      type: 'refresh',
    };
    jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(payload);
    jest.spyOn(configService, 'get').mockReturnValue('refreshSecret');

    expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw Bad Request Error if not bearer token format', async () => {
    const rawToken = `bearer`;

    expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw Bad Request Error if not include Bearer token', async () => {
    const email = 'test@test.com';
    const password = '123123';
    const basicToken = `${email}:${password}`;
    const rawToken = `basic ${basicToken}`;

    expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw Bad Request Error if not refresh type', async () => {
    const rawToken = `bearer token`;
    const payload = {
      type: 'access',
    };
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
    jest.spyOn(configService, 'get').mockReturnValue('ACCESS_TOKEN_SECRET');

    expect(
      async () => await authService.parseBearerToken(rawToken, true),
    ).rejects.toThrow(BadRequestException);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', {
      secret: 'ACCESS_TOKEN_SECRET',
    });
    expect(configService.get).toHaveBeenCalledWith(expect.anything());
  });

  it('should throw Bad Request Error if not access type', async () => {
    const rawToken = `bearer token`;
    const payload = {
      type: 'refresh',
    };
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
    jest.spyOn(configService, 'get').mockReturnValue('REFRESH_TOKEN_SECRET');

    expect(
      async () => await authService.parseBearerToken(rawToken, false),
    ).rejects.toThrow(BadRequestException);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', {
      secret: 'REFRESH_TOKEN_SECRET',
    });
    expect(configService.get).toHaveBeenCalledWith(expect.anything());
  });

  describe('register', () => {
    it('should register user and return it', async () => {
      const email = 'test@test.com';
      const password = '123123';
      const basicToken = `${email}:${password}`;
      const rawToken = `basic ${Buffer.from(basicToken, 'utf-8').toString('base64')}`;
      jest.spyOn(mockUserService, 'create').mockResolvedValue(true);

      const result = await authService.register(rawToken);
      expect(result).toBe(true);
    });
  });

  describe('authenticate', () => {
    it('should login and return user', async () => {
      const email = 'test@test.com';
      const password = 'pwd';
      const user = {
        email,
        password: 'hashedpwd',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation((pass, hashRounds) => true);

      const result = await authService.authenticate(email, password);
      expect(result).toBe(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          email,
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });

    it('should throw BadRequest if not found user', async () => {
      const email = 'test@test.com';
      const password = 'pwd';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      expect(
        async () => await authService.authenticate(email, password),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequest if not correct password', async () => {
      const email = 'test@test.com';
      const password = 'pwd';
      const user = {
        email,
        password: 'hashedpwd',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation((pass, hashRounds) => false);

      expect(
        async () => await authService.authenticate(email, password),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('issueToken', () => {
    it('should issue refresh token and return it', async () => {
      const user = {
        id: 1,
        role: Role.user,
      };
      const isRefreshToken = true;

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('REFRESH_TOKEN_SECRET');
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('ACCESS_TOKEN_SECRET');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('jwtToken');

      const result = await authService.issueToken(user, isRefreshToken);

      expect(result).toBe('jwtToken');
      expect(configService.get).toHaveBeenNthCalledWith(
        1,
        'REFRESH_TOKEN_SECRET',
      );
      expect(configService.get).toHaveBeenNthCalledWith(
        2,
        'ACCESS_TOKEN_SECRET',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          role: user.role,
          type: isRefreshToken ? 'refresh' : 'access',
        },
        { secret: 'REFRESH_TOKEN_SECRET', expiresIn: '24h' },
      );
    });

    it('should issue access token and return it', async () => {
      const user = {
        id: 1,
        role: Role.user,
      };
      const isRefreshToken = false;

      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('REFRESH_TOKEN_SECRET');
      jest
        .spyOn(configService, 'get')
        .mockReturnValueOnce('ACCESS_TOKEN_SECRET');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('jwtToken');

      const result = await authService.issueToken(user, isRefreshToken);

      expect(result).toBe('jwtToken');
      expect(configService.get).toHaveBeenNthCalledWith(
        1,
        'REFRESH_TOKEN_SECRET',
      );
      expect(configService.get).toHaveBeenNthCalledWith(
        2,
        'ACCESS_TOKEN_SECRET',
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          role: user.role,
          type: isRefreshToken ? 'refresh' : 'access',
        },
        { secret: 'ACCESS_TOKEN_SECRET', expiresIn: 300 },
      );
    });
  });

  describe('login', () => {
    it('should login and return jwt', async () => {
      const email = 'test@test.com';
      const password = '123123';
      const basicToken = `${email}:${password}`;
      const rawToken = `basic ${Buffer.from(basicToken, 'utf-8').toString('base64')}`;

      const user = {
        id: 1,
        role: Role.user,
      };

      jest
        .spyOn(authService, 'parseBasicToken')
        .mockReturnValue({ email, password });
      jest.spyOn(authService, 'authenticate').mockResolvedValue(user as User);
      jest.spyOn(authService, 'issueToken').mockResolvedValueOnce('refresh');
      jest.spyOn(authService, 'issueToken').mockResolvedValueOnce('access');

      const result = await authService.login(rawToken);
      expect(result).toStrictEqual({
        refreshToken: 'refresh',
        accessToken: 'access',
      });
      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(authService.authenticate).toHaveBeenCalledWith(email, password);
      expect(authService.issueToken).toHaveBeenNthCalledWith(1, user, true);
      expect(authService.issueToken).toHaveBeenNthCalledWith(2, user, false);
    });
  });
});
