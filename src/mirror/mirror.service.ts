import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { TaskType } from '../task-types/task-type.entity';

/**
 * Mirrors every write to a secondary cloud Postgres database so data survives
 * Render's ephemeral disk being wiped on redeploy. The mirror is OPTIONAL:
 * if MIRROR_DATABASE_URL is missing or the DB is unreachable, the app still
 * runs SQLite-only (the mirror just no-ops). RestoreService reads back from it
 * on boot when the local SQLite DB is empty.
 */
@Injectable()
export class MirrorService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('Mirror');
  private ds?: DataSource;

  /** The mirror DataSource, or undefined when the mirror is disabled. */
  get dataSource(): DataSource | undefined {
    return this.ds?.isInitialized ? this.ds : undefined;
  }
  get enabled() { return !!this.dataSource; }

  async onModuleInit() {
    const url = process.env.MIRROR_DATABASE_URL;
    if (!url) {
      this.log.log('Cloud mirror disabled (no MIRROR_DATABASE_URL set).');
      return;
    }
    try {
      this.ds = new DataSource({
        type: 'postgres',
        url,
        entities: [User, Task, TaskType],
        synchronize: true, // keep the mirror schema in sync
        ssl: { rejectUnauthorized: false }, // hosted Postgres (Neon/Supabase) needs SSL
      });
      await this.ds.initialize();
      this.log.log('✅ Cloud mirror ENABLED and schema synced.');
    } catch (e: any) {
      this.log.error('Mirror init failed — continuing SQLite-only: ' + (e?.message ?? e));
      this.ds = undefined;
    }
  }

  async onModuleDestroy() {
    if (this.ds?.isInitialized) await this.ds.destroy();
  }

  /** Fire-and-forget: never let a mirror failure break the primary request. */
  private run(fn: (ds: DataSource) => Promise<unknown>) {
    const ds = this.dataSource;
    if (!ds) return;
    fn(ds).catch((e) => this.log.error('Mirror op failed: ' + (e?.message ?? e)));
  }

  upsertUser(u: User) {
    this.run((ds) => ds.getRepository(User).save({ id: u.id, name: u.name, email: u.email, password: u.password }));
  }

  upsertTask(t: Task) {
    this.run((ds) => ds.getRepository(Task).save({
      id: t.id, title: t.title, description: t.description, completed: t.completed,
      status: t.status, dueDate: t.dueDate, archived: t.archived, typeId: t.typeId, userId: t.userId,
    }));
  }

  upsertType(t: TaskType) {
    this.run((ds) => ds.getRepository(TaskType).save({ id: t.id, name: t.name, color: t.color, userId: t.userId }));
  }

  deleteUserCascade(userId: number) {
    this.run(async (ds) => {
      await ds.getRepository(Task).delete({ userId });
      await ds.getRepository(TaskType).delete({ userId });
      await ds.getRepository(User).delete({ id: userId });
    });
  }

  removeType(userId: number, id: number) {
    this.run(async (ds) => {
      await ds.getRepository(Task).update({ typeId: id, userId }, { typeId: null });
      await ds.getRepository(TaskType).delete({ id, userId });
    });
  }
}
