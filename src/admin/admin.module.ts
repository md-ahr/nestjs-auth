import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [UsersService],
  controllers: [AdminController],
})
export class AdminModule {}
