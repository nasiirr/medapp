import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WeekSchedule, DaySchedule, DoseSlot } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures that the data fetched from Firebase is converted to a valid WeekSchedule,
 * migrating old data formats (string array) to the new format (DoseSlot object array).
 * @param data The raw data from Firebase snapshot.val().
 * @returns A WeekSchedule array or null if conversion is not possible or data is invalid.
 */
export function ensureScheduleArray(data: any): WeekSchedule | null {
  if (!data) return null;

  let scheduleData: any[] = [];

  // Handle Firebase array-like object: { "0": [...], "1": [...] }
  if (typeof data === 'object' && !Array.isArray(data)) {
    const keys = Object.keys(data).map(Number).sort((a, b) => a - b);
    if (keys.length > 0 && keys.every((k, i) => i < keys.length ? k === i : true)) { // Allow partial schedules
      scheduleData = Array.from({ length: 7 }, (_, i) => data[i] || []);
    } else {
      return null;
    }
  } else if (Array.isArray(data)) {
    scheduleData = data;
  } else {
    return null;
  }
  
  // Pad schedule to 7 days if it's shorter
  while (scheduleData.length < 7) {
    scheduleData.push([]);
  }

  const newWeekSchedule: WeekSchedule = [];

  for (const dayData of scheduleData) {
    const newDaySchedule: DaySchedule = [];
    if (Array.isArray(dayData)) {
      for (const doseData of dayData) {
        if (typeof doseData === 'string' && /^\d{2}:\d{2}$/.test(doseData)) {
          // Old format: migrate it, assuming enabled
          newDaySchedule.push({ time: doseData, enabled: true });
        } else if (
          typeof doseData === 'object' &&
          doseData !== null &&
          'time' in doseData &&
          typeof doseData.time === 'string' &&
          'enabled' in doseData &&
          typeof doseData.enabled === 'boolean'
        ) {
          // New format: use it as is
          newDaySchedule.push(doseData as DoseSlot);
        }
      }
    }
    
    // Ensure exactly 4 slots per day for consistency, filling with disabled slots.
    while (newDaySchedule.length < 4) {
      const isOptionalDose = newDaySchedule.length === 3;
      newDaySchedule.push({ time: "00:00", enabled: !isOptionalDose });
    }

    // Sort and take the first 4
    const finalDaySchedule = newDaySchedule
      .slice(0, 4)
      .sort((a, b) => a.time.localeCompare(b.time));
      
    newWeekSchedule.push(finalDaySchedule);
  }

  return newWeekSchedule;
}
