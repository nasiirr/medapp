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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const scheduleRef = ref(database, 'schedules');
    
    // Initial fetch and setup listener
    const unsubscribe = onValue(scheduleRef, async (snapshot) => {
      setIsLoading(true);
      if (snapshot.exists()) {
        const data = snapshot.val() as WeekSchedule;
        // Ensure data is a valid 7x24 array
        if (Array.isArray(data) && data.length === 7 && data.every(day => Array.isArray(day) && day.length === 24)) {
          setSchedule(data);
        } else {
          // Data is malformed, set to initialSchedule and optionally notify
          console.warn("Firebase schedule data is malformed. Resetting to default.");
          setSchedule(initialSchedule);
          // Optionally, update Firebase with the correct structure
          // await set(scheduleRef, initialSchedule); 
        }
      } else {
        // No schedule found, initialize with default and set in Firebase
        setSchedule(initialSchedule);
        try {
          await set(scheduleRef, initialSchedule);
          toast({ title: "Schedule Initialized", description: "Default schedule set in Firebase." });
        } catch (e) {
          console.error("Failed to set initial schedule in Firebase:", e);
          toast({ variant: "destructive", title: "Error", description: "Failed to initialize schedule in Firebase." });
        }
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Firebase onValue error:", err);
      setError("Failed to load schedule. Please try again later.");
      toast({ variant: "destructive", title: "Error", description: "Failed to connect to schedule data." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleToggleSlot = useCallback((dayIndex: number, hourIndex: number) => {
    setSchedule(prevSchedule => {
      if (!prevSchedule) return null;
      const newSchedule = prevSchedule.map(day => [...day]); // Deep copy
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

  if (isLoading && !schedule) {
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

  if (!schedule) {
     return ( // Fallback if schedule is null after loading attempt (e.g., severe Firebase error)
      <div className="space-y-4 p-4 text-center">
        <p>Could not load schedule. Retrying or check connection.</p>
        <Skeleton className="h-12 w-1/2 mx-auto" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  

  return (
    <ScheduleGrid
      schedule={schedule}
      onToggleSlot={handleToggleSlot}
      onSave={handleSaveSchedule}
      isLoading={isSaving}
    />
  );
};

export default ScheduleManager;
