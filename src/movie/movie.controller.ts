import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MovieService } from './movie.service';

@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(@Query('title') title?: string) {
    // title 쿼리의 타입이 string인지 검증하는건 컨트롤러
    return this.movieService.getManyMovies(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.movieService.getMovieById(+id);
  }

  @Post()
  postMovie(@Body('title') title: string) {
    return this.movieService.createMovie(title);
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body('title') title: string) {
    return this.movieService.updateMovie(+id, title);
  }

  @Delete(':id')
  deleteMove(@Param('id') id: string) {
    return this.movieService.deleteMovie(+id);
  }
}
