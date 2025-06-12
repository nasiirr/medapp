
"use client";

import type React from 'react';
import type { MedicationLog } from '@/types';
import { TableRow, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { CalendarDays, Smartphone, CheckCircle } from 'lucide-react';

interface LogItemProps {
  log: MedicationLog;
}

const LogItem: React.FC<LogItemProps> = ({ log }) => {
  let formattedTimestamp = "Invalid Date";
  if (typeof log.timestamp === 'number' && !isNaN(log.timestamp)) {
    const date = new Date(log.timestamp);
    if (!isNaN(date.getTime())) {
      formattedTimestamp = format(date, 'MMM d, yyyy HH:mm:ss');
    }
  }

  return (
    <TableRow className="transition-colors hover:bg-muted/30">
      <TableCell>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-accent" />
          <span className="font-medium">Dispensed</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <span>{log.readable_time} ({formattedTimestamp})</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-muted-foreground" />
          <span>{log.device_id}</span>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default LogItem;
