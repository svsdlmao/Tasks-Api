import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.tasks.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.tasks.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(user.id, id, dto);
  }

  @Delete(':id')
  archive(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.tasks.archive(user.id, id);
  }

  @Post(':id/restore')
  restore(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.tasks.restore(user.id, id);
  }
}
