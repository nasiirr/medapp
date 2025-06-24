"use client";

import React from 'react';
import HistoryView from '@/components/history/HistoryView';
import PageTitle from '@/components/shared/PageTitle';
import { CalendarClock } from 'lucide-react';

export default function HistoryPageClient() {
  return (
    <div className="space-y-8">
      <PageTitle title="Medication History" icon={<CalendarClock className="h-8 w-8 text-primary" />} />
      <HistoryView />
    </div>
  );
}
