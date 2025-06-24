import HistoryPageClient from './page-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pill, Home } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Pill className="h-8 w-8" />
            <h1 className="text-2xl font-headline font-bold">MediTrack</h1>
          </Link>
          <nav>
            <Link href="/" legacyBehavior passHref>
              <Button variant="ghost">
                <Home className="mr-2" />
                Dashboard
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HistoryPageClient />
      </main>
      <footer className="bg-muted text-muted-foreground py-4 text-center text-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} MediTrack. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
