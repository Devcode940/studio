
"use client";

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ColumnDefinition<T> {
  accessorKey: keyof T | string; // Allow string for custom accessors or nested paths
  header: string | ((props: { column: ColumnDefinition<T> }) => React.ReactNode);
  cell?: (props: { row: T, value: any }) => React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean; // For column-specific filtering if needed
  meta?: any; // For additional column metadata
}

interface DataTableProps<T> {
  columns: ColumnDefinition<T>[];
  data: T[];
  searchableColumn?: keyof T | string; // Primary column to search on
  searchPlaceholder?: string;
  initialSortColumn?: keyof T | string;
  initialSortDirection?: 'asc' | 'desc';
  filterOptions?: {
    label: string;
    column: keyof T | string;
    options: { value: string; label: string }[];
  }[];
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchableColumn,
  searchPlaceholder = "Search...",
  initialSortColumn,
  initialSortDirection = 'asc',
  filterOptions = [],
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string | null; direction: 'asc' | 'desc' }>(
    { key: initialSortColumn || null, direction: initialSortDirection }
  );
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});


  const getNestedValue = (obj: T, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const sortedAndFilteredData = useMemo(() => {
    let filteredData = [...data];

    if (searchTerm && searchableColumn) {
      filteredData = filteredData.filter((item) => {
        const value = typeof searchableColumn === 'string' ? getNestedValue(item, searchableColumn) : item[searchableColumn];
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    filterOptions.forEach(filter => {
      const filterValue = activeFilters[filter.column as string];
      if (filterValue && filterValue !== 'all') {
        filteredData = filteredData.filter(item => {
            const itemValue = typeof filter.column === 'string' ? getNestedValue(item, filter.column as string) : item[filter.column];
            return String(itemValue).toLowerCase() === filterValue.toLowerCase();
        });
      }
    });
    

    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        const valA = typeof sortConfig.key === 'string' ? getNestedValue(a, sortConfig.key) : a[sortConfig.key];
        const valB = typeof sortConfig.key === 'string' ? getNestedValue(b, sortConfig.key) : b[sortConfig.key];
        
        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [data, searchTerm, searchableColumn, sortConfig, filterOptions, activeFilters]);

  const requestSort = (key: keyof T | string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (column: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [column]: value }));
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center p-4 border rounded-lg shadow-sm bg-card">
        {searchableColumn && (
          <div className="relative w-full md:flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-10"
            />
          </div>
        )}
        {filterOptions.map(filter => (
          <div key={filter.label} className="w-full md:w-auto">
             <Select
              value={activeFilters[filter.column as string] || 'all'}
              onValueChange={(value) => handleFilterChange(filter.column as string, value)}
            >
              <SelectTrigger className="w-full md:min-w-[180px]">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label.toLowerCase()}</SelectItem>
                {filter.options.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.accessorKey)} className="whitespace-nowrap">
                  {column.enableSorting ? (
                    <Button
                      variant="ghost"
                      onClick={() => requestSort(column.accessorKey)}
                      className="px-2 py-1 -ml-2 hover:bg-muted"
                    >
                      {typeof column.header === 'function' ? column.header({column}) : column.header}
                      <ArrowUpDown className={`ml-2 h-4 w-4 ${sortConfig.key === column.accessorKey ? 'text-primary' : 'text-muted-foreground/50'}`} />
                    </Button>
                  ) : (
                    typeof column.header === 'function' ? column.header({column}) : column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredData.length > 0 ? (
              sortedAndFilteredData.map((row, rowIndex) => (
                <TableRow key={rowIndex} data-state={rowIndex % 2 === 0 ? "" : "selected" /* alternating row color hint */}>
                  {columns.map((column) => {
                    const value = typeof column.accessorKey === 'string' ? getNestedValue(row, column.accessorKey) : row[column.accessorKey];
                    return (
                      <TableCell key={String(column.accessorKey)} className="py-3 px-4">
                        {column.cell ? column.cell({ row, value }) : String(value ?? '')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
