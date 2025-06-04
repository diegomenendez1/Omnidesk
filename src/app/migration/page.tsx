"use client";

import { useState } from 'react';
import type { Task } from '@/types'; // Assuming Task type is available
import { migrateLocalTasksToFirestore } from './actions';

const MigrationPage = () => {
  const [keepLocalCopy, setKeepLocalCopy] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);

  const handleMigrate = async () => {
    setMigrationStatus("Migration in progress...");

    try {
      // Read data from localStorage
      const tasksJson = localStorage.getItem('localTasks');
      const tasksFromLocalStorage: Task[] = tasksJson ? JSON.parse(tasksJson) : [];

      if (tasksFromLocalStorage.length === 0) {
        setMigrationStatus("No local tasks to migrate.");
        return;
      }

      const result = await migrateLocalTasksToFirestore(tasksFromLocalStorage, keepLocalCopy);

      if (result.success) {
        setMigrationStatus(`Migration successful! ${result.migratedCount} tasks migrated.`);
        if (!keepLocalCopy) {
          localStorage.removeItem('localTasks');
        }
      } else {
        setMigrationStatus(`Migration failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Migration error:", error);
      setMigrationStatus(`Migration failed: ${error.message}`);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Data Migration</h1>
      <p className="mb-4">Migrate your local tasks to Firestore.</p>

      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="keepLocalCopy"
          checked={keepLocalCopy}
          onChange={(e) => setKeepLocalCopy(e.target.checked)}
          className="mr-2"
        />
        <label htmlFor="keepLocalCopy">Keep a local copy after migration</label>
      </div>

      <button
        onClick={handleMigrate}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Migrate Tasks
      </button>

      {migrationStatus && (
        <div className={`mt-4 p-3 rounded ${migrationStatus.includes("successful") ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {migrationStatus}
        </div>
      )}
    </div>
  );
};

export default MigrationPage;