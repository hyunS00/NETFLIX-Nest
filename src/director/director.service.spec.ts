import { Test, TestingModule } from '@nestjs/testing';
import { DirectorService } from './director.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Director } from './entitie/director.entity';
import { Repository } from 'typeorm';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { NotFoundException } from '@nestjs/common';

const mockDirectorRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('DirectorService', () => {
  let directorService: DirectorService;
  let directorRepository: Repository<Director>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorService,
        {
          provide: getRepositoryToken(Director),
          useValue: mockDirectorRepository,
        },
      ],
    }).compile();

    directorService = module.get<DirectorService>(DirectorService);
    directorRepository = module.get<Repository<Director>>(
      getRepositoryToken(Director),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });

  describe('create', () => {
    it('should create director', async () => {
      const createDirectorDto: CreateDirectorDto = {
        name: 'test',
        dob: new Date(),
        nationality: 'city',
      };

      jest
        .spyOn(directorRepository, 'save')
        .mockResolvedValue(createDirectorDto as Director);

      const result = await directorService.create(createDirectorDto);
      expect(result).toBe(createDirectorDto);
      expect(directorRepository.save).toHaveBeenLastCalledWith(
        createDirectorDto,
      );
    });

    describe('findAll', () => {
      it('should return list of director', async () => {
        const directorList = [
          {
            name: 'test1',
            dob: new Date(),
            nationality: 'city',
          },
          {
            name: 'test2',
            dob: new Date(),
            nationality: 'city2',
          },
        ];

        jest
          .spyOn(directorRepository, 'find')
          .mockResolvedValue(directorList as Director[]);

        const result = await directorService.findAll();
        expect(result).toBe(directorList);
        expect(directorRepository.find).toHaveBeenCalled();
      });
    });
  });
  describe('findOne', () => {
    it('should return a director by id', async () => {
      const id = 1;
      const director = {
        id,
        name: 'test1',
        dob: new Date(),
        nationality: 'city',
      };

      jest
        .spyOn(directorRepository, 'findOne')
        .mockResolvedValue(director as Director);

      const result = await directorService.findOne(id);
      expect(result).toBe(director);
      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update director and return newDirector', async () => {
      const id = 1;
      const updateDirectorDto: UpdateDirectorDto = {
        name: 'update',
        dob: new Date(),
        nationality: 'city',
      };
      const newDirctor = {
        id: 1,
        name: 'update',
        dob: new Date(),
        nationality: 'city',
      };

      jest
        .spyOn(directorRepository, 'findOne')
        .mockResolvedValueOnce({} as Director);
      jest
        .spyOn(directorRepository, 'findOne')
        .mockResolvedValueOnce(newDirctor as Director);

      const result = await directorService.update(id, updateDirectorDto);
      expect(result).toBe(newDirctor);
      expect(directorRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id },
      });
      expect(directorRepository.update).toHaveBeenCalledWith(
        { id },
        { ...updateDirectorDto },
      );
      expect(directorRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { id },
      });
    });

    it('should throw NotFoundException if not exist director', async () => {
      const id = 999;
      const updateDirectorDto: UpdateDirectorDto = {
        name: 'update',
        dob: new Date(),
        nationality: 'city',
      };

      jest.spyOn(directorRepository, 'findOne').mockResolvedValue(null);

      expect(directorService.update(id, updateDirectorDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('remove', () => {
    it('should remove a director by id and return id', async () => {
      const id = 1;
      const director = {
        id: 1,
        name: 'update',
        dob: new Date(),
        nationality: 'city',
      };
      jest
        .spyOn(directorRepository, 'findOne')
        .mockResolvedValue(director as Director);

      const result = await directorService.remove(id);
      expect(result).toBe(id);
      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(directorRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException if not exist director', async () => {
      const id = 999;

      jest.spyOn(directorRepository, 'findOne').mockResolvedValue(null);

      expect(directorService.remove(id)).rejects.toThrow(NotFoundException);
      expect(directorRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});
