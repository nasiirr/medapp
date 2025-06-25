"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewTimePickerProps {
  value: string; // Expected format "HH:mm"
  onChange: (newTime: string) => void;
  id?: string;
}

const hourOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

const NewTimePicker: React.FC<NewTimePickerProps> = ({ value, onChange, id }) => {
  const [hour, setHour] = useState<string>('12');
  const [minute, setMinute] = useState<string>('00');
  const [period, setPeriod] = useState<string>('am');

  useEffect(() => {
    if (value && /^\d{2}:\d{2}$/.test(value)) {
      const [h24, m] = value.split(':').map(Number);
      const newPeriod = h24 >= 12 ? 'pm' : 'am';
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;

      setHour(h12.toString());
      setMinute(m.toString().padStart(2, '0'));
      setPeriod(newPeriod);
    }
  }, [value]);

  const handleTimeChange = useCallback((newHour: string, newMinute: string, newPeriod: string) => {
    let h24 = parseInt(newHour, 10);
    
    if (newPeriod === 'am' && h24 === 12) { // 12am is 00 hours
      h24 = 0;
    } else if (newPeriod === 'pm' && h24 !== 12) { // pm hours (except 12pm) add 12
      h24 += 12;
    }

    const formattedTime = `${h24.toString().padStart(2, '0')}:${newMinute}`;
    onChange(formattedTime);
  }, [onChange]);

  const onHourChange = (newHour: string) => {
    setHour(newHour);
    handleTimeChange(newHour, minute, period);
  };

  const onMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    handleTimeChange(hour, newMinute, period);
  };

  const onPeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    handleTimeChange(hour, minute, newPeriod);
  };

  return (
    <div id={id} className="flex items-center justify-center space-x-1 w-full">
        <Select value={hour} onValueChange={onHourChange}>
            <SelectTrigger className="flex-1">
                <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent>
            {hourOptions.map(h => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
            </SelectContent>
        </Select>

        <Select value={minute} onValueChange={onMinuteChange}>
            <SelectTrigger className="flex-1">
                <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
            {minuteOptions.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
            </SelectContent>
        </Select>

        <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="flex-1">
                <SelectValue placeholder="AM/PM" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="am">AM</SelectItem>
                <SelectItem value="pm">PM</SelectItem>
            </SelectContent>
        </Select>
    </div>
  );
};

export default NewTimePicker;
