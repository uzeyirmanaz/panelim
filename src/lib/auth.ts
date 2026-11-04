// Oturum altyapısı: scrypt şifre özeti + çerez/bearer token çifte oturum
// (çerezler iframe/embed senaryolarında engellenebildiği için bearer token da desteklenir)
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { cookies, headers } from 'next/headers'
import { db as prisma } from '@/lib/db'

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>

export const SESSION_COOKIE = 'adisyo_oturum'
const SESSION_DAYS = 30

// ── Şifre özetleme ────────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = await scrypt(password, salt, 64)
  return `scrypt:${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hash] = stored.split(':')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const derived = await scrypt(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}

// ── Oturum işlemleri ──────────────────────────────────────────────────────────
export async function createSession(userId: string, userAgent?: string, remember = true) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await prisma.session.create({
    data: { token, userId, userAgent: userAgent?.slice(0, 250), expiresAt },
  })
  const maxAge = remember ? SESSION_DAYS * 24 * 60 * 60 : undefined

  // HTTPS üzerinden geliyorsa (embed/iframe dâhil) çerez siteler arası de geçerli olmalı;
  // SameSite=None yalnızca Secure ile kabul edilir. Yerel HTTP'de Lax bırakılır.
  const proto = (await headers()).get('x-forwarded-proto') ?? ''
  const isHttps = proto.split(',').some((p) => p.trim() === 'https')

  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps, // ağ geçidi arkasında http çalışır
    path: '/',
    ...(maxAge ? { maxAge } : {}),
  })
  // Süresi geçmiş oturumları arada temizle
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  return token
}

async function bearerToken(): Promise<string | null> {
  const h = await headers()
  const raw = h.get('authorization') ?? h.get('Authorization')
  if (!raw) return null
  const [scheme, value] = raw.split(' ')
  if (!value || scheme.toLowerCase() !== 'bearer') return null
  return value.trim() || null
}

async function sessionUserByToken(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  return session.user
}

export async function getSessionUser() {
  const jar = await cookies()
  const cookieToken = jar.get(SESSION_COOKIE)?.value
  const bearer = await bearerToken()

  const user = cookieToken
    ? await sessionUserByToken(cookieToken)
    : bearer
      ? await sessionUserByToken(bearer)
      : null
  if (!user) return null

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  }
}

export async function destroySession() {
  const jar = await cookies()
  const cookieToken = jar.get(SESSION_COOKIE)?.value
  const bearer = await bearerToken()
  const tokens = [cookieToken, bearer].filter((t): t is string => Boolean(t))
  if (tokens.length > 0) {
    await prisma.session.deleteMany({ where: { token: { in: tokens } } }).catch(() => {})
  }
  jar.delete(SESSION_COOKIE)
}
