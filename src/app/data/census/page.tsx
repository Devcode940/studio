
"use client";

import type { CensusData } from '@/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { DataTable, type ColumnDefinition } from '@/components/shared/DataTable';
import { Users, Loader2 } from 'lucide-react';
import { useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useMemo } from 'react';

const columns: ColumnDefinition<CensusData>[] = [
  {
    accessorKey: 'county',
    header: 'County',
    enableSorting: true,
    cell: ({ value }) => <span className="font-medium">{value}</span>,
  },
  {
    accessorKey: 'totalPopulation',
    header: 'Total Population',
    enableSorting: true,
    cell: ({ value }) => value.toLocaleString(),
  },
  {
    accessorKey: 'malePopulation',
    header: 'Male Population',
    enableSorting: true,
    cell: ({ value }) => value.toLocaleString(),
  },
  {
    accessorKey: 'femalePopulation',
    header: 'Female Population',
    enableSorting: true,
    cell: ({ value }) => value.toLocaleString(),
  },
  {
    accessorKey: 'householdCount',
    header: 'Households',
    enableSorting: true,
    cell: ({ value }) => value.toLocaleString(),
  },
  {
    accessorKey: 'averageHouseholdSize',
    header: 'Avg. Household Size',
    enableSorting: true,
  },
  {
    accessorKey: 'populationDensity',
    header: 'Density (per km²)',
    enableSorting: true,
    cell: ({ value }) => value.toLocaleString(),
  },
  {
    accessorKey: 'year',
    header: 'Year',
    enableSorting: true,
  },
];

export default function CensusDataPage() {
    const firestore = useFirestore();

    const censusQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'census_data'), orderBy('totalPopulation', 'desc'));
    }, [firestore]);

    const { data: censusData, isLoading } = useCollection<CensusData>(censusQuery);

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl font-bold text-primary tracking-tight flex items-center justify-center">
            <Users className="mr-3 h-10 w-10" /> Kenyan Census Data
          </h1>
          <p className="mt-2 text-lg text-foreground/80">
            Demographic information from the latest national census.
          </p>
        </header>
        
        {isLoading ? (
             <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Loading census data...</p>
            </div>
        ) : (
            <DataTable
            columns={columns}
            data={censusData || []}
            searchableColumn="county"
            searchPlaceholder="Search by county name..."
            initialSortColumn="totalPopulation"
            initialSortDirection="desc"
            />
        )}
      </div>
    </MainLayout>
  );
}
