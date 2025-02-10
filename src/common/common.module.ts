import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from 'src/movie/entity/movie.entity';
import { DefaultLogger } from './logger/default.logger';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { envVariables } from './const/env.const';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie]),
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'temp'),
        filename: (req, file, cb) => {
          const split = file.originalname.split('.');

          let extention = 'mp4';

          if (split.length > 1) {
            extention = split[split.length - 1];
          }

          cb(null, `${v4()}_${Date.now()}.${extention}`);
        },
      }),
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>(envVariables.redisHost),
          port: configService.get<number>(envVariables.redisPort),
          username: configService.get<string>(envVariables.redisUsername),
          password: configService.get<string>(envVariables.redisPassword),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'thumbnail-generation',
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService, TasksService, DefaultLogger],
  exports: [CommonService, DefaultLogger],
})
export class CommonModule {}
