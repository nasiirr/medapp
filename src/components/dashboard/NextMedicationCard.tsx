
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { WeekSchedule, DoseTime } from '@/types'; // DoseTime is string "HH:MM"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BellRing, CalendarX } from 'lucide-react';
import { 
  format, 
  addDays, 
  setHours, 
  setMinutes, 
  setSeconds, 
  isAfter, 
  getDay, 
  parse 
} from 'date-fns';

const daysOfWeekShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const NextMedicationCard: React.FC = () => {
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [nextDoseString, setNextDoseString] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []); // Memoize `now` to stabilize useEffect dependency

  useEffect(() => {
    const scheduleRef = ref(database, 'schedules');
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      setIsLoading(true);
      if (snapshot.exists()) {
        const data = snapshot.val() as WeekSchedule;
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
          console.warn("NextMedicationCard: Firebase schedule data is malformed.");
          setSchedule(null);
          setError("Schedule data is not in the expected format.");
        }
      } else {
        setSchedule(null);
        setError("No schedule data found to determine next dose.");
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
    if (!schedule || isLoading) {
      // If schedule is null (not loaded, error, or empty) or still loading, don't calculate.
      // If there's an error already, keep that error message.
      if (!isLoading && !error && !schedule) {
         setNextDoseString("Schedule not available or empty.");
      }
      return;
    }

    let upcomingDoseDate: Date | null = null;

    for (let d = 0; d < 7; d++) { // Check from today up to 6 days in the future
      const currentDateToCheck = addDays(now, d);
      const dayIndex = getDay(currentDateToCheck); // 0 for Sunday, 1 for Monday, etc.
      
      const dayScheduleTimes = schedule[dayIndex]; // This is DoseTime[] (e.g., ["08:00", "14:30"])
      if (!dayScheduleTimes || dayScheduleTimes.length === 0) continue;

      for (const timeStr of dayScheduleTimes) { // timeStr is "HH:MM"
        const [hour, minute] = timeStr.split(':').map(Number);
        let doseDateTime = setSeconds(setMinutes(setHours(currentDateToCheck, hour), minute), 0);
        
        if (isAfter(doseDateTime, now)) {
          if (!upcomingDoseDate || isAfter(upcomingDoseDate, doseDateTime)) {
            upcomingDoseDate = doseDateTime;
          }
        }
      }
      // If we found a dose on the current day `d` that is the soonest, no need to check further for this iteration
      // but we must check all 7 days to find the absolute soonest.
    }

    if (upcomingDoseDate) {
      setNextDoseString(`${daysOfWeekShort[getDay(upcomingDoseDate)]}, ${format(upcomingDoseDate, 'p')}`);
      setError(null); // Clear previous errors if successful
    } else {
      setNextDoseString("No upcoming doses scheduled for the next 7 days.");
    }

  }, [schedule, now, isLoading, error]);


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
        ) : nextDoseString ? (
          <p className="text-lg text-foreground">{nextDoseString}</p>
        ) : (
          <p className="text-muted-foreground">Calculating next dose...</p> // Should be covered by isLoading or error/nextDoseString
        )}
      </CardContent>
    </Card>
  );
};

export default NextMedicationCard;
