import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { User } from '../../entities/user.entity'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string): Promise<{ user: Partial<User>; token: string }> {
    const user = await this.userRepo.findOne({ where: { email: email.toLowerCase().trim() } })
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    const payload = { sub: user.id, email: user.email, role: user.role }
    const token = this.jwtService.sign(payload)

    return {
      user: { id: user.id, email: user.email, role: user.role },
      token,
    }
  }

  async validateById(userId: string): Promise<Partial<User> | null> {
    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) return null
    return { id: user.id, email: user.email, role: user.role }
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10)
  }
}
