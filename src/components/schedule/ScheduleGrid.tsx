"use client";

import type React from 'react';
import type { WeekSchedule } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill, Clock } from 'lucide-react';

interface ScheduleGridProps {
  schedule: WeekSchedule;
  onToggleSlot: (dayIndex: number, hourIndex: number) => void;
  onSave: () => void;
  isLoading: boolean;
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ schedule, onToggleSlot, onSave, isLoading }) => {
  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12; // Convert 0 to 12 for 12 AM, and 12 to 12 for 12 PM
    return `${h}${ampm}`;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-headline font-semibold flex items-center">
          <Clock className="mr-2 h-6 w-6 text-primary" />
          Medication Schedule
        </CardTitle>
        <Button onClick={onSave} disabled={isLoading} variant="default">
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
              {daysOfWeek.map((day, dayIndex) => (
                <tr key={day} className="transition-colors hover:bg-muted/30">
                  <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-foreground">{day}</td>
                  {schedule[dayIndex]?.map((isScheduled, hourIndex) => (
                    <td key={hourIndex} className="whitespace-nowrap px-2 py-2 text-sm text-center">
                      <Button
                        variant={isScheduled ? "default" : "outline"}
                        size="icon"
                        className={`h-8 w-8 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110 ${
                          isScheduled ? 'bg-primary hover:bg-primary/90' : 'border-primary/50 text-primary hover:bg-primary/10'
                        }`}
                        onClick={() => onToggleSlot(dayIndex, hourIndex)}
                        aria-label={`Toggle schedule for ${day} at ${formatHour(hourIndex)}`}
                      >
                        {isScheduled ? <Pill className="h-4 w-4 text-primary-foreground" /> : <Pill className="h-4 w-4 text-primary/70" />}
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading && <p className="text-sm text-muted-foreground mt-4">Updating schedule...</p>}
      </CardContent>
    </Card>
  );
};

export default ScheduleGrid;
