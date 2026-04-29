import { Controller, Post, Get, Body, Res, Req, HttpCode, UnauthorizedException, UseGuards } from '@nestjs/common'
import { Response, Request } from 'express'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { LoginDto } from './dto/login.dto'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /api/auth/login — validates credentials, sets HttpOnly cookie */
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.authService.signIn(dto.email, dto.password)
    res.cookie('ehf_token', token, COOKIE_OPTIONS)
    return { user }
  }

  /** GET /api/auth/session — validates cookie, returns current user */
  @Get('session')
  @UseGuards(JwtAuthGuard)
  async session(@Req() req: Request) {
    return { user: req['user'] }
  }

  /** POST /api/auth/logout — clears the cookie */
  @Post('logout')
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('ehf_token', { path: '/' })
    return { message: 'Logged out successfully' }
  }
}
