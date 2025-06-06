export interface User {
  uid: string;
  email?: string | null;
  name?: string | null;
}

let currentUser: User | null = null;

export const auth = {
  get currentUser() {
    return currentUser;
  }
};

export function signInWithEmailAndPassword(_auth: any, email: string, password: string) {
  console.warn('signInWithEmailAndPassword stub called', email);
  currentUser = { uid: 'stub', email };
  return Promise.resolve({ user: currentUser });
}

export function signOut() {
  console.warn('signOut stub called');
  currentUser = null;
  return Promise.resolve();
}
