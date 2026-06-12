import { Body, Controller, Delete, Get, Param, Post, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TaskTypesService } from './task-types.service';
import { CreateTaskTypeDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('types')
export class TaskTypesController {
  constructor(private types: TaskTypesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.types.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskTypeDto) {
    return this.types.create(user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.types.remove(user.id, id);
  }
}
