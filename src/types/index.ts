
export type DoseTime = string; // Represents "HH:MM", e.g., "08:30", "14:15"
export type DaySchedule = DoseTime[]; // An array of "HH:MM" strings for a day, should be kept sorted
export type WeekSchedule = DaySchedule[]; // Array of 7 DaySchedules

export interface MedicationLog {
  id: string; // The key from Firebase, e.g., "1750525591000"
  action: string;
  day: number;
  device_id: string;
  formatted_time: string;
  hour: number;
  minute: number;
  month: number;
  second: number;
  timestamp_millis: number;
  timestamp_seconds: number;
  weekday: number;
  year: number;
}
