
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from 'lucide-react';

interface CustomTimePickerProps {
  value: string; // Expected format "HH:MM" or empty/invalid
  onChange: (newTime: string) => void;
  id?: string;
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({ value, onChange, id }) => {
  const [hour, setHour] = useState<number>(0);
  const [minute, setMinute] = useState<number>(0);

  useEffect(() => {
    if (value && /^\d{2}:\d{2}$/.test(value)) {
      const [h, m] = value.split(':').map(Number);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        setHour(h);
        setMinute(m);
        return;
      }
    }
    // Default to 00:00 if value is invalid or empty
    setHour(0);
    setMinute(0);
    // If initial value was empty/invalid, and we default, we should inform parent of this default if it differs
    // However, the parent sets the initial newTimeInputs to '', so this initial "00:00" will be the first valid time.
    // onChange will be triggered by user actions.
  }, [value]);

  const triggerChange = useCallback((currentHour: number, currentMinute: number) => {
    const newFormattedTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    onChange(newFormattedTime);
  }, [onChange]);

  const incrementHour = useCallback(() => {
    const newHour = (hour + 1) % 24;
    setHour(newHour);
    triggerChange(newHour, minute);
  }, [hour, minute, triggerChange]);

  const decrementHour = useCallback(() => {
    const newHour = (hour - 1 + 24) % 24;
    setHour(newHour);
    triggerChange(newHour, minute);
  }, [hour, minute, triggerChange]);

  const incrementMinute = useCallback(() => {
    let newMinute = minute + 1;
    let newHour = hour;
    if (newMinute > 59) {
      newMinute = 0;
      newHour = (hour + 1) % 24;
      setHour(newHour);
    }
    setMinute(newMinute);
    triggerChange(newHour, newMinute);
  }, [hour, minute, triggerChange]);

  const decrementMinute = useCallback(() => {
    let newMinute = minute - 1;
    let newHour = hour;
    if (newMinute < 0) {
      newMinute = 59;
      newHour = (hour - 1 + 24) % 24;
      setHour(newHour);
    }
    setMinute(newMinute);
    triggerChange(newHour, newMinute);
  }, [hour, minute, triggerChange]);

  const formattedHour = String(hour).padStart(2, '0');
  const formattedMinute = String(minute).padStart(2, '0');

  return (
    <div id={id} className="flex items-center justify-center space-x-1 p-1 border border-input bg-background rounded-md shadow-sm" role="timer" aria-roledescription="time picker">
      {/* Hour Picker */}
      <div className="flex flex-col items-center">
        <Button variant="ghost" size="sm" onClick={incrementHour} aria-label="Increase hour" className="h-7 w-7 p-0">
          <ChevronUp className="h-5 w-5" />
        </Button>
        <span 
          className="text-3xl font-mono tabular-nums h-10 flex items-center justify-center w-12 bg-muted rounded text-center text-foreground" 
          aria-live="polite"
          aria-label={`Hour is ${hour}`}
        >
          {formattedHour}
        </span>
        <Button variant="ghost" size="sm" onClick={decrementHour} aria-label="Decrease hour" className="h-7 w-7 p-0">
          <ChevronDown className="h-5 w-5" />
        </Button>
      </div>

      <span className="text-2xl font-semibold text-muted-foreground self-center mx-1">:</span>

      {/* Minute Picker */}
      <div className="flex flex-col items-center">
        <Button variant="ghost" size="sm" onClick={incrementMinute} aria-label="Increase minute" className="h-7 w-7 p-0">
          <ChevronUp className="h-5 w-5" />
        </Button>
        <span 
          className="text-3xl font-mono tabular-nums h-10 flex items-center justify-center w-12 bg-muted rounded text-center text-foreground" 
          aria-live="polite"
          aria-label={`Minute is ${minute}`}
        >
          {formattedMinute}
        </span>
        <Button variant="ghost" size="sm" onClick={decrementMinute} aria-label="Decrease minute" className="h-7 w-7 p-0">
          <ChevronDown className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default CustomTimePicker;
