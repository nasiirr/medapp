
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import type { WeekSchedule, DoseTime } from '@/types';
import ScheduleEditor from './ScheduleEditor';
import { useToast } from "@/hooks/use-toast";
import { ensureScheduleArray } from '@/lib/utils';

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
        const rawData = snapshot.val();
        const convertedData = ensureScheduleArray(rawData);

        if (
          convertedData && // Check if conversion was successful and data is not null
          convertedData.length === 7 &&
          convertedData.every(daySchedule =>
            Array.isArray(daySchedule) && // This check is a bit redundant if ensureScheduleArray guarantees it
            daySchedule.every(time => typeof time === 'string' && /^\d{2}:\d{2}$/.test(time))
          )
        ) {
          setSchedule(convertedData.map(dayTimes => dayTimes.sort()));
        } else {
          console.warn("Firebase schedule data is malformed or incompatible. Resetting to default. Raw data:", rawData);
          setSchedule(initialSchedule);
          try {
            await set(scheduleRef, initialSchedule);
            toast({ title: "Schedule Corrected", description: "Schedule data was incompatible and has been reset to default." });
          } catch (e) {
            console.error("Failed to set corrected initial schedule in Firebase:", e);
            // Don't toast here as it might conflict with other error toasts
          }
        }
      } else {
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
      if (!prevSchedule) return null; // Should ideally not happen if loading state is managed
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
      const sortedSchedule = schedule.map(dayTimes => [...dayTimes].sort());
      await set(scheduleRef, sortedSchedule);
      setSchedule(sortedSchedule); 
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
