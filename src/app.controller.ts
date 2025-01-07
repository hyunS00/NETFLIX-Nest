import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  NotFoundException,
} from '@nestjs/common';
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
  getMovie(@Param('id') id: string) {
    const movie = this.movies.find((m) => m.id === +id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 영화 ID입니다.');
    }

    return movie;
  }

  @Post()
  postMovie() {}

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
