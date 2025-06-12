import { config } from 'dotenv';
config();

import '@/ai/flows/medication-log-component.ts';
import '@/ai/flows/medication-schedule-edit-component.ts';
import '@/ai/flows/schedule-display-component.ts';
import '@/ai/flows/realtime-updates-flow.ts';
import '@/ai/flows/firebase-setup.ts';