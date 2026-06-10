import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LocalAuthGuard } from './local-auth.guard';
import { CurrentUser, AuthUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  // LocalAuthGuard runs the 'local' Passport strategy, which validates the
  // email + password and attaches the user to the request.
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@CurrentUser() user: AuthUser) {
    return this.auth.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  deleteAccount(@CurrentUser() user: AuthUser) {
    return this.auth.deleteAccount(user.id);
  }
}
