import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { Task } from './tasks/task.entity';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '1234',
      database: 'tasksdb',
      entities: [User, Task],
      // Auto-creates the `users` table and ADDS the new columns
      // (status, dueDate, archived, userId) to the existing `tasks` table.
      // Existing columns/rows are preserved.
      synchronize: true,
    }),
    AuthModule,
    TasksModule,
  ],
})
export class AppModule {}
