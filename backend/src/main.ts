import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'
import * as dotenv from 'dotenv'
import { AppModule } from './app.module'

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Cookie parser (reads HttpOnly cookies for JWT auth)
  app.use(cookieParser(process.env.COOKIE_SECRET || 'ehf_cookie_secret'))

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  // CORS — allow Vue frontend with credentials (needed for HttpOnly cookies)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow localhost and any Vercel domain
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/,
        /\.vercel\.app$/,
        new RegExp(process.env.FRONTEND_URL?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || 'NOMATCH')
      ]
      
      if (!origin || allowedPatterns.some(pattern => pattern.test(origin))) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })

  // All routes under /api prefix, except root and health
  app.setGlobalPrefix('api', { exclude: ['/', 'health'] })

  const port = process.env.PORT || 3001
  await app.listen(port, '0.0.0.0')
  console.log(`🤾 EHF Backend running on port ${port} (API: /api)`)
}

bootstrap()
