
"use client";

import React, { useState, useEffect } from 'react';
import type { WeekSchedule } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill, Clock } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleGridProps {
  schedule: WeekSchedule | null; // Allow schedule to be null initially
  onToggleSlot: (dayIndex: number, hourIndex: number) => void;
  onSave: () => void;
  isLoading: boolean; // This is for the save button's loading state
}

const baseDaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ schedule, onToggleSlot, onSave, isLoading }) => {
  const [isClient, setIsClient] = useState(false);
  const [currentDayOriginalIndex, setCurrentDayOriginalIndex] = useState(0); // 0 for Sun, ..., 6 for Sat
  const [orderedDisplayDays, setOrderedDisplayDays] = useState<string[]>(baseDaysOfWeek);
  const [orderedDisplaySchedule, setOrderedDisplaySchedule] = useState<WeekSchedule | null>(null);

  useEffect(() => {
    setIsClient(true);
    const todaySystemIndex = new Date().getDay(); // 0 for Sunday, ..., 6 for Saturday
    setCurrentDayOriginalIndex(todaySystemIndex);

    // Initial setup for orderedDisplayDays, even if schedule is null
    const newOrderedDays = [...baseDaysOfWeek.slice(todaySystemIndex), ...baseDaysOfWeek.slice(0, todaySystemIndex)];
    setOrderedDisplayDays(newOrderedDays);

    if (schedule) {
      const newOrderedScheduleData: WeekSchedule = [];
      for (let i = 0; i < 7; i++) {
        newOrderedScheduleData.push(schedule[(todaySystemIndex + i) % 7]);
      }
      setOrderedDisplaySchedule(newOrderedScheduleData);
    } else {
      setOrderedDisplaySchedule(null); // Handle null schedule prop
    }
  }, [schedule]); // Re-run when the main schedule prop changes

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}${ampm}`;
  };

  const handleToggleSlot = (displayedDayIndex: number, hourIndex: number) => {
    if (!isClient || orderedDisplaySchedule === null) return;
    // Map displayedDayIndex back to original day index (Sun=0)
    const originalDayIndex = (currentDayOriginalIndex + displayedDayIndex) % 7;
    onToggleSlot(originalDayIndex, hourIndex);
  };

  if (!isClient || (schedule && !orderedDisplaySchedule) ) {
    // Show skeleton if not client yet, or if schedule is loaded but ordered one is not ready
    return (
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-headline font-semibold flex items-center">
            <Clock className="mr-2 h-6 w-6 text-primary" />
            Medication Schedule
          </CardTitle>
          <Button disabled variant="default">
            {isLoading ? 'Saving...' : 'Save Schedule'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Day/Time</th>
                  {Array.from({ length: 24 }, (_, i) => (
                    <th key={i} className="px-2 py-3.5 text-center text-xs font-semibold text-foreground whitespace-nowrap">
                      {formatHour(i)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {baseDaysOfWeek.map((day) => (
                  <tr key={day}>
                    <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-foreground"><Skeleton className="h-5 w-10" /></td>
                    {Array.from({ length: 24 }).map((_, hourIndex) => (
                      <td key={hourIndex} className="whitespace-nowrap px-2 py-2 text-sm text-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-headline font-semibold flex items-center">
          <Clock className="mr-2 h-6 w-6 text-primary" />
          Medication Schedule
        </CardTitle>
        <Button onClick={onSave} disabled={isLoading || !schedule} variant="default">
          {isLoading ? 'Saving...' : 'Save Schedule'}
        </Button>
      </CardHeader>
      <CardContent>
        { !schedule || !orderedDisplaySchedule ? (
            <p className="text-muted-foreground text-center py-4">Loading schedule...</p>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Day/Time</th>
                {Array.from({ length: 24 }, (_, i) => (
                  <th key={i} className="px-2 py-3.5 text-center text-xs font-semibold text-foreground whitespace-nowrap">
                    {formatHour(i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {orderedDisplayDays.map((day, displayedDayIdx) => (
                <tr key={day} className="transition-colors hover:bg-muted/30">
                  <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-foreground">{day}</td>
                  {orderedDisplaySchedule[displayedDayIdx]?.map((isScheduled, hourIndex) => (
                    <td key={hourIndex} className="whitespace-nowrap px-2 py-2 text-sm text-center">
                      <Button
                        variant={isScheduled ? "default" : "outline"}
                        size="icon"
                        className={`h-8 w-8 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 ${
                          isScheduled ? 'bg-primary hover:bg-primary/90' : 'border-primary/50 text-primary hover:bg-primary/10'
                        }`}
                        onClick={() => handleToggleSlot(displayedDayIdx, hourIndex)}
                        aria-label={`Toggle schedule for ${day} at ${formatHour(hourIndex)}`}
                      >
                        {isScheduled ? <Pill className="h-4 w-4 text-primary-foreground" /> : <Pill className="h-4 w-4 text-primary/70" />}
                      </Button>
                    </td>
                  ))}
                   {!orderedDisplaySchedule[displayedDayIdx] && Array.from({ length: 24 }).map((_, hourIndex) => ( // Skeleton for hours if day's schedule not loaded
                    <td key={hourIndex} className="whitespace-nowrap px-2 py-2 text-sm text-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        {isLoading && <p className="text-sm text-muted-foreground mt-4">Updating schedule...</p>}
      </CardContent>
    </Card>
  );
};

export default ScheduleGrid;
