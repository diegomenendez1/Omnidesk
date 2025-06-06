import { db } from './firebase';
import { collection, doc, addDoc, serverTimestamp, FieldValue } from 'firebase/firestore';

export const logTaskHistory = async (
  taskId: string,
  userId: string,
  action: string,
  field?: string,
  oldValue?: any,
  newValue?: any
): Promise<void> => {
  try {
    const historyCollectionRef = collection(doc(db, 'tasks', taskId), 'history');

    const historyEntry: {
      userId: string;
      timestamp: FieldValue;
      action: string;
      field?: string;
      oldValue?: any;
      newValue?: any;
    } = {
      userId,
      timestamp: serverTimestamp(),
      action,
    };

    if (field !== undefined) {
      historyEntry.field = field;
    }
    if (oldValue !== undefined) {
      historyEntry.oldValue = oldValue;
    }
    if (newValue !== undefined) {
      historyEntry.newValue = newValue;
    }


    await addDoc(historyCollectionRef, historyEntry);

    console.log(`History logged for task ${taskId}: Action - ${action}`);
  } catch (error) {
    console.error('Error logging task history:', error);
    // Depending on your application's needs, you might want to throw the error
    // or handle it differently.
    throw error;
  }
};