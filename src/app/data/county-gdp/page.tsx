
"use client";

import type { CountyGDP } from '@/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { DataTable, type ColumnDefinition } from '@/components/shared/DataTable';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

const columns: ColumnDefinition<CountyGDP>[] = [
  {
    accessorKey: 'county',
    header: 'County',
    enableSorting: true,
    cell: ({ value }) => <span className="font-medium">{value}</span>,
  },
  {
    accessorKey: 'gdpMillionsKsh',
    header: 'GDP (Millions KSh)',
    enableSorting: true,
    cell: ({ value }) => value.toLocaleString(),
  },
  {
    accessorKey: 'gdpPerCapitaKsh',
    header: 'GDP per Capita (KSh)',
    enableSorting: true,
    cell: ({ value }) => value ? value.toLocaleString() : 'N/A',
  },
  {
    accessorKey: 'year',
    header: 'Year',
    enableSorting: true,
  },
];

export default function CountyGDPPage() {
  const firestore = useFirestore();

  const gdpQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'county_gdp'), orderBy('gdpMillionsKsh', 'desc'));
  }, [firestore]);

  const { data: countyGDPData, isLoading } = useCollection<CountyGDP>(gdpQuery);

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl font-bold text-primary tracking-tight flex items-center justify-center">
            <TrendingUp className="mr-3 h-10 w-10" /> County GDP Data
          </h1>
          <p className="mt-2 text-lg text-foreground/80">
            Economic performance indicators for counties across Kenya.
          </p>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Loading GDP data...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={countyGDPData || []}
            searchableColumn="county"
            searchPlaceholder="Search by county name..."
            initialSortColumn="gdpMillionsKsh"
            initialSortDirection="desc"
          />
        )}
      </div>
    </MainLayout>
  );
}
