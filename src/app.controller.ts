import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
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

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.appService.getMovieById(+id);
  }

  @Post()
  postMovie(@Body('title') title: string) {
    return this.appService.createMovie(title);
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body('title') title: string) {
    return this.appService.updateMovie(+id, title);
  }

  @Delete(':id')
  deleteMove(@Param('id') id: string) {
    return this.appService.deleteMovie(+id);
  }
}
