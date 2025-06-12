# **App Name**: MediTrack

## Core Features:

- Schedule Display: Display the medication schedule in a clear, user-friendly format.
- Medication Log Display: Allow users to view logs, sorted by timestamp to display most recent entries first.
- Real-Time Updates for Schedules: Utilize Firebase's real-time listeners to automatically update the schedule display whenever changes occur in the database.
- Real-Time Updates for Logs: Use Firebase real-time listeners to keep medication log display up-to-date
- Firebase setup code generation: Generate the code for setting up Firebase in a Next.js app. This will be a tool that will create the structure and required credentials to set up the connection with a Firebase Realtime Database.
- Schedule Display Code Generation: Generate a Next.js component that fetches the 'schedules' data from the Firebase Realtime Database and displays it in a user-friendly format, reasoning about how to represent the information in a human-readable format.
- Medication schedule edit component: Generate a Next.js component that allows users to edit the medication schedule, displaying the current schedule (fetched from Firebase) and provide interactive elements to select/deselect specific hours for each day.
- Medication log component: Generate a Next.js component that fetches the 'medication_logs' data from the Firebase Realtime Database and displays it as a list, reasoning about displaying the 'timestamp', 'readable_time', and 'device_id', sorting the logs by timestamp in descending order to show the most recent entries first.
- Real-time update implementation: Generate the code that shows how to implement real-time updates for the 'schedules' and 'medication_logs' data in the Next.js app.

## Style Guidelines:

- Primary color: Calming blue (#64B5F6) to evoke trust and reliability.
- Background color: Light blue (#E3F2FD) to maintain a clean, unobtrusive interface.
- Accent color: Soft green (#A5D6A7) for positive actions and confirmations.
- Body and headline font: 'Inter', a sans-serif for a modern and readable interface.
- Simple, clear icons to represent medication times and log entries.
- Clean, card-based layout for medication schedules and log entries.
- Subtle transitions to provide visual feedback when schedules update or logs are added.