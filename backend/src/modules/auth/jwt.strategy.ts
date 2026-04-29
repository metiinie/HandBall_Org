import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'

// Reads JWT from the HttpOnly cookie named 'ehf_token'
const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['ehf_token'] ?? null
  }
  return null
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'ehf_super_secret_jwt_key',
    })
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, role: payload.role }
  }
}
