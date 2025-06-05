# Migration Off Firebase

This project originally relied heavily on Firebase for authentication and Firestore storage.  The goal of this migration is to eliminate all Firebase dependencies while keeping the backend functional.

## Overview

The replacement stack uses simple JSON file storage for demonstration.  Authentication and data persistence are handled through local modules under `src/lib`:

- `src/lib/local-db.ts` – minimal file based database for tasks and users.
- `src/lib/auth.ts` – basic password hashing and user management.
- `src/lib/firebase.ts` – now exports helpers from these modules so existing imports continue to work.

This approach avoids external services and prepares the project for a future move to a more robust database (e.g. PostgreSQL with Prisma).

## Steps Completed

1. All Firebase environment variables were removed from `.env.local` and `.env.local.example`.
2. Firebase dependencies were removed from `package.json`.
3. New database and authentication helpers added under `src/lib`.
4. `src/app/tasks/actions.ts` rewritten to use the local database instead of Firestore.

## Next Steps

- Replace other server actions that still expect Firestore APIs.
- Implement real-time updates (e.g. websockets) if needed to replace Firestore `onSnapshot` behaviour.
- Move from the simple JSON database to a real SQL or NoSQL database for production use.

The application should now run without any Firebase configuration, though additional work is required to bring feature parity with the previous implementation.
