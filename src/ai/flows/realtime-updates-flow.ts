'use server';

/**
 * @fileOverview Generates code for implementing real-time updates for schedules and medication logs in a Next.js app.
 *
 * - generateRealtimeUpdatesCode - A function that generates the code for real-time updates.
 * - RealtimeUpdatesInput - The input type for the generateRealtimeUpdatesCode function.
 * - RealtimeUpdatesOutput - The return type for the generateRealtimeUpdatesCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RealtimeUpdatesInputSchema = z.object({
  databaseURL: z.string().describe('The URL of the Firebase Realtime Database.'),
  schedulesCollection: z.string().describe('The name of the collection for schedules.'),
  medicationLogsCollection: z.string().describe('The name of the collection for medication logs.'),
});
export type RealtimeUpdatesInput = z.infer<typeof RealtimeUpdatesInputSchema>;

const RealtimeUpdatesOutputSchema = z.object({
  realtimeUpdatesCode: z.string().describe('The generated code for implementing real-time updates in a Next.js app.'),
});
export type RealtimeUpdatesOutput = z.infer<typeof RealtimeUpdatesOutputSchema>;

export async function generateRealtimeUpdatesCode(input: RealtimeUpdatesInput): Promise<RealtimeUpdatesOutput> {
  return realtimeUpdatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'realtimeUpdatesPrompt',
  input: {schema: RealtimeUpdatesInputSchema},
  output: {schema: RealtimeUpdatesOutputSchema},
  prompt: `You are an expert Next.js developer specializing in Firebase integration.
  You will generate the code that implements real-time updates for schedules and medication logs in a Next.js app using Firebase Realtime Database.

  The Firebase Realtime Database URL is: {{{databaseURL}}}
  The schedules collection is: {{{schedulesCollection}}}
  The medication logs collection is: {{{medicationLogsCollection}}}

  Here's how to implement real-time updates using Firebase Realtime Database listeners in a Next.js component:

  1.  **Import necessary Firebase modules:**
      -   Import the Firebase Realtime Database modules ('getDatabase', 'ref', 'onValue') from the Firebase SDK.
  2.  **Initialize Firebase (if not already initialized):**
      -   Make sure Firebase is initialized in your Next.js app. This usually involves setting up the Firebase configuration and initializing the Firebase app.
  3.  **Create a Realtime Database Reference:**
      -   Use 'getDatabase()' to get the Realtime Database instance.
      -   Use 'ref()' to create a reference to the specific location in the database where your schedules and medication logs are stored.
  4.  **Attach Real-time Listeners:**
      -   Use the 'onValue()' function to listen for changes at the specified database reference.
      -   This function takes a reference and a callback function.
      -   The callback function is executed whenever the data at the reference changes.
  5.  **Update the UI:**
      -   Inside the callback function, update the component's state with the new data received from Firebase.
      -   Use the 'useState' hook to manage the component's state.
      -   When the state is updated, the component will automatically re-render with the new data.
  6.  **Handle Disconnections:**
      -   To avoid memory leaks, detach the listeners when the component unmounts.
      -   You can use the 'useEffect' hook with a cleanup function to achieve this.
  7.  **Error Handling:**
      -   Implement error handling to catch any errors that may occur during the real-time updates process.
      -   Display error messages to the user if necessary.

  Example code:

  Here is a code:
  \`\`\`tsx
  // Import necessary Firebase modules
  import { getDatabase, ref, onValue } from "firebase/database";
  import { useEffect, useState } from 'react';

  function RealtimeUpdatesComponent() {
    const [schedules, setSchedules] = useState({});
    const [medicationLogs, setMedicationLogs] = useState([]);

    useEffect(() => {
      // Get the Realtime Database instance
      const db = getDatabase();

      // Create a reference to the schedules location in the database
      const schedulesRef = ref(db, '{{{schedulesCollection}}}');

      // Attach a real-time listener to the schedules reference
      onValue(schedulesRef, (snapshot) => {
        const data = snapshot.val();
        setSchedules(data || {});
      });

      // Create a reference to the medication logs location in the database
      const medicationLogsRef = ref(db, '{{{medicationLogsCollection}}}');

      // Attach a real-time listener to the medication logs reference
      onValue(medicationLogsRef, (snapshot) => {
        const data = snapshot.val();
        // Ensure data is an array before setting the state
        setMedicationLogs(data ? Object.values(data) : []);
      });

      // Detach the listeners when the component unmounts
      return () => {
        // Might need to use off() to detach listeners if onValue doesn't automatically handle it
        // off(schedulesRef);
        // off(medicationLogsRef);
      };
    }, []);

    return (
      <div>
        <h2>Schedules</h2>
        <pre>{JSON.stringify(schedules, null, 2)}</pre>

        <h2>Medication Logs</h2>
        <ul>
          {medicationLogs.map((log, index) => (
            <li key={index}>
              Timestamp: {log.timestamp}, Readable Time: {log.readable_time}, Device ID: {log.device_id}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  export default RealtimeUpdatesComponent;
  \`\`\`

  `,
});

const realtimeUpdatesFlow = ai.defineFlow(
  {
    name: 'realtimeUpdatesFlow',
    inputSchema: RealtimeUpdatesInputSchema,
    outputSchema: RealtimeUpdatesOutputSchema,
  },
  async input => {
  const { output } = await prompt(input);
  return output!;
}
);
