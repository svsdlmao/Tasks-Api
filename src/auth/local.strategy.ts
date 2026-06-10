import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
import { AuthUser } from './current-user.decorator';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // Our login form uses `email`, not the default `username`.
    super({ usernameField: 'email' });
  }

  // Passport calls this with the credentials from the request body.
  // What it returns becomes `request.user`.
  async validate(email: string, password: string): Promise<AuthUser> {
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Incorrect email or password.');
    return user;
  }
}
