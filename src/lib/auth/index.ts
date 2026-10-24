import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';

const JWT_SECRET_KEY = new TextEncoder().encode(env.JWT_SECRET);

export interface UserSessionPayload {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  studentVerified: boolean;
  universityId?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function createToken(payload: UserSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET_KEY);
}

export async function verifyToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return verified.payload as unknown as UserSessionPayload;
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('unilive_token')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('unilive_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('unilive_token');
}
