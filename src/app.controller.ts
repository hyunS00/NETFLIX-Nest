import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  NotFoundException,
  Body,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller('movie')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies(@Query('title') title?: string) {
    // title 쿼리의 타입이 string인지 검증하는건 컨트롤러

    return this.appService.getManyMovies(title);
  }

  // @Get(':id')
  // getMovie(@Param('id') id: string) {
  //   const movie = this.movies.find((m) => m.id === +id);

  //   if (!movie) {
  //     throw new NotFoundException('존재하지 않는 영화 ID입니다.');
  //   }

  //   return movie;
  // }

  // @Post()
  // postMovie(@Body('title') title: string) {
  //   const movie: Movie = {
  //     id: this.idCounter++,
  //     title: title,
  //   };

  //   this.movies.push(movie);
  //   return movie;
  // }

  // @Patch(':id')
  // patchMovie(@Param('id') id: string, @Body('title') title: string) {
  //   const movie = this.movies.find((m) => m.id === +id);
  //   if (!movie) {
  //     throw new NotFoundException('존재하지 않는 영화 ID입니다.');
  //   }

  //   Object.assign(movie, { title });

  //   return movie;
  // }

  // @Delete(':id')
  // deleteMove(@Param('id') id: string) {
  //   const movieIndex = this.movies.findIndex((m) => m.id === +id);

  //   if (movieIndex === -1) {
  //     throw new NotFoundException('존재하지 않는 영화 ID입니다.');
  //   }

  //   this.movies.splice(movieIndex, 1);

  //   return id;
  // }
}
