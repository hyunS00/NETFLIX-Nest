import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { Genre } from './entitie/genre.entity';

const mockGenreService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('GenreController', () => {
  let genreController: GenreController;
  let genreService: GenreService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [
        {
          provide: GenreService,
          useValue: mockGenreService,
        },
      ],
    }).compile();
    genreController = module.get<GenreController>(GenreController);
    genreService = module.get<GenreService>(GenreService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(genreController).toBeDefined();
  });

  describe('create', () => {
    it('should create a genre and return it', async () => {
      const createGenreDto = {
        name: 'fantasy',
      };
      const newGenre = {
        id: 1,
        name: createGenreDto.name,
      };

      jest.spyOn(genreService, 'create').mockResolvedValue(newGenre as Genre);
      const result = await genreController.create(createGenreDto);
      expect(result).toBe(newGenre);
      expect(genreService.create).toHaveBeenCalledWith(createGenreDto);
    });
  });

  describe('findAll', () => {
    it('should return list of genres', async () => {
      const genres = [{ name: 'test' }];
      jest.spyOn(genreService, 'findAll').mockResolvedValue(genres as Genre[]);
      const result = await genreController.findAll();
      expect(result).toBe(genres);
      expect(genreService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call gereServiece.findOne with correct id and return the genre', async () => {
      const id = 1;
      const existingGenre = {
        id,
        name: 'fantasy',
      };

      jest
        .spyOn(genreService, 'findOne')
        .mockResolvedValue(existingGenre as Genre);
      const result = await genreController.findOne(id);
      expect(result).toBe(existingGenre);
      expect(genreService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update genre by id and return it', async () => {
      const id = 1;
      const updateGenreDto = {
        name: 'update Fantasy',
      };
      const existingGenre = {
        id,
        name: 'Fantasy',
      };
      const updatedGenre = {
        id,
        name: 'update Fantasy',
      };

      jest
        .spyOn(genreService, 'update')
        .mockResolvedValue(updatedGenre as Genre);
      const result = await genreController.update(id, updateGenreDto);
      expect(result).toBe(updatedGenre);
      expect(genreService.update).toHaveBeenCalledWith(id, updateGenreDto);
    });
  });

  describe('remove', () => {
    it('should call genreService.remove with correct id and return id of the removed genre', async () => {
      const id = 1;

      jest.spyOn(genreService, 'remove').mockResolvedValue(id);
      const result = await genreController.remove(id);
      expect(result).toBe(id);
      expect(genreService.remove).toHaveBeenCalledWith(id);
    });
  });
});
