export type DaySchedule = boolean[]; // 24 booleans for 24 hours
export type WeekSchedule = DaySchedule[]; // 7 DaySchedules for a week

export interface MedicationLog {
  id: string; // Firebase push ID
  timestamp: number;
  readable_time: string;
  device_id: string;
}
