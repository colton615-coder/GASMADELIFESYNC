// Task 2: The Unified Log Function
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';

/**
 * Saves an event from any app module to a unified daily log in Firestore.
 * 
 * @param type A string identifying the type of event (e.g., 'task_completed', 'journal_entry_saved').
 * @param data A JSON object containing details about the event.
 */
export const logToDailyLog = async (type: string, data: object) => {
  if (!db) {
    console.log(`[Firestore Logging Disabled] Event: ${type}`, { data });
    return;
  }

  try {
    const logData = {
      date: format(new Date(), 'yyyy-MM-dd'),
      timestamp: new Date().toISOString(),
      type: type,
      data: data,
    };

    await addDoc(collection(db, 'dailyLog'), logData);
    console.log(`Logged event: ${type}`, logData);
  } catch (error) {
    console.error("Error writing document to dailyLog: ", error);
  }
};
