import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { TaskType } from '../task-types/task-type.entity';
import { MirrorService } from './mirror.service';

/**
 * Keeps SQLite (local) and the cloud mirror in sync on boot:
 *  - local empty + mirror has data  → RESTORE mirror → local (after a Render wipe)
 *  - local has data + mirror empty   → SEED local → mirror (first time you attach it)
 *  - both have data / both empty      → nothing
 */
@Injectable()
export class RestoreService implements OnApplicationBootstrap {
  private readonly log = new Logger('Restore');

  constructor(
    @InjectDataSource() private readonly primary: DataSource, // default = SQLite
    private readonly mirror: MirrorService,
  ) {}

  private readonly toUser  = (u: User)     => ({ id: u.id, name: u.name, email: u.email, password: u.password });
  private readonly toType  = (t: TaskType) => ({ id: t.id, name: t.name, color: t.color, userId: t.userId });
  private readonly toTask  = (t: Task)     => ({
    id: t.id, title: t.title, description: t.description, completed: t.completed,
    status: t.status, dueDate: t.dueDate, archived: t.archived, typeId: t.typeId, userId: t.userId,
  });

  /** Copy all rows from src → dst in FK-safe order (users → types → tasks). */
  private async copyAll(src: DataSource, dst: DataSource) {
    const users = await src.getRepository(User).find();
    const types = await src.getRepository(TaskType).find();
    const tasks = await src.getRepository(Task).find();
    if (users.length) await dst.getRepository(User).save(users.map(this.toUser));
    if (types.length) await dst.getRepository(TaskType).save(types.map(this.toType));
    if (tasks.length) await dst.getRepository(Task).save(tasks.map(this.toTask));
    return { u: users.length, ty: types.length, ta: tasks.length };
  }

  async onApplicationBootstrap() {
    const mds = this.mirror.dataSource;
    if (!mds) return; // mirror disabled

    try {
      const localCount  = await this.primary.getRepository(User).count();
      const mirrorCount = await mds.getRepository(User).count();

      if (localCount === 0 && mirrorCount > 0) {
        const n = await this.copyAll(mds, this.primary);
        this.log.log(`♻️ Restored from mirror → local: ${n.u} users, ${n.ty} types, ${n.ta} tasks.`);
      } else if (localCount > 0 && mirrorCount === 0) {
        const n = await this.copyAll(this.primary, mds);
        this.log.log(`⬆️ Seeded local → mirror: ${n.u} users, ${n.ty} types, ${n.ta} tasks.`);
      } else {
        this.log.log(`Sync check OK (local=${localCount}, mirror=${mirrorCount} users) — no copy needed.`);
      }
    } catch (e: any) {
      this.log.error('Boot sync failed: ' + (e?.message ?? e));
    }
  }
}
