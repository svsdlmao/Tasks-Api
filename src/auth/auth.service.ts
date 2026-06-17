import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { Task } from '../tasks/task.entity';
import { SignupDto } from './dto';
import { AuthUser } from './current-user.decorator';
import { MirrorService } from '../mirror/mirror.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Task) private tasks: Repository<Task>,
    private jwt: JwtService,
    private mirror: MirrorService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists.');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.save(
      this.users.create({ name: dto.name.trim(), email: dto.email.trim(), password: hash }),
    );
    this.mirror.upsertUser(user);
    return this.sign(user);
  }

  /** Used by the Passport LocalStrategy. Returns the user (sans password) or null. */
  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.users.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      return { id: user.id, name: user.name, email: user.email };
    }
    return null;
  }

  /** Called after LocalAuthGuard has already validated the credentials. */
  login(user: AuthUser) {
    return this.sign(user);
  }

  async deleteAccount(userId: number) {
    // Tasks are removed via FK ON DELETE CASCADE, but remove explicitly to be safe.
    await this.tasks.delete({ userId });
    await this.users.delete({ id: userId });
    this.mirror.deleteUserCascade(userId);
    return { deleted: true };
  }

  private sign(user: AuthUser) {
    const token = this.jwt.sign({ sub: user.id, email: user.email, name: user.name });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }
}
