import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { Task } from './tasks/task.entity';
import { TaskType } from './task-types/task-type.entity';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { TaskTypesModule } from './task-types/task-types.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '1234',
      database: 'tasksdb',
      entities: [User, Task, TaskType],
      // Auto-creates the `users` + `task_types` tables and ADDS new columns
      // (status, dueDate, archived, userId, typeId) to the existing `tasks` table.
      // Existing columns/rows are preserved.
      synchronize: true,
    }),
    AuthModule,
    TasksModule,
    TaskTypesModule,
  ],
})
export class AppModule {}
