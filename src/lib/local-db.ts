import fs from 'fs';
import path from 'path';
import type { Task, User } from '../types';

const DB_PATH = path.join(process.cwd(), 'db.json');

interface Database {
  tasks: Task[];
  users: (User & { passwordHash?: string })[];
}

function loadDB(): Database {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data) as Database;
  } catch {
    return { tasks: [], users: [] };
  }
}

function saveDB(db: Database) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getTasks(): Task[] {
  return loadDB().tasks;
}

export function saveTasks(tasks: Task[]): void {
  const db = loadDB();
  db.tasks = tasks;
  saveDB(db);
}

export function getUsers(): (User & { passwordHash?: string })[] {
  return loadDB().users;
}

export function saveUsers(users: (User & { passwordHash?: string })[]): void {
  const db = loadDB();
  db.users = users;
  saveDB(db);
}
