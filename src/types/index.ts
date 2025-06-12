
export type DoseTime = string; // Represents "HH:MM", e.g., "08:30", "14:15"
export type DaySchedule = DoseTime[]; // An array of "HH:MM" strings for a day, should be kept sorted
export type WeekSchedule = DaySchedule[]; // Array of 7 DaySchedules

export interface MedicationLog {
  id: string; // Firebase push ID
  timestamp: number;
  readable_time: string;
  device_id: string;
}
