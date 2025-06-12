
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import type { WeekSchedule, DoseTime } from '@/types';
import ScheduleEditor from './ScheduleEditor'; // Changed from ScheduleGrid
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Default schedule: 8 AM, 12 PM (Emergency), 1 PM, 8 PM
const createInitialSchedule = (): WeekSchedule => {
  const dailyDefaultTimes: DoseTime[] = ["08:00", "12:00", "13:00", "20:00"].sort();
  return Array(7).fill(null).map(() => [...dailyDefaultTimes]);
};

const initialSchedule: WeekSchedule = createInitialSchedule();

const ScheduleManager: React.FC = () => {
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const scheduleRef = ref(database, 'schedules');
    setIsLoadingData(true);

    const unsubscribe = onValue(scheduleRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as WeekSchedule;
        // Validate the structure of data according to new WeekSchedule (string[][])
        if (
          Array.isArray(data) &&
          data.length === 7 &&
          data.every(daySchedule =>
            Array.isArray(daySchedule) &&
            daySchedule.every(time => typeof time === 'string' && /^\d{2}:\d{2}$/.test(time))
          )
        ) {
          setSchedule(data.map(dayTimes => dayTimes.sort())); // Ensure times are sorted
        } else {
          console.warn("Firebase schedule data is malformed or incompatible with new structure. Resetting to default.");
          setSchedule(initialSchedule);
          await set(scheduleRef, initialSchedule); // Overwrite malformed data
        }
      } else {
        // No schedule found, set initial one in Firebase
        setSchedule(initialSchedule);
        try {
          await set(scheduleRef, initialSchedule);
          toast({ title: "Schedule Initialized", description: "Default medication schedule has been set." });
        } catch (e) {
          console.error("Failed to set initial schedule in Firebase:", e);
          toast({ variant: "destructive", title: "Error", description: "Failed to initialize schedule in Firebase." });
        }
      }
      setIsLoadingData(false);
    }, (err) => {
      console.error("Firebase onValue error:", err);
      setError("Failed to load schedule. Please try again later.");
      toast({ variant: "destructive", title: "Error", description: "Failed to connect to schedule data." });
      setIsLoadingData(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAddDose = useCallback((dayIndex: number, time: DoseTime) => {
    if (!/^\d{2}:\d{2}$/.test(time)) {
      toast({ variant: "destructive", title: "Invalid Time", description: "Please enter time in HH:MM format." });
      return;
    }
    setSchedule(prevSchedule => {
      if (!prevSchedule) return null;
      const newSchedule = prevSchedule.map(day => [...day]);
      if (!newSchedule[dayIndex].includes(time)) {
        newSchedule[dayIndex] = [...newSchedule[dayIndex], time].sort();
      } else {
        toast({ title: "Duplicate Time", description: "This time is already scheduled for this day." });
      }
      return newSchedule;
    });
  }, [toast]);

  const handleRemoveDose = useCallback((dayIndex: number, timeIndex: number) => {
    setSchedule(prevSchedule => {
      if (!prevSchedule) return null;
      const newSchedule = prevSchedule.map(day => [...day]);
      newSchedule[dayIndex].splice(timeIndex, 1);
      return newSchedule;
    });
  }, []);

  const handleSaveSchedule = async () => {
    if (!schedule) {
      toast({ variant: "destructive", title: "Error", description: "No schedule data to save." });
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const scheduleRef = ref(database, 'schedules');
      // Ensure all day schedules are sorted before saving
      const sortedSchedule = schedule.map(dayTimes => [...dayTimes].sort());
      await set(scheduleRef, sortedSchedule);
      setSchedule(sortedSchedule); // Update local state to be sorted one
      toast({ title: "Schedule Saved", description: "Your medication schedule has been updated successfully.", className: "bg-accent text-accent-foreground" });
    } catch (e) {
      console.error("Failed to save schedule:", e);
      setError("Failed to save schedule. Please try again.");
      toast({ variant: "destructive", title: "Save Error", description: "Could not save the schedule." });
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return <p className="text-destructive text-center p-4">{error}</p>;
  }

  return (
    <ScheduleEditor
      schedule={schedule}
      onAddDose={handleAddDose}
      onRemoveDose={handleRemoveDose}
      onSave={handleSaveSchedule}
      isSaving={isSaving}
      isScheduleLoading={isLoadingData}
    />
  );
};

export default ScheduleManager;
