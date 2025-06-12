
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import type { WeekSchedule } from '@/types';
import ScheduleGrid from './ScheduleGrid';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const initialSchedule: WeekSchedule = Array(7).fill(null).map(() => Array(24).fill(false));

const ScheduleManager: React.FC = () => {
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true); // For initial data load
  const [isSaving, setIsSaving] = useState<boolean>(false); // For save operation
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const scheduleRef = ref(database, 'schedules');
    
    setIsLoadingData(true);
    const unsubscribe = onValue(scheduleRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as WeekSchedule;
        if (Array.isArray(data) && data.length === 7 && data.every(day => Array.isArray(day) && day.length === 24)) {
          setSchedule(data);
        } else {
          console.warn("Firebase schedule data is malformed. Resetting to default.");
          setSchedule(initialSchedule);
          // Optionally, update Firebase with the correct structure
          // await set(scheduleRef, initialSchedule); 
        }
      } else {
        setSchedule(initialSchedule);
        try {
          await set(scheduleRef, initialSchedule);
          toast({ title: "Schedule Initialized", description: "Default schedule set in Firebase." });
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

  const handleToggleSlot = useCallback((dayIndex: number, hourIndex: number) => {
    setSchedule(prevSchedule => {
      if (!prevSchedule) return null;
      const newSchedule = prevSchedule.map(day => [...day]); 
      newSchedule[dayIndex][hourIndex] = !newSchedule[dayIndex][hourIndex];
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

  if (isLoadingData) { // Use isLoadingData for the initial data fetch skeleton
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-center p-4">{error}</p>;
  }
  
  // ScheduleGrid now handles its internal display loading/skeleton for reordering
  return (
    <ScheduleGrid
      schedule={schedule} // Pass schedule (can be null if not yet loaded or error)
      onToggleSlot={handleToggleSlot}
      onSave={handleSaveSchedule}
      isLoading={isSaving} // isSaving is for the save button state
    />
  );
};

export default ScheduleManager;
