"use client";

import React, { useState, useEffect } from 'react';
import type { WeekSchedule, DoseTime } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import NewTimePicker from './NewTimePicker';
import { Clock, Save, Edit3, XCircle, CheckCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';

interface ScheduleEditorProps {
  schedule: WeekSchedule | null;
  onEditDoseTime: (dayIndex: number, doseSlotIndex: number, newTime: DoseTime) => void;
  onSave: () => void;
  isSaving: boolean;
  isScheduleLoading: boolean;
}

const baseDaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const doseSlotLabels = ["Morning Dose", "Afternoon Dose", "Night Dose", "Optional/Emergency Dose"];

// Helper to format "HH:mm" to "hh:mm a"
const formatTimeForDisplay = (timeStr: DoseTime): string => {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return "Not Set";
  try {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, 'p'); // 'p' is short for hh:mm a
  } catch (error) {
    console.error("Error formatting time:", timeStr, error);
    return "Invalid";
  }
};


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

  const [editingSlotKey, setEditingSlotKey] = useState<string | null>(null); // "dayIndex-doseSlotIndex"
  const [currentEditValue, setCurrentEditValue] = useState<DoseTime>("00:00");

  useEffect(() => {
    const todaySystemIndex = new Date().getDay();
    setCurrentDayOriginalIndex(todaySystemIndex);

    const newOrderedDays = [...baseDaysOfWeek.slice(todaySystemIndex), ...baseDaysOfWeek.slice(0, todaySystemIndex)];
    setOrderedDisplayDays(newOrderedDays);

    if (schedule) {
      const newOrderedScheduleData: WeekSchedule = [];
      for (let i = 0; i < 7; i++) {
        const daySchedule = schedule[(todaySystemIndex + i) % 7];
        newOrderedScheduleData.push(
          Array.isArray(daySchedule) && daySchedule.length === 4
            ? daySchedule
            : ["00:00", "00:00", "00:00", "00:00"]
        );
      }
      setOrderedDisplaySchedule(newOrderedScheduleData);
    } else {
      setOrderedDisplaySchedule(null);
    }
  }, [schedule]);

  const handleStartEdit = (originalDayIdx: number, doseSlotIdx: number, currentTime: DoseTime) => {
    setEditingSlotKey(`${originalDayIdx}-${doseSlotIdx}`);
    setCurrentEditValue(currentTime);
  };

  const handleCancelEdit = () => {
    setEditingSlotKey(null);
  };

  const handleSaveEdit = () => {
    if (editingSlotKey) {
      const [dayStr, slotStr] = editingSlotKey.split('-');
      const dayIndex = parseInt(dayStr, 10);
      const doseSlotIndex = parseInt(slotStr, 10);
      onEditDoseTime(dayIndex, doseSlotIndex, currentEditValue);
      setEditingSlotKey(null);
    }
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {Array(4).fill(0).map((__, j) => <Skeleton key={j} className="h-20 w-full" />)}
              </div>
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
          <CardDescription>Set precise times for your four daily medication slots. Click a time to edit. Times are auto-sorted after editing.</CardDescription>
        </div>
        <Button onClick={onSave} disabled={isSaving || !schedule || !!editingSlotKey} size="lg">
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
                      const slotKey = `${originalDayIndex}-${doseSlotIndex}`;
                      const isEditingThisSlot = editingSlotKey === slotKey;
                      const labelText = doseSlotLabels[doseSlotIndex] || `Dose ${doseSlotIndex + 1}`;

                      return (
                        <div key={doseSlotIndex} className="flex flex-col items-start gap-2 p-3 border rounded-md bg-card/80 shadow">
                          <label className="text-sm font-medium text-muted-foreground ml-1">{labelText}</label>
                          {isEditingThisSlot ? (
                            <div className="w-full flex flex-col gap-2 flex-grow justify-center">
                              <NewTimePicker
                                id={`time-picker-${slotKey}`}
                                value={currentEditValue}
                                onChange={setCurrentEditValue}
                              />
                              <div className="flex gap-2 mt-2 self-stretch">
                                <Button onClick={handleSaveEdit} size="sm" variant="default" className="flex-1 bg-green-500 hover:bg-green-600">
                                  <CheckCircle className="mr-1 h-4 w-4" /> Save
                                </Button>
                                <Button onClick={handleCancelEdit} size="sm" variant="outline" className="flex-1">
                                  <XCircle className="mr-1 h-4 w-4" /> Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(originalDayIndex, doseSlotIndex, time)}
                              className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer flex-grow min-h-[40px]"
                              aria-label={`Edit ${labelText} currently set to ${formatTimeForDisplay(time)}`}
                            >
                              <span className="text-2xl font-semibold text-foreground">{formatTimeForDisplay(time)}</span>
                              <Edit3 className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                            </button>
                          )}
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
