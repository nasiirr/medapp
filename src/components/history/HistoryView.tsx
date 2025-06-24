
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import type { MedicationLog, WeekSchedule, DayHistory, DoseStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  getDay,
  setHours,
  setMinutes,
  setSeconds,
  isBefore,
  isAfter,
} from 'date-fns';
import { ensureScheduleArray } from '@/lib/utils';
import DayCard from './DayCard';

const doseSlotLabels = ["Morning Dose", "Afternoon Dose", "Night Dose", "Optional/Emergency Dose"];

const HistoryView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!database) {
      setError("Firebase not configured.");
      setIsLoading(false);
      return;
    }

    const scheduleRef = ref(database, 'schedules');
    const logsRef = ref(database, 'medication_logs');
    const logsQuery = query(logsRef, orderByChild('timestamp_millis'));

    const unsubSchedule = onValue(scheduleRef, (snapshot) => {
      if (snapshot.exists()) {
        setSchedule(ensureScheduleArray(snapshot.val()));
      } else {
        setError("Schedule not found.");
      }
    }, (err) => {
      console.error(err);
      setError("Failed to load schedule.");
    });

    const unsubLogs = onValue(logsQuery, (snapshot) => {
      const loadedLogs: MedicationLog[] = [];
      snapshot.forEach(child => {
        loadedLogs.push({ id: child.key!, ...child.val() });
      });
      setLogs(loadedLogs);
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setError("Failed to load logs.");
      setIsLoading(false);
    });

    return () => {
      unsubSchedule();
      unsubLogs();
    };
  }, []);

  const monthHistory = useMemo((): DayHistory[] => {
    if (!schedule || !logs) return [];

    const monthDays = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });

    return monthDays.map(day => {
      const dayOfWeek = getDay(day);
      const daySchedule = schedule[dayOfWeek] || [];
      const dayLogs = logs.filter(log =>
        new Date(log.timestamp_millis).toDateString() === day.toDateString()
      );

      const doses: DoseStatus[] = daySchedule.map((scheduledTime, index) => {
        const [hour, minute] = scheduledTime.split(':').map(Number);
        const doseDateTime = setSeconds(setMinutes(setHours(day, hour), minute), 0);
        
        const nextScheduledTimeStr = daySchedule[index + 1];
        let windowEnd: Date;
        if (nextScheduledTimeStr) {
          const [nextHour, nextMinute] = nextScheduledTimeStr.split(':').map(Number);
          windowEnd = setSeconds(setMinutes(setHours(day, nextHour), nextMinute), 0);
        } else {
          windowEnd = endOfMonth(day);
        }

        const logInWindow = dayLogs.find(log => {
          const logTime = new Date(log.timestamp_millis);
          return isAfter(logTime, doseDateTime) && isBefore(logTime, windowEnd);
        });
        
        let status: DoseStatus['status'] = 'pending';
        if (logInWindow) {
          status = logInWindow.action === 'medication_confirmed' ? 'taken' : 'missed';
        } else if (isBefore(doseDateTime, new Date())) {
          // If the scheduled time is in the past and no log was found, it's considered missed.
          // Note: This assumes a log is *always* generated. If not, this might be inaccurate.
          // We rely on explicit "medication_missed" logs primarily.
        }

        return {
          slotName: doseSlotLabels[index] || `Dose ${index + 1}`,
          scheduledTime,
          status,
          log: logInWindow,
        };
      });

      return { date: day, doses };
    });
  }, [currentMonth, schedule, logs]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prev => subMonths(prev, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => addMonths(prev, 1));
  }, []);

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  if (error) {
    return <p className="text-destructive flex items-center"><AlertCircle className="mr-2" /> {error}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={isAfter(addMonths(currentMonth, 1), new Date())}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {monthHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {monthHistory.map(dayHistory => (
              <DayCard key={dayHistory.date.toISOString()} dayHistory={dayHistory} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No history data available for this month.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default HistoryView;
