// Type definitions for Firebase modules

declare module 'firebase/app' {
  import { FirebaseApp } from 'firebase/app';
  export * from 'firebase/app';
  export function initializeApp(config: object, name?: string): FirebaseApp;
}

declare module 'firebase/auth' {
  import { User as FirebaseUser } from 'firebase/auth';
  export * from 'firebase/auth';
  export { FirebaseUser };
}

declare module 'firebase/firestore' {
  import { Firestore, DocumentData, DocumentReference, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
  export * from 'firebase/firestore';
  export { Firestore, DocumentData, DocumentReference, DocumentSnapshot, QueryDocumentSnapshot };
}

// Add any other Firebase modules you're using here
