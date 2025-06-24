
"use client";

import type React from 'react';
import type { MedicationLog } from '@/types';
import { TableRow, TableCell } from '@/components/ui/table';
import { CalendarDays, Smartphone, CheckCircle, XCircle } from 'lucide-react';

interface LogItemProps {
  log: MedicationLog;
}

const LogItem: React.FC<LogItemProps> = ({ log }) => {
  const isTaken = log.action === 'medication_confirmed';
  const statusText = isTaken ? 'Medication Taken' : 'Medication Missed';
  const StatusIcon = isTaken ? CheckCircle : XCircle;
  const iconColor = isTaken ? 'text-accent' : 'text-destructive';

  return (
    <TableRow className="transition-colors hover:bg-muted/30">
      <TableCell>
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${iconColor}`} />
          <span className="font-medium">{statusText}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <span>{log.formatted_time}</span>
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
