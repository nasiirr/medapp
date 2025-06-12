
"use client";

import React, { useState, useEffect } from 'react';
import type { WeekSchedule, DoseTime } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input'; // No longer needed
import CustomTimePicker from './CustomTimePicker'; // Import the new component
import { Badge } from '@/components/ui/badge';
import { Clock, PlusCircle, X, Save } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleEditorProps {
  schedule: WeekSchedule | null;
  onAddDose: (dayIndex: number, time: DoseTime) => void;
  onRemoveDose: (dayIndex: number, timeIndex: number) => void;
  onSave: () => void;
  isSaving: boolean;
  isScheduleLoading: boolean;
}

const baseDaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  schedule,
  onAddDose,
  onRemoveDose,
  onSave,
  isSaving,
  isScheduleLoading,
}) => {
  const [newTimeInputs, setNewTimeInputs] = useState<string[]>(Array(7).fill("00:00")); // Default to "00:00"
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
        newOrderedScheduleData.push(schedule[(todaySystemIndex + i) % 7]);
      }
      setOrderedDisplaySchedule(newOrderedScheduleData);
    } else {
      setOrderedDisplaySchedule(null);
    }
  }, [schedule]);

  const handleNewTimeInputChange = (originalDayIdx: number, value: string) => {
    setNewTimeInputs(prev => {
      const updatedInputs = [...prev];
      updatedInputs[originalDayIdx] = value;
      return updatedInputs;
    });
  };

  const handleAddTimeDose = (originalDayIdx: number) => {
    const timeToAdd = newTimeInputs[originalDayIdx];
    // CustomTimePicker ensures timeToAdd is always valid "HH:MM"
    onAddDose(originalDayIdx, timeToAdd);
    // Optionally reset input for that day to "00:00" after adding, or leave as is
    // For now, leave as is, so user can add slight variations easily.
    // handleNewTimeInputChange(originalDayIdx, "00:00"); 
  };
  
  const handleRemoveWrapper = (displayedDayIdx: number, timeIndex: number) => {
    if (!orderedDisplaySchedule) return;
    const originalDayIndex = (currentDayOriginalIndex + displayedDayIdx) % 7;
    onRemoveDose(originalDayIndex, timeIndex);
  };


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
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-10 w-1/2" />
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
          <CardDescription>Set precise times for your medication, sorted automatically.</CardDescription>
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
              const dayScheduleTimes = orderedDisplaySchedule[displayedDayIdx] || [];
              const timeInputId = `time-picker-${originalDayIndex}`;

              return (
                <Card key={originalDayIndex} className="bg-background/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">{dayName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dayScheduleTimes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No doses scheduled for {dayName}.</p>
                    ) : (
                      <div className="space-y-2 mb-4">
                        {dayScheduleTimes.map((time, timeIdx) => (
                          <div key={timeIdx} className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-muted/50">
                            <Badge variant="secondary" className="text-base px-3 py-1">{time}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveWrapper(displayedDayIdx, timeIdx)}
                              aria-label={`Remove ${time} for ${dayName}`}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
                      <CustomTimePicker
                        id={timeInputId}
                        value={newTimeInputs[originalDayIndex]}
                        onChange={(newTime) => handleNewTimeInputChange(originalDayIndex, newTime)}
                      />
                      <Button onClick={() => handleAddTimeDose(originalDayIndex)} variant="outline" className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Dose
                      </Button>
                    </div>
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
