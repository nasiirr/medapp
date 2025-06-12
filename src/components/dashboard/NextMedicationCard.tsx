
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { WeekSchedule } from '@/types';
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
  getDay 
} from 'date-fns';
import { ensureScheduleArray } from '@/lib/utils';

const daysOfWeekShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const NextMedicationCard: React.FC = () => {
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [nextDoseString, setNextDoseString] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    const scheduleRef = ref(database, 'schedules');
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      setIsLoading(true); // Set loading true at the start of data processing
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        const convertedData = ensureScheduleArray(rawData);
        
        if (
          convertedData &&
          convertedData.length === 7 &&
          convertedData.every(daySchedule =>
            // ensureScheduleArray should guarantee daySchedule is an array if convertedData is not null
            Array.isArray(daySchedule) && 
            daySchedule.every(time => typeof time === 'string' && /^\d{2}:\d{2}$/.test(time))
          )
        ) {
          setSchedule(convertedData.map(dayTimes => dayTimes.sort()));
          setError(null); // Clear previous errors
        } else {
          console.warn("NextMedicationCard: Firebase schedule data is malformed or incompatible. Raw data:", rawData);
          setSchedule(null);
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
    if (isLoading) { // If still loading from Firebase, wait
        setNextDoseString(null); // Clear any old dose string
        return;
    }
    if (error || !schedule) { // If there's an error or no schedule (even after loading)
        setNextDoseString(null); // Error message is handled by render, clear dose string
        return;
    }

    let upcomingDoseDate: Date | null = null;

    for (let d = 0; d < 7; d++) { 
      const currentDateToCheck = addDays(now, d);
      const dayIndex = getDay(currentDateToCheck); 
      
      const dayScheduleTimes = schedule[dayIndex];
      if (!dayScheduleTimes || dayScheduleTimes.length === 0) continue;

      for (const timeStr of dayScheduleTimes) { 
        const [hour, minute] = timeStr.split(':').map(Number);
        let doseDateTime = setSeconds(setMinutes(setHours(currentDateToCheck, hour), minute), 0);
        
        if (isAfter(doseDateTime, now)) {
          if (!upcomingDoseDate || isAfter(upcomingDoseDate, doseDateTime)) {
            upcomingDoseDate = doseDateTime;
          }
        }
      }
    }

    if (upcomingDoseDate) {
      setNextDoseString(`${daysOfWeekShort[getDay(upcomingDoseDate)]}, ${format(upcomingDoseDate, 'p')}`);
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
          <p className="text-muted-foreground">No schedule available or no upcoming doses.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default NextMedicationCard;
