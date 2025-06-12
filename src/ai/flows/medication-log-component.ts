'use server';
/**
 * @fileOverview Generates a Next.js component to display medication logs fetched from Firebase.
 *
 * - generateMedicationLogComponent - A function that generates the Next.js component code.
 * - MedicationLogComponentInput - The input type for the generateMedicationLogComponent function.
 * - MedicationLogComponentOutput - The return type for the generateMedicationLogComponent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MedicationLogComponentInputSchema = z.object({
  primaryColor: z.string().describe('The primary color for the component (e.g., #64B5F6).'),
  backgroundColor: z
    .string()
    .describe('The background color for the component (e.g., #E3F2FD).'),
  accentColor: z.string().describe('The accent color for the component (e.g., #A5D6A7).'),
  bodyFont: z
    .string()
    .describe('The font family for the body text (e.g., Inter, sans-serif).'),
});
export type MedicationLogComponentInput = z.infer<typeof MedicationLogComponentInputSchema>;

const MedicationLogComponentOutputSchema = z.object({
  componentCode: z
    .string()
    .describe('The generated Next.js component code for displaying medication logs.'),
});
export type MedicationLogComponentOutput = z.infer<typeof MedicationLogComponentOutputSchema>;

export async function generateMedicationLogComponent(
  input: MedicationLogComponentInput
): Promise<MedicationLogComponentOutput> {
  return medicationLogComponentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'medicationLogComponentPrompt',
  input: {schema: MedicationLogComponentInputSchema},
  output: {schema: MedicationLogComponentOutputSchema},
  prompt: `You are an expert Next.js code generator. Generate a Next.js component that fetches the 'medication_logs' data from the Firebase Realtime Database and displays it as a list.

  The component should:
  - Fetch data from Firebase Realtime Database from the \"medication_logs\" path.
  - Display the 'timestamp', 'readable_time', and 'device_id' for each log entry.
  - Sort the logs by timestamp in descending order to show the most recent entries first.
  - Use the following styling:
    - Primary color: {{{primaryColor}}}
    - Background color: {{{backgroundColor}}}
    - Accent color: {{{accentColor}}}
    - Body font: {{{bodyFont}}}

  Return only the code for the Next.js component.

  Do not include any explanation or comments in the code.
  `,
});

const medicationLogComponentFlow = ai.defineFlow(
  {
    name: 'medicationLogComponentFlow',
    inputSchema: MedicationLogComponentInputSchema,
    outputSchema: MedicationLogComponentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
