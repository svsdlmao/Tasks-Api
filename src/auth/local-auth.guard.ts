import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Runs the Passport 'local' strategy (email + password) on the login route. */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
