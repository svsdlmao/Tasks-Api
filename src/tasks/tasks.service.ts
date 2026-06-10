import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto';

@Injectable()
export class TasksService {
  constructor(@InjectRepository(Task) private tasks: Repository<Task>) {}

  /** All of a user's tasks, split into active and archived lists. */
  async findAll(userId: number) {
    const all = await this.tasks.find({ where: { userId }, order: { id: 'ASC' } });
    return {
      active:   all.filter((t) => !t.archived),
      archived: all.filter((t) => t.archived),
    };
  }

  async create(userId: number, dto: CreateTaskDto) {
    const task = this.tasks.create({
      title: dto.title.trim(),
      description: (dto.description ?? '').trim(),
      status: dto.status ?? 'Todo',
      dueDate: dto.dueDate || null,
      completed: (dto.status ?? 'Todo') === 'Done',
      archived: false,
      userId,
    });
    return this.tasks.save(task);
  }

  async update(userId: number, id: number, dto: UpdateTaskDto) {
    const task = await this.findOwned(userId, id);
    if (dto.title !== undefined)       task.title = dto.title.trim();
    if (dto.description !== undefined) task.description = dto.description.trim();
    if (dto.status !== undefined)    { task.status = dto.status; task.completed = dto.status === 'Done'; }
    if (dto.dueDate !== undefined)     task.dueDate = dto.dueDate || null;
    return this.tasks.save(task);
  }

  /** "Delete" = move to archive (matches the frontend behaviour). */
  async archive(userId: number, id: number) {
    const task = await this.findOwned(userId, id);
    task.archived = true;
    return this.tasks.save(task);
  }

  async restore(userId: number, id: number) {
    const task = await this.findOwned(userId, id);
    task.archived = false;
    return this.tasks.save(task);
  }

  private async findOwned(userId: number, id: number): Promise<Task> {
    const task = await this.tasks.findOne({ where: { id, userId } });
    if (!task) throw new NotFoundException('Task not found.');
    return task;
  }
}
