import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { WeekSchedule, DaySchedule } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures that the data fetched from Firebase, which might be an object
 * representing an array, is converted to a JavaScript array if it matches
 * the expected structure of a WeekSchedule.
 * @param data The raw data from Firebase snapshot.val().
 * @returns A WeekSchedule array or null if conversion is not possible or data is invalid.
 */
export function ensureScheduleArray(data: any): WeekSchedule | null {
  if (Array.isArray(data)) {
    // Basic check if it's already an array of arrays. Deeper validation will occur later.
    if (data.length === 7 && data.every(day => Array.isArray(day))) {
      return data as WeekSchedule;
    }
    return null; // Or handle as malformed
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const keys = Object.keys(data).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    const expectedKeys = Array.from({ length: 7 }, (_, i) => i.toString());

    // Check if it looks like a 7-day schedule object {"0": [...], "1": [...], ... "6": [...]}
    const isFirebaseArrayLike = keys.length === 7 && keys.every((k, i) => k === expectedKeys[i]);

    if (isFirebaseArrayLike) {
      const potentialArray: DaySchedule[] = [];
      for (let i = 0; i < 7; i++) {
        const dayData = (data as any)[i.toString()];
        if (Array.isArray(dayData)) {
          potentialArray.push(dayData);
        } else {
          // If any day is not an array, the structure is invalid for our needs
          return null;
        }
      }
      return potentialArray;
    }
  }
  return null; // Not an array and not a convertible object
}
