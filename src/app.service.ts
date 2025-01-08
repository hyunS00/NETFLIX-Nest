import { Injectable } from '@nestjs/common';

export interface Movie {
  id: number;
  title: string;
}
@Injectable()
export class AppService {
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

  getManyMovies(title: string) {
    if (!title) {
      return this.movies;
    }

    return this.movies.filter((m) => m.title.startsWith(title));
  }
}
