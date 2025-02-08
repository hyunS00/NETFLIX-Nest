import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { CommonModule } from 'src/common/common.module';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      Director,
      Genre,
      User,
      MovieUserLike,
    ]),
    CommonModule,
    // MulterModule.register({
    //   storage: diskStorage({
    //     destination: join(process.cwd(), 'public', 'movie'),
    //     filename: (req, file, cb) => {
    //       const split = file.originalname.split('.');

    //       let extention = 'mp4';

    //       if (split.length > 1) {
    //         extention = split[split.length - 1];
    //       }

    //       cb(null, `${v4()}_${Date.now()}.${extention}`);
    //     },
    //   }),
    // }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
