import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '../types';
import { getUsers, saveUsers } from './local-db';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function register(email: string, password: string, name?: string): Promise<User | null> {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return null;
  }
  const newUser: User & { passwordHash: string } = {
    uid: uuidv4(),
    email,
    name: name || email,
    role: 'user',
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    passwordHash: hashPassword(password),
  };
  users.push(newUser);
  saveUsers(users);
  const { passwordHash, ...rest } = newUser;
  return rest;
}

export async function login(email: string, password: string): Promise<User | null> {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (user && user.passwordHash === hashPassword(password)) {
    const { passwordHash, ...rest } = user;
    return rest as User;
  }
  return null;
}

export async function getUserById(uid: string): Promise<User | null> {
  const users = getUsers();
  const user = users.find(u => u.uid === uid);
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest as User;
}
