import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';
import { Task } from './tasks/task.entity';
import { TaskType } from './task-types/task-type.entity';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { TaskTypesModule } from './task-types/task-types.module';
import { join } from 'path';
import { AiModule } from './ai/ai.module';
import { MirrorModule } from './mirror/mirror.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(process.cwd(), 'data', 'tasksdb.sqlite'), // a single file in the project — no server, no Docker
      entities: [User, Task, TaskType],
      // true so a fresh Render deploy recreates the empty schema; RestoreService
      // then repopulates it from the cloud mirror.
      synchronize: true,
      autoLoadEntities: true,
    }),
    MirrorModule,
    AuthModule,
    TasksModule,
    TaskTypesModule,
    AiModule
  ],
})
export class AppModule {}