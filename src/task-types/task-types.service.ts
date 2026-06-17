import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskType } from './task-type.entity';
import { Task } from '../tasks/task.entity';
import { CreateTaskTypeDto } from './dto';
import { MirrorService } from '../mirror/mirror.service';

@Injectable()
export class TaskTypesService {
  constructor(
    @InjectRepository(TaskType) private types: Repository<TaskType>,
    @InjectRepository(Task) private tasks: Repository<Task>,
    private mirror: MirrorService,
  ) {}

  findAll(userId: number) {
    return this.types.find({ where: { userId }, order: { id: 'ASC' } });
  }

  async create(userId: number, dto: CreateTaskTypeDto) {
    const saved = await this.types.save(
      this.types.create({ name: dto.name.trim(), color: dto.color, userId }),
    );
    this.mirror.upsertType(saved);
    return saved;
  }

  async remove(userId: number, id: number) {
    // Un-assign this type from any tasks that use it, then delete the type.
    await this.tasks.update({ typeId: id, userId }, { typeId: null });
    await this.types.delete({ id, userId });
    this.mirror.removeType(userId, id);
    return { deleted: true };
  }
}
