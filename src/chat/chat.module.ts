import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from './entity/chat-room.entity';
import { User } from 'src/user/entity/user.entity';
import { Chat } from './entity/chat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoom, User, Chat]), AuthModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
