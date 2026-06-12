import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  description: string;

  // ── Existing column (kept so TypeORM doesn't drop it) ──
  @Column({ type: 'tinyint', default: 0 })
  completed: boolean;

  // ── New columns added by TypeORM synchronize ──
  @Column({ type: 'varchar', length: 20, default: 'Todo' })
  status: TaskStatus;

  @Column({ type: 'varchar', length: 10, nullable: true })
  dueDate: string | null; // 'YYYY-MM-DD'

  @Column({ type: 'tinyint', default: 0 })
  archived: boolean;

  // Optional reference to a user-defined task type (category + color).
  @Column({ type: 'int', nullable: true })
  typeId: number | null;

  @ManyToOne(() => User, (user) => user.tasks, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'int', nullable: true })
  userId: number | null;
}
