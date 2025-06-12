'use server';
/**
 * @fileOverview Generates a Next.js component for editing medication schedules fetched from Firebase.
 *
 * - medicationScheduleEditComponent - A function that generates the Next.js component code.
 * - MedicationScheduleEditComponentInput - The input type for the medicationScheduleEditComponent function.
 * - MedicationScheduleEditComponentOutput - The return type for the medicationScheduleEditComponent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MedicationScheduleEditComponentInputSchema = z.object({
  primaryColor: z.string().describe('The primary color for the UI.'),
  backgroundColor: z.string().describe('The background color for the UI.'),
  accentColor: z.string().describe('The accent color for the UI.'),
  bodyHeadlineFont: z.string().describe('The font for the body and headlines.'),
});
export type MedicationScheduleEditComponentInput = z.infer<typeof MedicationScheduleEditComponentInputSchema>;

const MedicationScheduleEditComponentOutputSchema = z.object({
  componentCode: z.string().describe('The generated Next.js component code for editing the medication schedule.'),
});
export type MedicationScheduleEditComponentOutput = z.infer<typeof MedicationScheduleEditComponentOutputSchema>;

export async function medicationScheduleEditComponent(input: MedicationScheduleEditComponentInput): Promise<MedicationScheduleEditComponentOutput> {
  return medicationScheduleEditComponentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'medicationScheduleEditComponentPrompt',
  input: {schema: MedicationScheduleEditComponentInputSchema},
  output: {schema: MedicationScheduleEditComponentOutputSchema},
  prompt: `You are an expert Next.js code generator. Generate a Next.js component that allows users to edit their medication schedule, displaying the current schedule (fetched from Firebase) and providing interactive elements to select/deselect specific hours for each day.

  The component should:
  - Fetch the 'schedules' data from the Firebase Realtime Database.
  - Display the schedule in a user-friendly format, using a card-based layout.
  - Use interactive elements (e.g., checkboxes) to allow users to select/deselect specific hours for each day.
  - Implement a function to update the Firebase Realtime Database with the edited schedule.
  - Use the following UI styles:
    - Primary color: {{{primaryColor}}}
    - Background color: {{{backgroundColor}}}
    - Accent color: {{{accentColor}}}
    - Body and headline font: {{{bodyHeadlineFont}}}

  Here is an example of how to connect to the database:
  \`import { useEffect, useState } from 'react';
  import { database } from '../firebaseConfig'; // Ensure this path is correct
  import { ref, onValue, update } from 'firebase/database';

  const MedicationSchedule = () => {
    const [schedule, setSchedule] = useState({});

    useEffect(() => {
      const scheduleRef = ref(database, 'schedules');
      onValue(scheduleRef, (snapshot) => {
        setSchedule(snapshot.val() || {});
      });
    }, []);

  // Function to update the schedule in Firebase
  const updateSchedule = async (newSchedule) => {
    try {
      const scheduleRef = ref(database, 'schedules');
      await update(scheduleRef, newSchedule);
      console.log('Schedule updated successfully in Firebase!');
    } catch (error) {
      console.error('Error updating schedule in Firebase:', error);
    }
  };

    return (
      <div>{/* generated UI here */ }</div>
    )
  }
  \`
  The component should fetch the schedule data from Firebase, display the schedule data with checkboxes, and update the schedule data on Firebase when the user edits their schedule.
  Do not include any comments in the generated code.
  `,
});

const medicationScheduleEditComponentFlow = ai.defineFlow(
  {
    name: 'medicationScheduleEditComponentFlow',
    inputSchema: MedicationScheduleEditComponentInputSchema,
    outputSchema: MedicationScheduleEditComponentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
