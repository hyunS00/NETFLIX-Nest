import { Controller, Get, Patch, Post, Delete } from '@nestjs/common';
import { AppService } from './app.service';

interface Movie {
  id: number;
  title: string;
}
@Controller('movie')
export class AppController {
  private movies: Movie[] = [
    {
      id: 1,
      title: '아케인',
    },
    {
      id: 2,
      title: '스토브리그',
    },
  ];

  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies() {
    return this.movies;
  }

  @Get(':id')
  getMovie() {
    return {
      id: 1,
      name: '아케인',
      character: ['바이', '징크스'],
    };
  }

  @Post()
  postMovie() {
    return {
      id: 3,
      name: '어벤저스',
      character: ['아이언맨', '캡틴아메리카'],
    };
  }

  @Patch(':id')
  patchMovie() {
    return {
      id: 3,
      name: '어벤저스',
      character: ['아이언맨', '블랙위도우'],
    };
  }

  @Delete(':id')
  deleteMove() {
    return 3;
  }
}
