import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entitie/director.entity';
import { Genre } from 'src/genre/entitie/genre.entity';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { CommonService } from 'src/common/common.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetMoviesDto } from './dto/get-movies.dto';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { join } from 'path';
import { string } from 'joi';
import { UpdateMovieDto } from './dto/update-movie.dto';

describe('MovieService', () => {
  let movieService: MovieService;
  let movieRepository: jest.Mocked<Repository<Movie>>;
  let movieDetailRepository: jest.Mocked<Repository<MovieDetail>>;
  let directorReporitory: jest.Mocked<Repository<Director>>;
  let genreRepository: jest.Mocked<Repository<Genre>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let movieUserLikeRepository: jest.Mocked<Repository<MovieUserLike>>;
  let dataSource: jest.Mocked<DataSource>;
  let commonService: jest.Mocked<CommonService>;
  let cacheManager: Cache;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(MovieService).compile();

    movieService = unit;
    movieRepository = unitRef.get(getRepositoryToken(Movie) as string);
    movieDetailRepository = unitRef.get(
      getRepositoryToken(MovieDetail) as string,
    );
    directorReporitory = unitRef.get(getRepositoryToken(Director) as string);
    genreRepository = unitRef.get(getRepositoryToken(Genre) as string);
    userRepository = unitRef.get(getRepositoryToken(User) as string);
    movieUserLikeRepository = unitRef.get(
      getRepositoryToken(MovieUserLike) as string,
    );
    dataSource = unitRef.get(DataSource);
    commonService = unitRef.get(CommonService);
    cacheManager = unitRef.get(CACHE_MANAGER);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(movieService).toBeDefined();
  });

  describe('findRecent', () => {
    it('영화 리스트를 캐시가 아닌 데이터베이스에서 조회하고 리턴한다', async () => {
      const movies = [{ id: 1, title: 'test' }];
      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(movieRepository, 'find').mockResolvedValue(movies as Movie[]);

      const result = await movieService.findRecent();
      expect(result).toBe(movies);
      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
      expect(movieRepository.find).toHaveBeenCalledWith({
        order: {
          createdAt: 'DESC',
        },
        take: 10,
      });
      expect(cacheManager.set).toHaveBeenCalledWith('MOVIE_RECENT', movies);
    });

    it('영화 리스트를 캐시에서 조회하고 리턴한다', async () => {
      const movies = [{ id: 1, title: 'test' }];
      jest.spyOn(cacheManager, 'get').mockResolvedValue(movies);

      const result = await movieService.findRecent();
      expect(result).toBe(movies);
      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
    });
  });

  describe('findAll', () => {
    let getMoviesMock: jest.SpyInstance;
    let getLikedMovieMock: jest.SpyInstance;

    beforeEach(() => {
      getMoviesMock = jest.spyOn(movieService, 'getMovies');
      getLikedMovieMock = jest.spyOn(movieService, 'getMovieUserLike');
    });

    it('should return a list of movies without user likes', async () => {
      const movies = [
        {
          id: 1,
          title: 'movie1',
        },
      ];
      const dto = { title: 'Movie' } as GetMoviesDto;
      const qb = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([movies, 1]),
      };

      getMoviesMock.mockResolvedValue(qb);
      jest
        .spyOn(commonService, 'applyCursorPaginationParamsToQb')
        .mockResolvedValue({ nextCursor: null } as any);

      const result = await movieService.findAll(dto);
      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('movie.title LIKE :title', {
        title: `%Movie%`,
      });
      expect(
        commonService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, dto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({ data: movies, nextCursor: null, count: 1 });
    });

    it('should return a list of movies with user likes', async () => {
      const movies = [
        {
          id: 1,
          title: 'Movie1',
        },
        {
          id: 3,
          title: 'Movie3',
        },
      ];
      const movieUserLikes = [
        { movie: { id: 1 }, userId: 1, isLike: true },
        {
          movie: { id: 2 },
          isLike: false,
        },
      ];
      const dto = { title: 'Movie' } as GetMoviesDto;
      const qb = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([movies, 1]),
      };
      const userId = 1;

      getMoviesMock.mockResolvedValue(qb);
      jest
        .spyOn(commonService, 'applyCursorPaginationParamsToQb')
        .mockResolvedValue({ nextCursor: null } as any);
      getLikedMovieMock.mockResolvedValue(movieUserLikes);

      const result = await movieService.findAll(dto, userId);
      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('movie.title LIKE :title', {
        title: `%Movie%`,
      });
      expect(
        commonService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, dto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(getLikedMovieMock).toHaveBeenCalledWith(
        movies.map((movie) => movie.id),
        userId,
      );
      expect(result).toEqual({
        data: [
          { id: 1, title: 'Movie1', likeStatus: true },
          { id: 3, title: 'Movie3', likeStatus: null },
        ],
        nextCursor: null,
        count: 1,
      });
    });

    it('should return a list of movies with user likes as null', async () => {
      const movies = [];
      const movieUserLikes = [];
      const dto = { title: 'Movie' } as GetMoviesDto;
      const qb = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([movies, 0]),
      };
      const userId = 1;

      getMoviesMock.mockResolvedValue(qb);
      jest
        .spyOn(commonService, 'applyCursorPaginationParamsToQb')
        .mockResolvedValue({ nextCursor: null } as any);

      const result = await movieService.findAll(dto, userId);
      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('movie.title LIKE :title', {
        title: `%Movie%`,
      });
      expect(
        commonService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, dto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data: [],
        nextCursor: null,
        count: 0,
      });
    });

    it('shoud return movies without title filter', async () => {
      const dto = {} as GetMoviesDto;
      const movies = [
        {
          id: 1,
          title: 'Movie1',
        },
        {
          id: 2,
          title: 'mov',
        },
      ];
      const qb = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([movies, 2]),
      };
      getMoviesMock.mockResolvedValue(qb);
      jest
        .spyOn(commonService, 'applyCursorPaginationParamsToQb')
        .mockResolvedValue({ nextCursor: null } as any);

      const result = await movieService.findAll(dto);
      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).not.toHaveBeenCalled();
      expect(
        commonService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, dto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({ data: movies, nextCursor: null, count: 2 });
    });
  });

  describe('findOne', () => {
    let findMovieDetailMock: jest.SpyInstance;

    beforeEach(() => {
      findMovieDetailMock = jest.spyOn(movieService, 'findMovieDetail');
    });
    it('should return a movie if found', async () => {
      const id = 1;
      const movie = {
        id,
      } as Movie;
      findMovieDetailMock.mockResolvedValue(movie);

      const result = await movieService.findOne(id);
      expect(result).toBe(movie);
      expect(findMovieDetailMock).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException if movie is not found', async () => {
      findMovieDetailMock.mockResolvedValue(null);

      expect(movieService.findOne(1)).rejects.toThrow(NotFoundException);
      expect(findMovieDetailMock).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    let qr: jest.Mocked<QueryRunner>;
    let createMovieDetailMock: jest.SpyInstance;
    let createMovieMock: jest.SpyInstance;
    let createMovieGenreRelationMock: jest.SpyInstance;
    let renameMovieFileMock: jest.SpyInstance;

    beforeEach(() => {
      qr = {
        manager: {
          findOne: jest.fn(),
          find: jest.fn(),
        },
      } as any as jest.Mocked<QueryRunner>;
      createMovieDetailMock = jest.spyOn(movieService, 'createMovieDetail');
      createMovieMock = jest.spyOn(movieService, 'createMovie');
      createMovieGenreRelationMock = jest.spyOn(
        movieService,
        'createMovieGenreRelation',
      );
      renameMovieFileMock = jest.spyOn(movieService, 'renameMovieFile');
    });

    it('should create a movie successfully', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'movie',
        detail: 'movie detail',
        directorId: 1,
        genreIds: [1, 2],
        movieFileName: 'url',
      };
      const director = {
        id: 1,
        name: 'director',
      } as Director;
      const genres = [
        { id: 1, name: 'genre1' },
        { id: 2, name: 'genre2' },
      ] as Genre[];
      const movieDetailInsertResult = { identifiers: [{ id: 1 }] };
      const movieInsertResult = {
        identifiers: [{ id: 1 }],
      };
      jest.spyOn(qr.manager, 'findOne').mockResolvedValueOnce(director);
      jest
        .spyOn(qr.manager, 'findOne')
        .mockResolvedValueOnce({ ...createMovieDto, id: 1 });
      jest.spyOn(qr.manager, 'find').mockResolvedValue(genres);
      createMovieDetailMock.mockResolvedValue(movieDetailInsertResult);
      createMovieMock.mockResolvedValue(movieInsertResult);
      createMovieGenreRelationMock.mockResolvedValue(undefined);
      renameMovieFileMock.mockResolvedValue(undefined);

      const result = await movieService.create(createMovieDto, 1, qr);
      expect(qr.manager.findOne).toHaveBeenNthCalledWith(1, Director, {
        where: { id: createMovieDto.directorId },
      });
      expect(qr.manager.find).toHaveBeenCalledWith(Genre, {
        where: {
          id: In(createMovieDto.genreIds),
        },
      });
      expect(createMovieDetailMock).toHaveBeenCalledWith(
        qr,
        createMovieDto.detail,
      );
      expect(createMovieMock).toHaveBeenCalledWith(
        qr,
        createMovieDto,
        movieDetailInsertResult.identifiers[0].id,
        director,
        1,
        expect.any(String),
      );
      expect(createMovieGenreRelationMock).toHaveBeenCalledWith(
        qr,
        movieInsertResult.identifiers[0].id,
        genres,
      );
      expect(renameMovieFileMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        createMovieDto,
      );
      expect(result).toEqual({ ...createMovieDto, id: 1 });
    });

    it('should throw NotFoundException if director does not exist', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'movie',
        detail: 'movie detail',
        directorId: 1,
        genreIds: [1, 2],
        movieFileName: 'url',
      };
      const userId = 1;
      (qr.manager.findOne as any).mockResolvedValue(null);

      await expect(
        movieService.create(createMovieDto, userId, qr),
      ).rejects.toThrow(NotFoundException);
      expect(qr.manager.findOne).toHaveBeenCalledWith(Director, {
        where: {
          id: createMovieDto.directorId,
        },
      });
    });

    it('should throw NotFoundException if some genres not exist', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'movie',
        detail: 'movie detail',
        directorId: 1,
        genreIds: [1, 2],
        movieFileName: 'url',
      };
      const director = {
        id: 1,
        name: 'director',
      } as Director;
      const genres = [{ id: 1, name: 'Fatasy' }];
      const userId = 1;
      jest.spyOn(qr.manager, 'findOne').mockResolvedValueOnce(director);
      jest.spyOn(qr.manager, 'find').mockResolvedValue(genres);

      await expect(
        movieService.create(createMovieDto, userId, qr),
      ).rejects.toThrow(NotFoundException);
      expect(qr.manager.findOne).toHaveBeenCalledWith(Director, {
        where: {
          id: createMovieDto.directorId,
        },
      });

      expect(qr.manager.find).toHaveBeenCalledWith(Genre, {
        where: {
          id: In(createMovieDto.genreIds),
        },
      });
    });
  });

  describe('update', () => {
    let qr: jest.Mocked<QueryRunner>;
    let updateMovieFieldsMock: jest.SpyInstance;
    let updateMovieDetailMock: jest.SpyInstance;
    let updateMovieGenreMock: jest.SpyInstance;

    beforeEach(() => {
      qr = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        release: jest.fn(),
        rollbackTransaction: jest.fn(),
        manager: {
          findOne: jest.fn(),
          find: jest.fn(),
        },
      } as any as jest.Mocked<QueryRunner>;
      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(qr);
      updateMovieFieldsMock = jest.spyOn(movieService, 'updateMovieFields');
      updateMovieDetailMock = jest.spyOn(movieService, 'updateMovieDetail');
      updateMovieGenreMock = jest.spyOn(movieService, 'updateMovieGenre');
    });

    it('should update movie directorId, genreIds, detail and return it', async () => {
      const id = 1;
      const movie = {
        id,
        detail: 'movie detail',
        directorId: 1,
        genreIds: [1, 2],
      };
      const updateMovieDto = {
        detail: 'udpate detail',
        directorId: 2,
        genreIds: [3],
      } as UpdateMovieDto;
      const director = {
        id: 3,
        name: 'director',
      };
      const genres = [{ id: 3, name: 'genre3' }];
      const updatedMovie = {
        ...movie,
        ...updateMovieDto,
      };

      jest.spyOn(qr.manager, 'findOne').mockResolvedValueOnce(movie);
      jest.spyOn(qr.manager, 'findOne').mockResolvedValueOnce(director);
      jest.spyOn(qr.manager, 'find').mockResolvedValue(genres);
      updateMovieFieldsMock.mockResolvedValue(undefined);
      updateMovieDetailMock.mockResolvedValue(undefined);
      updateMovieGenreMock.mockResolvedValue(undefined);
      jest
        .spyOn(movieRepository, 'findOne')
        .mockResolvedValue(updatedMovie as any);

      const result = await movieService.update(id, updateMovieDto);
      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(qr.connect).toHaveBeenCalled();
      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qr.manager.findOne).toHaveBeenNthCalledWith(1, Movie, {
        where: {
          id,
        },
        relations: ['detail', 'genres'],
      });
      expect(qr.manager.findOne).toHaveBeenNthCalledWith(2, Director, {
        where: {
          id: 2,
        },
      });
      expect(qr.manager.find).toHaveBeenCalledWith(Genre, {
        where: {
          id: In(updateMovieDto.genreIds),
        },
      });
      expect(updateMovieFieldsMock).toHaveBeenCalledWith(qr, { director }, id);
      expect(updateMovieDetailMock).toHaveBeenCalledWith(
        qr,
        updateMovieDto.detail,
        movie,
      );
      expect(updateMovieGenreMock).toHaveBeenCalledWith(qr, id, genres, movie);
      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
      expect(result).toEqual(updatedMovie);
    });

    it('should throw NotFoundException and rollbackTransaction if not found movie', async () => {
      const id = 999;
      const updateMovieDto = {
        id,
        title: 'test',
      };
      jest.spyOn(qr.manager, 'findOne').mockResolvedValue(null);

      await expect(movieService.update(id, updateMovieDto)).rejects.toThrow(
        new NotFoundException('존재하지 않는 영화 ID입니다.'),
      );
      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(qr.connect).toHaveBeenCalled();
      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qr.manager.findOne).toHaveBeenCalledWith(Movie, {
        where: {
          id,
        },
        relations: ['detail', 'genres'],
      });
      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
    });

    it('should thorw NotFoundException and rollbackTransaction if not found director', async () => {
      const id = 1;
      const updateMovieDto = {
        id,
        title: 'test',
        directorId: 999,
      };
      const movie = {
        id,
        title: 'movie',
      };
      jest.spyOn(qr.manager, 'findOne').mockResolvedValueOnce(movie);
      jest.spyOn(qr.manager, 'findOne').mockResolvedValueOnce(null);

      await expect(movieService.update(id, updateMovieDto)).rejects.toThrow(
        new NotFoundException('존재하지 않는 감독 ID입니다.'),
      );
      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(qr.connect).toHaveBeenCalled();
      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qr.manager.findOne).toHaveBeenNthCalledWith(1, Movie, {
        where: {
          id,
        },
        relations: ['detail', 'genres'],
      });
      expect(qr.manager.findOne).toHaveBeenNthCalledWith(2, Director, {
        where: {
          id: updateMovieDto.directorId,
        },
      });
      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
    });

    it('should thorw NotFoundException and rollbackTransaction if not found genres', async () => {
      const id = 1;
      const updateMovieDto = {
        id,
        title: 'test',
        directorId: 2,
        genreIds: [1, 1010],
      };
      const movie = {
        id,
        title: 'movie',
      };
      const director = {
        id: 2,
        name: 'director',
      };
      const genres = [{ id: 1 }];
      jest.spyOn(qr.manager, 'findOne').mockResolvedValueOnce(movie);
      jest.spyOn(qr.manager, 'findOne').mockResolvedValueOnce(director);
      jest.spyOn(qr.manager, 'find').mockResolvedValue(genres);

      await expect(movieService.update(id, updateMovieDto)).rejects.toThrow(
        new NotFoundException(
          `존재하지 않는 장르 ID가 있습니다. ids -> ${genres.map((genre) => genre.id).join(',')}`,
        ),
      );
      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(qr.connect).toHaveBeenCalled();
      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qr.manager.findOne).toHaveBeenNthCalledWith(1, Movie, {
        where: {
          id,
        },
        relations: ['detail', 'genres'],
      });
      expect(qr.manager.findOne).toHaveBeenNthCalledWith(2, Director, {
        where: {
          id: updateMovieDto.directorId,
        },
      });
      expect(qr.manager.find).toHaveBeenCalledWith(Genre, {
        where: {
          id: In(updateMovieDto.genreIds),
        },
      });
      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    let removeMovieMock: jest.SpyInstance;

    beforeEach(() => {
      removeMovieMock = jest.spyOn(movieService, 'removeMovie');
    });

    it('should remove movie and return removedMovieId', async () => {
      const id = 1;
      const detail = {
        id: 2,
      };
      const movie = {
        id,
        title: 'movie',
        detail,
      };

      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(movie as Movie);
      removeMovieMock.mockResolvedValue(undefined);

      const result = await movieService.remove(id);
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: {
          id,
        },
        relations: ['detail', 'director'],
      });
      expect(removeMovieMock).toHaveBeenCalledWith(id);
      expect(movieDetailRepository.delete).toHaveBeenCalledWith(
        movie.detail.id,
      );
      expect(result).toBe(id);
    });

    it('should throw NotFoundException if not found movie', async () => {
      const id = 999;
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      await expect(movieService.remove(id)).rejects.toThrow(
        new NotFoundException('존재하지 않는 영화 ID입니다.'),
      );
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: {
          id,
        },
        relations: ['detail', 'director'],
      });
    });
  });

  describe('toggleMovieLike', () => {
    let findLikeRecordMock: jest.SpyInstance;

    beforeEach(() => {
      findLikeRecordMock = jest.spyOn(movieService, 'findLikeRecord');
    });

    it('should activate like and return isLike as true', async () => {
      const movieId = 1;
      const userId = 3;
      const isLike = true;
      const movie = {
        id: movieId,
        title: 'movie',
      };
      const user = {
        id: userId,
        email: 'test@test.com',
      };
      const toggleLikeRecord = {
        isLike: true,
      };

      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(movie as Movie);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      findLikeRecordMock.mockResolvedValueOnce(null);
      jest.spyOn(movieUserLikeRepository, 'save').mockResolvedValue(undefined);
      findLikeRecordMock.mockResolvedValueOnce(toggleLikeRecord);

      const result = await movieService.toggleMovieLike(
        movieId,
        userId,
        isLike,
      );
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: movieId,
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(findLikeRecordMock).toHaveBeenNthCalledWith(1, movieId, userId);
      expect(movieUserLikeRepository.save).toHaveBeenCalledWith({
        movie,
        user,
        isLike,
      });
      expect(findLikeRecordMock).toHaveBeenNthCalledWith(2, movieId, userId);
      expect(result).toEqual({ isLike: true });
    });

    it('should toggle like and return isLike as null', async () => {
      const movieId = 1;
      const userId = 3;
      const isLike = true;
      const movie = {
        id: movieId,
        title: 'movie',
      };
      const user = {
        id: userId,
        email: 'test@test.com',
      };
      const likeRecord = {
        isLike: true,
      };
      const toggleLikeRecord = {
        isLike: null,
      };

      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(movie as Movie);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      findLikeRecordMock.mockResolvedValueOnce(likeRecord);
      jest
        .spyOn(movieUserLikeRepository, 'delete')
        .mockResolvedValue(undefined);
      findLikeRecordMock.mockResolvedValueOnce(toggleLikeRecord);

      const result = await movieService.toggleMovieLike(
        movieId,
        userId,
        isLike,
      );
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: movieId,
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(findLikeRecordMock).toHaveBeenNthCalledWith(1, movieId, userId);
      expect(movieUserLikeRepository.delete).toHaveBeenCalledWith({
        movie,
        user,
      });
      expect(findLikeRecordMock).toHaveBeenNthCalledWith(2, movieId, userId);
      expect(result).toEqual({ isLike: null });
    });

    it('should activate unlike and return isLike as false', async () => {
      const movieId = 1;
      const userId = 3;
      const isLike = false;
      const movie = {
        id: movieId,
        title: 'movie',
      };
      const user = {
        id: userId,
        email: 'test@test.com',
      };
      const toggleLikeRecord = {
        isLike,
      };

      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(movie as Movie);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      findLikeRecordMock.mockResolvedValueOnce(null);
      jest.spyOn(movieUserLikeRepository, 'save').mockResolvedValue(undefined);
      findLikeRecordMock.mockResolvedValueOnce(toggleLikeRecord);

      const result = await movieService.toggleMovieLike(
        movieId,
        userId,
        isLike,
      );
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: movieId,
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(findLikeRecordMock).toHaveBeenNthCalledWith(1, movieId, userId);
      expect(movieUserLikeRepository.save).toHaveBeenCalledWith({
        movie,
        user,
        isLike,
      });
      expect(findLikeRecordMock).toHaveBeenNthCalledWith(2, movieId, userId);
      expect(result).toEqual({ isLike: false });
    });

    it('should toggle like and return isLike as null', async () => {
      const movieId = 1;
      const userId = 3;
      const isLike = false;
      const movie = {
        id: movieId,
        title: 'movie',
      };
      const user = {
        id: userId,
        email: 'test@test.com',
      };
      const likeRecord = {
        isLike: false,
      };
      const toggleLikeRecord = {
        isLike: null,
      };

      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(movie as Movie);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      findLikeRecordMock.mockResolvedValueOnce(likeRecord);
      jest
        .spyOn(movieUserLikeRepository, 'delete')
        .mockResolvedValue(undefined);
      findLikeRecordMock.mockResolvedValueOnce(toggleLikeRecord);

      const result = await movieService.toggleMovieLike(
        movieId,
        userId,
        isLike,
      );
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: movieId,
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(findLikeRecordMock).toHaveBeenNthCalledWith(1, movieId, userId);
      expect(movieUserLikeRepository.delete).toHaveBeenCalledWith({
        movie,
        user,
      });
      expect(findLikeRecordMock).toHaveBeenNthCalledWith(2, movieId, userId);
      expect(result).toEqual({ isLike: null });
    });

    it('should change like to unlike and return isLike as false', async () => {
      const movieId = 1;
      const userId = 3;
      const isLike = false;
      const movie = {
        id: movieId,
        title: 'movie',
      };
      const user = {
        id: userId,
        email: 'test@test.com',
      };
      const likeRecord = {
        isLike: true,
      };
      const toggleLikeRecord = {
        isLike,
      };

      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(movie as Movie);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as User);
      findLikeRecordMock.mockResolvedValueOnce(likeRecord);
      jest
        .spyOn(movieUserLikeRepository, 'update')
        .mockResolvedValue(undefined);
      findLikeRecordMock.mockResolvedValueOnce(toggleLikeRecord);

      const result = await movieService.toggleMovieLike(
        movieId,
        userId,
        isLike,
      );
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: movieId,
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(findLikeRecordMock).toHaveBeenNthCalledWith(1, movieId, userId);
      expect(movieUserLikeRepository.update).toHaveBeenCalledWith(
        { movie, user },
        { isLike },
      );
      expect(findLikeRecordMock).toHaveBeenNthCalledWith(2, movieId, userId);
      expect(result).toEqual({ isLike: false });
    });

    it('should throw BadRequestException if not found movie', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      await expect(movieService.toggleMovieLike(999, 1, true)).rejects.toThrow(
        new BadRequestException('존재하지 않는 영화입니다.'),
      );
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
    });

    it('should throw UnauthorizedException if not found user', async () => {
      const movieId = 1;
      const userId = 999;
      const movie = {
        id: movieId,
        title: 'Movie',
      };

      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(movie as Movie);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        movieService.toggleMovieLike(movieId, userId, true),
      ).rejects.toThrow(new UnauthorizedException('사용자 정보가 없습니다.'));
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: movieId,
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});
