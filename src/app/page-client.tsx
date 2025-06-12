"use client";

import React from 'react';
import ScheduleManager from '@/components/schedule/ScheduleManager';
import MedicationLogList from '@/components/medication-logs/MedicationLogList';
import PageTitle from '@/components/shared/PageTitle';
import { Separator } from '@/components/ui/separator';
import { LayoutDashboard } from 'lucide-react';


export default function PageClient() {
  return (
    <div className="space-y-8">
      <PageTitle title="Dashboard" icon={<LayoutDashboard className="h-8 w-8 text-primary" />} />
      
      <div>
        <ScheduleManager />
      </div>

      <Separator className="my-8" />

      <div>
        <MedicationLogList />
      </div>
    </div>
  );
}
