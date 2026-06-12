import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskType } from './task-type.entity';
import { Task } from '../tasks/task.entity';
import { TaskTypesService } from './task-types.service';
import { TaskTypesController } from './task-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskType, Task])],
  controllers: [TaskTypesController],
  providers: [TaskTypesService],
})
export class TaskTypesModule {}
