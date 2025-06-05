// Simple in-memory replacement for Firebase used during migration away from Firebase.
// This provides a minimal subset of the API used throughout the project so the
// rest of the code can continue working without major refactoring.
import { v4 as uuidv4 } from 'uuid';

type CollectionName = 'tasks' | 'users';
interface DocRef { collection: CollectionName; id: string; }
interface CollectionRef { collection: CollectionName; }

const store: Record<CollectionName, Record<string, any>> = {
  tasks: {},
  users: {},
};

export const db = {} as unknown; // placeholder for compatibility

export function collection(_db: any, name: CollectionName): CollectionRef {
  return { collection: name };
}

export function doc(_db: any, name: CollectionName, id: string): DocRef {
  return { collection: name, id };
}

export async function addDoc(ref: CollectionRef, data: any) {
  const id = uuidv4();
  await setDoc({ collection: ref.collection, id }, data);
  return { id };
}

export async function setDoc(ref: DocRef, data: any, options?: { merge?: boolean }) {
  const col = store[ref.collection];
  if (options?.merge && col[ref.id]) {
    col[ref.id] = { ...col[ref.id], ...data };
  } else {
    col[ref.id] = { ...data };
  }
}

export async function getDoc(ref: DocRef) {
  const col = store[ref.collection];
  const data = col[ref.id];
  return {
    exists: () => data !== undefined,
    data: () => data,
  };
}

export async function getDocs(ref: CollectionRef) {
  const col = store[ref.collection];
  const docs = Object.entries(col).map(([id, data]) => ({ id, data: () => data }));
  return { docs };
}

export async function deleteDoc(ref: DocRef) {
  const col = store[ref.collection];
  delete col[ref.id];
}

export function query(ref: CollectionRef) {
  return ref;
}

export function orderBy(_field: string, _dir?: string) {
  return null;
}

export function where(_field: string, _op: string, _value: any) {
  return null;
}

export function onSnapshot(ref: any, cb: (snapshot: any) => void, _error?: (err: any) => void) {
  getDocs(ref).then(cb);
  return () => {};
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export type FieldValue = string;

export class Timestamp {
  constructor(private date: Date) {}
  toDate() { return this.date; }
}

