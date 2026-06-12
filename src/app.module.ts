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
      type: 'better-sqlite3',
      database: 'tasksdb.sqlite', // a single file in the project — no server, no Docker
      entities: [User, Task, TaskType],
      // Auto-creates all tables (users, tasks, task_types) in the SQLite file.
      synchronize: true,
    }),
    AuthModule,
    TasksModule,
    TaskTypesModule,
  ],
})
export class AppModule {}
