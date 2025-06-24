
"use client";

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DayHistory, DoseStatus } from '@/types';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface DayCardProps {
  dayHistory: DayHistory;
}

const getStatusIcon = (status: DoseStatus['status']) => {
  switch (status) {
    case 'taken':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'missed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'pending':
    default:
      return <Clock className="h-5 w-5 text-yellow-500" />;
  }
};

const DayCard: React.FC<DayCardProps> = ({ dayHistory }) => {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="p-3">
        <CardTitle className="text-base font-medium text-center">
          {format(dayHistory.date, 'EEE, MMM d')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2 flex-grow">
        {dayHistory.doses.map((dose, index) => (
          <div key={index} className="flex justify-between items-center text-sm border-t border-border pt-2 first:border-t-0 first:pt-0">
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{dose.slotName}</span>
              <span className="text-muted-foreground">{dose.scheduledTime}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(dose.status)}
              <span className="capitalize font-semibold w-14 text-right">{dose.status}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DayCard;
