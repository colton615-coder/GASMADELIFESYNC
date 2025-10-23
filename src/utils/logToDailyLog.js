import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

/**
 * Saves a new event to the 'dailyLog' collection in Firestore.
 * @param {string} type - The type of event (e.g., 'JOURNAL', 'TASK_COMPLETED').
 * @param {Object} data - The JSON payload for the event.
 */
export const logToDailyLog = async (type, data) => {
  if (!type || !data) {
    console.error("Error: logToDailyLog requires a 'type' and 'data' object.");
    return;
  }

  // 1. Get current date and time
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const timestamp = now.toISOString(); // Full ISO string

  // 2. Create the final log entry
  const logEntry = {
    date: date,
    timestamp: timestamp,
    type: type,
    data: data,
  };

  // 3. Save to Firestore
  try {
    const docRef = await addDoc(collection(db, "dailyLog"), logEntry);
    console.log("Document written to dailyLog with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document to dailyLog: ", e);
  }
};
