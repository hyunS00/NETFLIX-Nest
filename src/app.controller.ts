import { Controller, Get, Patch, Post, Delete } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('movie')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies() {
    return [
      {
        id: 1,
        name: '아케인',
        character: ['바이', '징크스'],
      },
      {
        id: 2,
        name: '스토브리그',
        character: ['남궁민'],
      },
    ];
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
