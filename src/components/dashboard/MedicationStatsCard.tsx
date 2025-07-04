
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import type { WeekSchedule, MedicationLog, DoseSlot } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, AlertCircle, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import {
  startOfDay,
  endOfDay,
  getHours,
  getMinutes,
  getDay,
  subDays,
  isSameDay,
  setHours,
  setMinutes,
  setSeconds,
  isBefore,
} from 'date-fns';
import { ensureScheduleArray } from '@/lib/utils';

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

  const today = useMemo(() => new Date(), []);
  const startOfToday = useMemo(() => startOfDay(today), [today]);
  const endOfToday = useMemo(() => endOfDay(today), [today]);

  useEffect(() => {
    if (!database) {
      setError("Firebase is not configured. Cannot load medication stats.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const scheduleRef = ref(database, 'schedules');
    const logsRef = ref(database, 'medication_logs');
    const logsQuery = query(logsRef, orderByChild('timestamp_millis'));

    let scheduleDataInternal: WeekSchedule | null = null;
    let logsDataInternal: MedicationLog[] = [];
    let scheduleError: string | null = null;
    let logsError: string | null = null;

    const tryCalculateStats = () => {
      if (scheduleError || logsError) {
        setError(scheduleError || logsError || "An error occurred calculating stats.");
        setIsLoading(false);
        setStats(null);
        return;
      }
      
      if (scheduleDataInternal === undefined || logsDataInternal === undefined) {
         setIsLoading(true); 
         return;
      }

      if (scheduleDataInternal === null) {
        setError(scheduleError || "Schedule data is unavailable to calculate stats.");
        setIsLoading(false);
        setStats(null);
        return;
      }
      
      setIsLoading(false); 

      const now = new Date(); 

      let calculatedScheduledTodayPast = 0;
      const currentDayIndex = getDay(now);
      const todayScheduleSlots = (scheduleDataInternal[currentDayIndex] || []).filter(s => s.enabled);
      for (const doseSlot of todayScheduleSlots) {
        const timeStr = doseSlot.time;
        if (typeof timeStr !== 'string' || !/^\d{2}:\d{2}$/.test(timeStr)) {
          console.warn(`MedicationStatsCard: Invalid time_str '${String(timeStr)}' in schedule for day ${currentDayIndex}. Skipping.`);
          continue;
        }
        const [hour, minute] = timeStr.split(':').map(Number);
        const doseDateTime = setSeconds(setMinutes(setHours(now, hour), minute), 0);
        if (isBefore(doseDateTime, now)) {
          calculatedScheduledTodayPast++;
        }
      }
      
      const takenTodayLogs = logsDataInternal.filter(log =>
        log.timestamp_millis >= startOfToday.getTime() && log.timestamp_millis <= endOfToday.getTime()
      ).length;

      let calculatedScheduledThisWeekPast = 0;
      let calculatedTakenThisWeek = 0;

      for (let i = 0; i < 7; i++) { 
        const dayToConsider = subDays(now, i);
        const dayIndexInSchedule = getDay(dayToConsider);
        const dayScheduleSlotsForCalc = (scheduleDataInternal[dayIndexInSchedule] || []).filter(s => s.enabled);

        for (const doseSlot of dayScheduleSlotsForCalc) {
          const timeStr = doseSlot.time;
          if (typeof timeStr !== 'string' || !/^\d{2}:\d{2}$/.test(timeStr)) {
            console.warn(`MedicationStatsCard: Invalid time_str '${String(timeStr)}' in schedule for day ${dayIndexInSchedule}. Skipping.`);
            continue;
          }
          const [hour, minute] = timeStr.split(':').map(Number);
          const doseDateTime = setSeconds(setMinutes(setHours(dayToConsider, hour), minute), 0);
          if (isBefore(doseDateTime, now)) { 
            calculatedScheduledThisWeekPast++;
          }
        }
        
        const dayLogs = logsDataInternal.filter(log => {
            const logDate = new Date(log.timestamp_millis);
            return isSameDay(logDate, dayToConsider);
        }).length;
        calculatedTakenThisWeek += dayLogs;
      }
      
      const adherence = calculatedScheduledThisWeekPast > 0
        ? Math.round((calculatedTakenThisWeek / calculatedScheduledThisWeekPast) * 100)
        : null;

      setStats({
        scheduledTodayPast: calculatedScheduledTodayPast,
        takenToday: takenTodayLogs,
        scheduledThisWeekPast: calculatedScheduledThisWeekPast,
        takenThisWeek: calculatedTakenThisWeek,
        adherenceThisWeek: adherence,
      });
      setError(null); 
    };

    const unsubscribeSchedule = onValue(scheduleRef, (scheduleSnapshot) => {
      if (scheduleSnapshot.exists()) {
        const rawData = scheduleSnapshot.val();
        const convertedData = ensureScheduleArray(rawData);
        if (convertedData) {
          scheduleDataInternal = convertedData;
          scheduleError = null;
        } else {
          console.warn("MedicationStatsCard: Firebase schedule data is malformed or incompatible. Raw data:", rawData);
          scheduleDataInternal = null;
          scheduleError = "Schedule data is invalid.";
        }
      } else {
        scheduleDataInternal = null;
        scheduleError = "No schedule data found.";
      }
      tryCalculateStats();
    }, (err) => {
      console.error("Firebase onValue error for schedule in MedicationStatsCard:", err);
      scheduleError = "Failed to load schedule data.";
      tryCalculateStats(); 
    });

    const unsubscribeLogs = onValue(logsQuery, (logsSnapshot) => {
      const allLogs: MedicationLog[] = [];
      if (logsSnapshot.exists()) {
        logsSnapshot.forEach((childSnapshot) => {
           const logValue = childSnapshot.val();
           if (logValue && typeof logValue.timestamp_millis === 'number') {
             allLogs.push({ id: childSnapshot.key!, ...logValue });
           }
        });
      }
      logsDataInternal = allLogs;
      logsError = null;
      tryCalculateStats();
    }, (err) => {
      console.error("Firebase onValue error for logs in MedicationStatsCard:", err);
      logsError = "Failed to load medication logs.";
      tryCalculateStats();
    });
    
    return () => {
      unsubscribeSchedule(); 
      unsubscribeLogs(); 
    };
  }, [today, startOfToday, endOfToday]); 

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
          <p className="text-muted-foreground">No statistics available yet or schedule is empty.</p>
        </CardContent>
      </Card>
    );
  }
  
  let adherenceColorValue: string;
  let AdherenceIconToRender: React.ElementType;

  if (stats.adherenceThisWeek === null) {
    adherenceColorValue = "text-muted-foreground"; 
    AdherenceIconToRender = TrendingUp;
  } else if (stats.adherenceThisWeek >= 80) {
    adherenceColorValue = "text-green-600";
    AdherenceIconToRender = CheckCircle;
  } else if (stats.adherenceThisWeek >= 50) {
    adherenceColorValue = "text-yellow-600";
    AdherenceIconToRender = TrendingUp;
  } else {
    adherenceColorValue = "text-red-600";
    AdherenceIconToRender = TrendingDown;
  }


  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center">
          <ClipboardList className="mr-2 h-5 w-5 text-primary" />
          Medication Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderStatItem("Today - Taken / Scheduled (Past Doses):", `${stats.takenToday} / ${stats.scheduledTodayPast}`)}
        {renderStatItem("This Week (Last 7 Days) - Taken / Scheduled (Past Doses):", `${stats.takenThisWeek} / ${stats.scheduledThisWeekPast}`)}
        {renderStatItem(
          "This Week - Adherence:",
          stats.adherenceThisWeek !== null ? `${stats.adherenceThisWeek}%` : "N/A",
          <AdherenceIconToRender className={`h-4 w-4 ${adherenceColorValue}`} />
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationStatsCard;
