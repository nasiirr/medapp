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

  // Defensive check for formatted_time to prevent errors if it's missing
  const timeParts = log.formatted_time?.split(' ') || [];
  const datePart = timeParts[0] || '';
  const timePart = timeParts.length > 1 ? timeParts.slice(1).join(' ') : '';


  return (
    <TableRow className="transition-colors hover:bg-muted/30">
      <TableCell>
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${iconColor}`} />
          <span className="font-medium whitespace-nowrap">{statusText}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-mono text-sm">{datePart}</span>
            <span className="font-mono text-xs text-muted-foreground">{timePart}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-xs break-all">{log.device_id}</span>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default LogItem;
