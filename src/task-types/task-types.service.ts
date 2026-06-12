import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskType } from './task-type.entity';
import { Task } from '../tasks/task.entity';
import { CreateTaskTypeDto } from './dto';

@Injectable()
export class TaskTypesService {
  constructor(
    @InjectRepository(TaskType) private types: Repository<TaskType>,
    @InjectRepository(Task) private tasks: Repository<Task>,
  ) {}

  findAll(userId: number) {
    return this.types.find({ where: { userId }, order: { id: 'ASC' } });
  }

  create(userId: number, dto: CreateTaskTypeDto) {
    return this.types.save(
      this.types.create({ name: dto.name.trim(), color: dto.color, userId }),
    );
  }

  async remove(userId: number, id: number) {
    // Un-assign this type from any tasks that use it, then delete the type.
    await this.tasks.update({ typeId: id, userId }, { typeId: null });
    await this.types.delete({ id, userId });
    return { deleted: true };
  }
}
