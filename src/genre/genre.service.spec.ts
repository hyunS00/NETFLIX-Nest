import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Genre } from './entitie/genre.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

const mockGenreRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('GenreService', () => {
  let genreService: GenreService;
  let genreRepository: Repository<Genre>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepository,
        },
      ],
    }).compile();

    genreService = module.get<GenreService>(GenreService);
    genreRepository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(genreService).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of genres', async () => {
      const genres = [{ name: 'test1' }, { name: 'ttt' }];

      jest.spyOn(genreRepository, 'find').mockResolvedValue(genres as Genre[]);

      const result = await genreService.findAll();
      expect(result).toBe(genres);
      expect(genreRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return genre by id', async () => {
      const id = 1;
      const genre = { name: 'test' };

      jest.spyOn(genreRepository, 'findOne').mockResolvedValue(genre as Genre);

      const result = await genreService.findOne(id);
      expect(result).toBe(genre);
      expect(genreRepository.findOne).toHaveBeenCalledWith({ where: { id } });
    });

    it('should throw NotFoundException if not exist genre', async () => {
      const id = 999;

      jest.spyOn(genreRepository, 'findOne').mockResolvedValue(null);

      expect(genreService.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should save a genre and return it', async () => {
      const createGenreDto = {
        name: 'test',
      };
      const newGenre = {
        id: 1,
        name: createGenreDto.name,
      };

      jest.spyOn(genreRepository, 'save').mockResolvedValue(newGenre as Genre);

      const result = await genreService.create(createGenreDto);
      expect(result).toBe(newGenre);
      expect(genreRepository.save).toHaveBeenCalledWith(createGenreDto);
    });
  });

  describe('update', () => {
    it('should update and return the genre if it exists', async () => {
      const id = 1;
      const updateGenreDto = {
        name: 'updated Fantasy',
      };
      const existingGenre = {
        id,
        name: 'fantasy',
      };
      const updatedGenre = {
        id,
        ...updateGenreDto,
      };

      jest
        .spyOn(genreRepository, 'findOne')
        .mockResolvedValueOnce(existingGenre as Genre);
      jest
        .spyOn(genreRepository, 'findOne')
        .mockResolvedValueOnce(updatedGenre as Genre);

      const result = await genreService.update(id, updateGenreDto);
      expect(result).toBe(updatedGenre);
      expect(genreRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id },
      });
      expect(genreRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { id },
      });
    });

    it('should throw NotFoundException if not exists genre', async () => {
      const id = 999;
      const updateGenreDto = {
        name: 'updated Fantasy',
      };

      jest.spyOn(genreRepository, 'findOne').mockResolvedValue(null);

      expect(genreService.update(id, updateGenreDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(genreRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id },
      });
    });
  });

  describe('remove', () => {
    it('should delete and return the id', async () => {
      const id = 1;
      const existingGenre = {
        id,
        name: 'fantasy',
      };

      jest
        .spyOn(genreRepository, 'findOne')
        .mockResolvedValueOnce(existingGenre as Genre);

      const result = await genreService.remove(id);
      expect(result).toBe(id);
      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(genreRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException if not exists genre', async () => {
      const id = 999;

      jest.spyOn(genreRepository, 'findOne').mockResolvedValue(null);

      expect(genreService.remove(id)).rejects.toThrow(NotFoundException);
      expect(genreRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});
