
"use client";

import React, { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { WeekSchedule } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BellRing, CalendarX } from 'lucide-react';
import { format, addDays, setHours, setMinutes, setSeconds,isAfter, getDay, getHours } from 'date-fns';

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const NextMedicationCard: React.FC = () => {
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [nextDose, setNextDose] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scheduleRef = ref(database, 'schedules');
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() as WeekSchedule;
         if (Array.isArray(data) && data.length === 7 && data.every(day => Array.isArray(day) && day.length === 24)) {
          setSchedule(data);
        } else {
          console.warn("NextMedicationCard: Firebase schedule data is malformed.");
          setSchedule(null); // Or some default empty schedule
          setError("Schedule data is not in the expected format.");
        }
      } else {
        setSchedule(null);
        setError("No schedule data found.");
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Firebase onValue error for schedule in NextMedicationCard:", err);
      setError("Failed to load schedule.");
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (schedule) {
      const now = new Date();
      let foundNextDose = false;

      // Start from current day and current hour
      let currentDayIndex = getDay(now); // 0 for Sunday, 1 for Monday, etc.
      let currentHour = getHours(now);

      for (let d = 0; d < 7; d++) { // Check next 7 days
        const dayToCheckIndex = (currentDayIndex + d) % 7;
        const daySchedule = schedule[dayToCheckIndex];

        if (!daySchedule || !Array.isArray(daySchedule)) continue;


        const startHour = (d === 0) ? currentHour + 1 : 0; // If today, start from next hour

        for (let h = startHour; h < 24; h++) {
          if (daySchedule[h]) {
            const doseDateTime = setSeconds(setMinutes(setHours(addDays(now, d), h),0),0);
            // If checking today, ensure the found dose time is actually in the future
            if (d === 0 && !isAfter(doseDateTime, now)) {
                // If it's today but the hour is past or current, skip (handled by currentHour + 1)
                // This case primarily handles if a dose was scheduled for currentHour but we start check from currentHour+1
                continue;
            }

            setNextDose(`${daysOfWeek[dayToCheckIndex]}, ${format(doseDateTime, 'p')}`);
            foundNextDose = true;
            break;
          }
        }
        if (foundNextDose) break;
      }

      if (!foundNextDose) {
        setNextDose("No upcoming doses scheduled for the next 7 days.");
      }
    } else if (!isLoading && !error) {
         setNextDose("Schedule not available to determine next dose.");
    }
  }, [schedule, isLoading, error]);


  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center">
            <BellRing className="mr-2 h-5 w-5 text-primary" />
            Next Upcoming Dose
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center">
          <BellRing className="mr-2 h-5 w-5 text-primary" />
          Next Upcoming Dose
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-destructive flex items-center">
            <CalendarX className="mr-2 h-5 w-5" /> {error}
          </p>
        ) : nextDose ? (
          <p className="text-lg text-foreground">{nextDose}</p>
        ) : (
          <p className="text-muted-foreground">Calculating next dose...</p>
        )}
      </CardContent>
    </Card>
  );
};

export default NextMedicationCard;
