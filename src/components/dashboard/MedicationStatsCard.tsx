
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, startAt, endAt } from 'firebase/database';
import type { WeekSchedule, MedicationLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, AlertCircle, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import {
  startOfDay,
  endOfDay,
  isWithinInterval,
  getHours,
  getDay,
  subDays,
  isBefore,
  isSameDay,
  parseISO,
} from 'date-fns';

interface Stats {
  scheduledTodayPast: number;
  takenToday: number;
  scheduledThisWeekPast: number;
  takenThisWeek: number;
  adherenceThisWeek: number | null;
}

const MedicationStatsCard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize date ranges to prevent re-calculating on every render
  const today = useMemo(() => new Date(), []);
  const startOfToday = useMemo(() => startOfDay(today), [today]);
  const endOfToday = useMemo(() => endOfDay(today), [today]);
  const startOfThisWeekPeriod = useMemo(() => startOfDay(subDays(today, 6)), [today]); // Last 7 days including today

  useEffect(() => {
    setIsLoading(true);
    const scheduleRef = ref(database, 'schedules');
    const logsRef = ref(database, 'medication_logs');

    // Order logs by timestamp to efficiently query for date ranges
    // Firebase RTDB queries for ranges on string paths require specific structuring
    // For numeric timestamps, it's more straightforward.
    const logsQuery = query(logsRef, orderByChild('timestamp'));

    let scheduleData: WeekSchedule | null = null;
    let logsData: MedicationLog[] = [];

    const onScheduleValue = onValue(scheduleRef, (scheduleSnapshot) => {
      if (scheduleSnapshot.exists()) {
        const data = scheduleSnapshot.val() as WeekSchedule;
        if (Array.isArray(data) && data.length === 7 && data.every(day => Array.isArray(day) && day.length === 24)) {
          scheduleData = data;
        } else {
           console.warn("MedicationStatsCard: Firebase schedule data is malformed.");
           scheduleData = null;
        }
      } else {
        scheduleData = null;
      }
      tryCalculateStats();
    }, (err) => {
      console.error("Firebase onValue error for schedule in MedicationStatsCard:", err);
      setError("Failed to load schedule data.");
      setIsLoading(false);
    });

    const onLogsValue = onValue(logsQuery, (logsSnapshot) => {
      const allLogs: MedicationLog[] = [];
      if (logsSnapshot.exists()) {
        logsSnapshot.forEach((childSnapshot) => {
          allLogs.push({ id: childSnapshot.key!, ...childSnapshot.val() });
        });
      }
      logsData = allLogs;
      tryCalculateStats();
    }, (err) => {
      console.error("Firebase onValue error for logs in MedicationStatsCard:", err);
      setError("Failed to load medication logs.");
      setIsLoading(false);
    });

    const tryCalculateStats = () => {
      if (scheduleData === undefined || logsData === undefined) {
        // Data not yet loaded
        return;
      }
      if (scheduleData === null) {
        setError("Schedule data is unavailable to calculate stats.");
        setIsLoading(false);
        setStats(null);
        return;
      }

      const currentHour = getHours(today);
      const currentDayIndex = getDay(today); // Sunday = 0, Monday = 1, ...

      let calculatedScheduledTodayPast = 0;
      if (scheduleData[currentDayIndex]) {
        for (let hour = 0; hour < currentHour; hour++) {
          if (scheduleData[currentDayIndex][hour]) {
            calculatedScheduledTodayPast++;
          }
        }
      }
      
      const takenTodayLogs = logsData.filter(log =>
        log.timestamp >= startOfToday.getTime() && log.timestamp <= endOfToday.getTime()
      ).length;

      let calculatedScheduledThisWeekPast = 0;
      let calculatedTakenThisWeek = 0;

      for (let i = 0; i < 7; i++) { // Iterate over the last 7 days (0 = today, 1 = yesterday, ..., 6 = 6 days ago)
        const dayToConsider = subDays(today, i);
        const dayIndexInSchedule = getDay(dayToConsider); // Get the 0-6 index for schedule
        
        if (scheduleData[dayIndexInSchedule]) {
          const hoursInThisDay = scheduleData[dayIndexInSchedule];
          const relevantHours = isSameDay(dayToConsider, today) ? currentHour : 24; // Only up to current hour for today

          for (let hour = 0; hour < relevantHours; hour++) {
            if (hoursInThisDay[hour]) {
              calculatedScheduledThisWeekPast++;
            }
          }
        }
        
        const dayLogs = logsData.filter(log => {
            const logDate = new Date(log.timestamp);
            return isSameDay(logDate, dayToConsider);
        }).length;
        calculatedTakenThisWeek += dayLogs;
      }
      
      const adherence = calculatedScheduledThisWeekPast > 0
        ? Math.round((calculatedTakenThisWeek / calculatedScheduledThisWeekPast) * 100)
        : null; // Avoid division by zero, null if no past scheduled doses

      setStats({
        scheduledTodayPast: calculatedScheduledTodayPast,
        takenToday: takenTodayLogs,
        scheduledThisWeekPast: calculatedScheduledThisWeekPast,
        takenThisWeek: calculatedTakenThisWeek,
        adherenceThisWeek: adherence,
      });
      setError(null); // Clear previous errors if successful
      setIsLoading(false);
    };
    
    // Initial call in case data is already cached or loads very fast
    // tryCalculateStats(); 

    return () => {
      onScheduleValue(); // Detach listener
      onLogsValue(); // Detach listener
    };
  }, [today, startOfToday, endOfToday, startOfThisWeekPeriod]); // Rerun if date ranges change (e.g. day changes)

  const renderStatItem = (label: string, value: string | number, icon?: React.ReactNode) => (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
      <div className="flex items-center text-sm text-muted-foreground">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center">
            <ClipboardList className="mr-2 h-5 w-5 text-primary" />
            Medication Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center">
            <ClipboardList className="mr-2 h-5 w-5 text-primary" />
            Medication Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" /> {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center">
            <ClipboardList className="mr-2 h-5 w-5 text-primary" />
            Medication Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No statistics available yet.</p>
        </CardContent>
      </Card>
    );
  }
  
  const adherenceColor = stats.adherenceThisWeek === null ? "text-muted-foreground" :
                         stats.adherenceThisWeek >= 80 ? "text-green-600" :
                         stats.adherenceThisWeek >= 50 ? "text-yellow-600" :
                         "text-red-600";
  const AdherenceIcon = stats.adherenceThisWeek === null ? TrendingUp :
                        stats.adherenceThisWeek >= 80 ? CheckCircle :
                        stats.adherenceThisWeek >= 50 ? TrendingUp :
                        TrendingDown;


  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center">
          <ClipboardList className="mr-2 h-5 w-5 text-primary" />
          Medication Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderStatItem("Today - Taken / Scheduled (Past Hours):", `${stats.takenToday} / ${stats.scheduledTodayPast}`)}
        {renderStatItem("This Week (Last 7 Days) - Taken / Scheduled (Past Slots):", `${stats.takenThisWeek} / ${stats.scheduledThisWeekPast}`)}
        {renderStatItem(
          "This Week - Adherence:",
          stats.adherenceThisWeek !== null ? `${stats.adherenceThisWeek}%` : "N/A",
          <AdherenceIcon className={`h-4 w-4 ${adherenceColor}`} />
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationStatsCard;
