import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TaskStatus } from './task.entity';

const STATUSES = ['Todo', 'In Progress', 'Done'];

export class CreateTaskDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  dueDate?: string | null;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  dueDate?: string | null;
}
