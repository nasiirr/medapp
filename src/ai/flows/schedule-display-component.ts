'use server';

/**
 * @fileOverview Generates a Next.js component to display medication schedules fetched from Firebase.
 *
 * - generateScheduleDisplayComponent - A function that generates the Next.js component code.
 * - GenerateScheduleDisplayComponentInput - The input type for the generateScheduleDisplayComponent function.
 * - GenerateScheduleDisplayComponentOutput - The return type for the generateScheduleDisplayComponent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateScheduleDisplayComponentInputSchema = z.object({
  scheduleDataExample: z
    .string()
    .describe(
      'Example of schedule data from Firebase Realtime Database in JSON format.'
    ),\n  primaryColor: z.string().describe('The primary color in hex format.'),
  backgroundColor: z.string().describe('The background color in hex format.'),
  accentColor: z.string().describe('The accent color in hex format.'),
  bodyFont: z.string().describe('The font to use for the body text.'),
});
export type GenerateScheduleDisplayComponentInput = z.infer<
  typeof GenerateScheduleDisplayComponentInputSchema
>;

const GenerateScheduleDisplayComponentOutputSchema = z.object({
  componentCode: z
    .string()
    .describe('The generated Next.js component code as a string.'),
});
export type GenerateScheduleDisplayComponentOutput = z.infer<
  typeof GenerateScheduleDisplayComponentOutputSchema
>;

export async function generateScheduleDisplayComponent(
  input: GenerateScheduleDisplayComponentInput
): Promise<GenerateScheduleDisplayComponentOutput> {
  return generateScheduleDisplayComponentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateScheduleDisplayComponentPrompt',
  input: {schema: GenerateScheduleDisplayComponentInputSchema},
  output: {schema: GenerateScheduleDisplayComponentOutputSchema},
  prompt: `You are an expert Next.js code generator that creates React components.

  I want to generate a Next.js component that fetches medication schedules from Firebase and displays them in a user-friendly format.

  Here is an example of the schedule data:
  \{\{{scheduleDataExample}\}\}

  Use the following UI style:
  - Primary color: \{\{{primaryColor}\}\}
  - Background color: \{\{{backgroundColor}\}\}
  - Accent color: \{\{{accentColor}\}\}
  - Body font: \{\{{bodyFont}\}\}

  Here are the requirements:
  - Use a card-based layout.
  - Use simple, clear icons to represent medication times.
  - Sort schedules by day.
  - The component should fetch the data from Firebase Realtime Database.
  - Use Inter font.

  Return only the code for the Next.js component.
  Do not include any explanation or other text.
  Make sure the component code is complete and ready to be used.
  `,
});

const generateScheduleDisplayComponentFlow = ai.defineFlow(
  {
    name: 'generateScheduleDisplayComponentFlow',
    inputSchema: GenerateScheduleDisplayComponentInputSchema,
    outputSchema: GenerateScheduleDisplayComponentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
