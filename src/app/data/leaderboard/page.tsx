
"use client";

import { mockLeaderboardData } from '@/data/mock';
import type { RankedRepresentative } from '@/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { DataTable, type ColumnDefinition } from '@/components/shared/DataTable';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

const columns: ColumnDefinition<RankedRepresentative>[] = [
  {
    accessorKey: 'rank',
    header: 'Rank',
    enableSorting: true,
    cell: ({ value }) => {
      let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
      let icon = null;
      if (value === 1) { badgeVariant = "default"; icon = <Crown className="h-4 w-4 text-yellow-400" />;}
      else if (value === 2) badgeVariant = "secondary";
      else if (value === 3) badgeVariant = "destructive"; // Using destructive for bronze color effect

      return (
        <div className="flex items-center font-semibold">
           {icon && <span className="mr-1.5">{icon}</span>}
          <Badge variant={badgeVariant} className="text-xs px-2 py-0.5">{value}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Image
          src={row.photoUrl}
          alt={row.name}
          width={40}
          height={40}
          className="rounded-full object-cover"
          data-ai-hint="politician avatar"
        />
        <Link href={`/representatives/${row.slug}`} className="font-medium hover:text-primary hover:underline">
          {row.name}
        </Link>
      </div>
    ),
  },
  { accessorKey: 'position', header: 'Position', enableSorting: true },
  { accessorKey: 'county', header: 'County', enableSorting: true },
  { accessorKey: 'party', header: 'Party', enableSorting: true },
  {
    accessorKey: 'overallScore',
    header: 'Overall Score',
    enableSorting: true,
    cell: ({ value }) => <span className="font-semibold text-primary">{value}</span>,
  },
  { accessorKey: 'performanceScore', header: 'Performance', enableSorting: true },
  { accessorKey: 'integrityScore', header: 'Integrity', enableSorting: true },
];

export default function LeaderboardPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl font-bold text-primary tracking-tight">Representative Leaderboard</h1>
          <p className="mt-2 text-lg text-foreground/80">
            Ranking representatives based on various performance and integrity metrics.
          </p>
        </header>
        <DataTable
          columns={columns}
          data={mockLeaderboardData}
          searchableColumn="name"
          searchPlaceholder="Search by name..."
          initialSortColumn="rank"
          initialSortDirection="asc"
          filterOptions={[
            {
              label: "Position",
              column: "position",
              options: [...new Set(mockLeaderboardData.map(item => item.position))].map(pos => ({value: pos, label: pos}))
            },
            {
              label: "County",
              column: "county",
              options: [...new Set(mockLeaderboardData.map(item => item.county))].map(county => ({value: county, label: county}))
            }
          ]}
        />
      </div>
    </MainLayout>
  );
}
