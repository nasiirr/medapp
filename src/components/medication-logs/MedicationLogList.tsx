"use client";

import React, { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import type { MedicationLog } from '@/types';
import LogItem from './LogItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListChecks } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const MedicationLogList: React.FC = () => {
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const logsRef = ref(database, 'medication_logs');
    // Query to order logs by timestamp. Firebase RTDB sorts numbers in ascending order.
    // We will reverse client-side for descending order.
    const logsQuery = query(logsRef, orderByChild('timestamp'));

    const unsubscribe = onValue(logsQuery, (snapshot) => {
      setIsLoading(true);
      const logsData: MedicationLog[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          logsData.push({ id: childSnapshot.key!, ...childSnapshot.val() });
        });
        // Firebase returns ascending, so we reverse for descending (most recent first)
        setLogs(logsData.reverse());
      } else {
        setLogs([]); // No logs found
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Firebase onValue error for logs:", err);
      setError("Failed to load medication logs. Please try again later.");
      toast({ variant: "destructive", title: "Error", description: "Failed to connect to medication logs." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline font-semibold flex items-center">
            <ListChecks className="mr-2 h-6 w-6 text-primary" />
            Medication Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <p className="text-destructive text-center p-4">{error}</p>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline font-semibold flex items-center">
          <ListChecks className="mr-2 h-6 w-6 text-primary" />
          Medication Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No medication logs available.</p>
        ) : (
          <ScrollArea className="h-[400px] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Device ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <LogItem key={log.id} log={log} />
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationLogList;
