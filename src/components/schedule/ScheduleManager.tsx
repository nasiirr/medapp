
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
      let finalSchedule: WeekSchedule;
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        let baseSchedule = ensureScheduleArray(rawData); 

        if (baseSchedule && baseSchedule.length === 7) {
          finalSchedule = baseSchedule.map(dayTimes => {
            let times = Array.isArray(dayTimes)
              ? dayTimes.filter(t => typeof t === 'string' && /^\d{2}:\d{2}$/.test(t))
              : [];
            
            times.sort();

            const normalizedDayTimes: DoseTime[] = [];
            for (let i = 0; i < 4; i++) {
              normalizedDayTimes.push(times[i] || "00:00"); 
            }
            return normalizedDayTimes.sort(); 
          });
        } else {
          console.warn("Firebase schedule data is malformed or not a 7-day array. Resetting to default.", rawData);
          finalSchedule = createInitialSchedule();
          try {
            await set(scheduleRef, finalSchedule);
            toast({ title: "Schedule Corrected", description: "Schedule data was incompatible and has been reset." });
          } catch (e) {
            console.error("Failed to set corrected schedule in Firebase:", e);
          }
        }
      } else {
        finalSchedule = createInitialSchedule();
        try {
          await set(scheduleRef, finalSchedule);
          toast({ title: "Schedule Initialized", description: "Default medication schedule has been set." });
        } catch (e) {
          console.error("Failed to set initial schedule in Firebase:", e);
          toast({ variant: "destructive", title: "Error", description: "Failed to initialize schedule in Firebase." });
        }
      }
      setSchedule(finalSchedule);
      setIsLoadingData(false);
    }, (err) => {
      console.error("Firebase onValue error:", err);
      setError("Failed to load schedule. Please try again later.");
      toast({ variant: "destructive", title: "Error", description: "Failed to connect to schedule data." });
      setIsLoadingData(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleEditDoseTime = useCallback((dayIndex: number, doseSlotIndex: number, newTime: DoseTime) => {
    if (!/^\d{2}:\d{2}$/.test(newTime)) {
      toast({ variant: "destructive", title: "Invalid Time", description: "Time format is incorrect (HH:MM)." });
      return;
    }
    setSchedule(prevSchedule => {
      if (!prevSchedule) return null;
      const newSchedule = prevSchedule.map(day => [...day]);
      if (newSchedule[dayIndex] && newSchedule[dayIndex][doseSlotIndex] !== undefined) {
        newSchedule[dayIndex][doseSlotIndex] = newTime;
        newSchedule[dayIndex] = [...newSchedule[dayIndex]].sort(); 
      } else {
         console.warn(`Attempted to edit non-existent slot: day ${dayIndex}, slot ${doseSlotIndex}`);
      }
      return newSchedule;
    });
  }, [toast]);

  const handleSaveSchedule = async () => {
    if (!schedule) {
      toast({ variant: "destructive", title: "Error", description: "No schedule data to save." });
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const scheduleRef = ref(database, 'schedules');
      // Schedule state should already be normalized (4 slots per day, sorted)
      await set(scheduleRef, schedule);
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
      onEditDoseTime={handleEditDoseTime}
      onSave={handleSaveSchedule}
      isSaving={isSaving}
      isScheduleLoading={isLoadingData}
    />
  );
};

export default ScheduleManager;
