
"use client";

import { mockCountyGDP } from '@/data/mock';
import type { CountyGDP } from '@/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { DataTable, type ColumnDefinition } from '@/components/shared/DataTable';
import { TrendingUp } from 'lucide-react';

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
  // Example for a more complex cell if sectorBreakdown was available
  // {
  //   accessorKey: 'sectorBreakdown',
  //   header: 'Top Sector',
  //   cell: ({ value }) => value && value.length > 0 ? `${value[0].sector} (${value[0].percentage}%)` : 'N/A',
  // },
];

export default function CountyGDPPage() {
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
        <DataTable
          columns={columns}
          data={mockCountyGDP}
          searchableColumn="county"
          searchPlaceholder="Search by county name..."
          initialSortColumn="gdpMillionsKsh"
          initialSortDirection="desc"
        />
      </div>
    </MainLayout>
  );
}
