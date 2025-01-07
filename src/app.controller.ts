import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  NotFoundException,
  Body,
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
  private idCounter = 3;

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
  postMovie(@Body('title') title: string) {
    const movie: Movie = {
      id: this.idCounter++,
      title: title,
    };

    this.movies.push(movie);
    return movie;
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body('title') title: string) {
    const movie = this.movies.find((m) => m.id === +id);
    if (!movie) {
      throw new NotFoundException('존재하지 않는 영화 ID입니다.');
    }

    Object.assign(movie, { title });

    return movie;
  }

  @Delete(':id')
  deleteMove() {
    return 3;
  }
}
