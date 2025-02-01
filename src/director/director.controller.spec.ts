import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { Director } from './entitie/director.entity';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

const mockDirectorService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('DirectorController', () => {
  let directorController: DirectorController;
  let directorService: DirectorService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorController],
      providers: [
        {
          provide: DirectorService,
          useValue: mockDirectorService,
        },
      ],
    }).compile();
    directorController = module.get<DirectorController>(DirectorController);
    directorService = module.get<DirectorService>(DirectorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorController).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list directors', async () => {
      const directors = [{ name: 'test' }, { name: 'tes1' }];

      jest
        .spyOn(directorService, 'findAll')
        .mockResolvedValue(directors as Director[]);

      const result = await directorController.findAll();
      expect(result).toBe(directors);
      expect(directorService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a director by id', async () => {
      const id = 1;
      const director = { name: 'test' };

      jest
        .spyOn(directorService, 'findOne')
        .mockResolvedValue(director as Director);

      const result = await directorController.findOne(id);
      expect(result).toBe(director);
      expect(directorService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('create', () => {
    it('should create a director and return it', async () => {
      const createDirectorDto = {
        name: 'test',
      };
      const newDirector = {
        id: 1,
        name: 'test',
      };

      jest
        .spyOn(directorService, 'create')
        .mockResolvedValue(newDirector as Director);

      const result = await directorController.create(
        createDirectorDto as CreateDirectorDto,
      );
      expect(result).toBe(newDirector);
      expect(directorService.create).toHaveBeenCalledWith(createDirectorDto);
    });
  });

  describe('update', () => {
    it('should update a director by id and return it', async () => {
      const id = 1;
      const updateDirectorDto = {
        name: 'tttt',
      };
      const updatedDirector = {
        id: 1,
        name: 'test',
      };

      jest
        .spyOn(directorService, 'update')
        .mockResolvedValue(updatedDirector as Director);

      const result = await directorController.update(
        id,
        updateDirectorDto as UpdateDirectorDto,
      );
      expect(result).toBe(updatedDirector);
      expect(directorService.update).toHaveBeenCalledWith(
        id,
        updateDirectorDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove director by id and return removed id', async () => {
      const id = 1;
      jest.spyOn(directorService, 'remove').mockResolvedValue(id);

      const result = await directorController.remove(id);
      expect(result).toBe(id);
      expect(directorService.remove).toHaveBeenCalledWith(id);
    });
  });
});
