
"use client";

import React, { useState, useEffect } from 'react';
import type { WeekSchedule, DoseTime } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CustomTimePicker from './CustomTimePicker';
import { Clock, Save } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleEditorProps {
  schedule: WeekSchedule | null;
  onEditDoseTime: (dayIndex: number, doseSlotIndex: number, newTime: DoseTime) => void;
  onSave: () => void;
  isSaving: boolean;
  isScheduleLoading: boolean;
}

const baseDaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  schedule,
  onEditDoseTime,
  onSave,
  isSaving,
  isScheduleLoading,
}) => {
  const [currentDayOriginalIndex, setCurrentDayOriginalIndex] = useState(0); 
  const [orderedDisplayDays, setOrderedDisplayDays] = useState<string[]>(baseDaysOfWeek);
  const [orderedDisplaySchedule, setOrderedDisplaySchedule] = useState<WeekSchedule | null>(null);

  useEffect(() => {
    const todaySystemIndex = new Date().getDay(); 
    setCurrentDayOriginalIndex(todaySystemIndex);

    const newOrderedDays = [...baseDaysOfWeek.slice(todaySystemIndex), ...baseDaysOfWeek.slice(0, todaySystemIndex)];
    setOrderedDisplayDays(newOrderedDays);

    if (schedule) {
      const newOrderedScheduleData: WeekSchedule = [];
      for (let i = 0; i < 7; i++) {
        // Ensure schedule[(todaySystemIndex + i) % 7] exists and is an array of 4
        const daySchedule = schedule[(todaySystemIndex + i) % 7];
        newOrderedScheduleData.push(
          Array.isArray(daySchedule) && daySchedule.length === 4 
            ? daySchedule 
            : ["00:00", "00:00", "00:00", "00:00"] // Fallback if structure is off
        );
      }
      setOrderedDisplaySchedule(newOrderedScheduleData);
    } else {
      setOrderedDisplaySchedule(null);
    }
  }, [schedule]);
  
  if (isScheduleLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-headline font-semibold flex items-center">
            <Clock className="mr-2 h-6 w-6 text-primary" />
            Medication Schedule
          </CardTitle>
          <Button disabled variant="default" size="lg">
            <Save className="mr-2 h-5 w-5" />
            Save Schedule
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-8 w-1/4 mb-1" />
              <Skeleton className="h-8 w-1/4 mb-1" />
              <Skeleton className="h-8 w-1/4 mb-1" />
              <Skeleton className="h-8 w-1/4 mb-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-2xl font-headline font-semibold flex items-center">
            <Clock className="mr-2 h-6 w-6 text-primary" />
            Medication Schedule
          </CardTitle>
          <CardDescription>Set precise times for your four daily medication slots. Times are auto-sorted.</CardDescription>
        </div>
        <Button onClick={onSave} disabled={isSaving || !schedule} size="lg">
          {isSaving ? 'Saving...' : <><Save className="mr-2 h-5 w-5" /> Save Schedule</>}
        </Button>
      </CardHeader>
      <CardContent>
        {!orderedDisplaySchedule ? (
          <p className="text-muted-foreground text-center py-4">Loading schedule details...</p>
        ) : (
          <div className="space-y-6">
            {orderedDisplayDays.map((dayName, displayedDayIdx) => {
              const originalDayIndex = (currentDayOriginalIndex + displayedDayIdx) % 7;
              const dayScheduleTimes = orderedDisplaySchedule[displayedDayIdx] || ["00:00", "00:00", "00:00", "00:00"];

              return (
                <Card key={originalDayIndex} className="bg-background/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">{dayName}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {dayScheduleTimes.map((time, doseSlotIndex) => {
                       const timePickerId = `time-picker-${originalDayIndex}-${doseSlotIndex}`;
                       return (
                        <div key={doseSlotIndex} className="flex flex-col items-start gap-1 p-2 border rounded-md bg-card/80">
                           <label htmlFor={timePickerId} className="text-sm font-medium text-muted-foreground ml-1">Dose {doseSlotIndex + 1}</label>
                           <CustomTimePicker
                             id={timePickerId}
                             value={time} // This should be one of the 4 times for the day
                             onChange={(newTime) => onEditDoseTime(originalDayIndex, doseSlotIndex, newTime)}
                           />
                         </div>
                       );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {isSaving && <p className="text-sm text-muted-foreground mt-4 text-center">Updating schedule...</p>}
      </CardContent>
    </Card>
  );
};

export default ScheduleEditor;
