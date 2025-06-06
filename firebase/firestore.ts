export type FieldValue = any;

export function collection(db: any, path: string) {
  return { db, path };
}

export function doc(parent: any, ...segments: string[]) {
  return { parent, segments };
}

export async function addDoc(collectionRef: any, data: any) {
  console.warn('addDoc stub called with', collectionRef, data);
}

export async function setDoc(docRef: any, data: any, options?: any) {
  console.warn('setDoc stub called with', docRef, data, options);
}

export async function getDoc(docRef: any) {
  console.warn('getDoc stub called with', docRef);
  return { exists: () => false };
}

export async function getDocs(query: any) {
  console.warn('getDocs stub called with', query);
  return { empty: true, docs: [] };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export function query(...args: any[]) {
  console.warn('query stub called with', args);
  return args;
}

export function onSnapshot(query: any, cb: any, err?: any) {
  console.warn('onSnapshot stub called');
  // Immediately call cb with empty data
  cb({ docs: [], metadata: {} });
  return () => {};
}

export async function updateDoc(docRef: any, data: any) {
  console.warn('updateDoc stub called with', docRef, data);
}

export async function deleteDoc(docRef: any) {
  console.warn('deleteDoc stub called with', docRef);
}

export function where(...args: any[]) {
  return ['where', ...args];
}

export function limit(num: number) {
  return ['limit', num];
}
