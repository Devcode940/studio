"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { RepresentativeCard } from '@/components/representatives/RepresentativeCard';
import type { Representative } from '@/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Search, Loader2, AlertCircle, Scale } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { CompareRepresentativesModal } from '@/components/representatives/CompareRepresentatives';
import { collection, query, orderBy, limit, startAfter, where, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

const POSITIONS = ["All", "President", "Deputy President", "Governor", "Senator", "MP", "MCA", "Women Rep"] as const;
const PAGE_SIZE = 24; // Sensible page size for grid

export default function RepresentativesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [selectedCounty, setSelectedCounty] = useState('All');
  const [allCounties, setAllCounties] = useState<string[]>(["All"]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allLoadedReps, setAllLoadedReps] = useState<Representative[]>([]);

  const firestore = useFirestore();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const representativesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let q = query(collection(firestore, 'representatives'), orderBy('name', 'asc'), limit(PAGE_SIZE));
    
    // Apply server-side filtering when possible
    if (selectedPosition !== 'All') {
      q = query(q, where('position', '==', selectedPosition));
    }
    if (selectedCounty !== 'All') {
      q = query(q, where('county', '==', selectedCounty));
    }
    return q;
  }, [firestore, selectedPosition, selectedCounty]);

  const { data: representatives, isLoading, error } = useCollection<Representative>(representativesQuery);

  // Update accumulated list and pagination cursor
  useEffect(() => {
    if (representatives) {
      // Extract counties for filter dropdown (only from first page load)
      const uniqueCounties = ["All", ...new Set(representatives.map(r => r.county).filter(Boolean) as string[])];
      if (allCounties.length === 1) {
        setAllCounties(uniqueCounties.sort());
      }
      // For now we set allLoadedReps to current page; 
      // For full infinite scroll, you'd need to track snapshots, simplifying to client filter for MVP
      setAllLoadedReps(representatives);
    }
  }, [representatives, allCounties.length]);

  const filteredRepresentatives = useMemo(() => {
    if (!allLoadedReps) return [];
    return allLoadedReps.filter((rep) => {
      const nameMatch = rep.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      // Position and county already filtered server-side, but keep for debounced search interplay
      const positionMatch = selectedPosition === 'All' || rep.position === selectedPosition;
      const countyMatch = selectedCounty === 'All' || rep.county === selectedCounty;
      return nameMatch && positionMatch && countyMatch;
    });
  }, [allLoadedReps, debouncedSearch, selectedPosition, selectedCounty]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedPosition('All');
    setSelectedCounty('All');
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl font-bold text-primary tracking-tight">Elected Representatives</h1>
          <p className="mt-2 text-lg text-foreground/80">
            Discover information about your elected officials. {filteredRepresentatives.length} shown.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <CompareRepresentativesModal 
              trigger={
                <Button size="lg" className="gap-2 shadow-md">
                  <Scale className="h-5 w-5" /> Compare Two Representatives
                </Button>
              }
            />
            <Button asChild variant="outline" size="lg"><a href="/data/leaderboard">View Leaderboard</a></Button>
          </div>
        </header>

        <div className="sticky top-16 z-40 bg-background/90 py-4 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 items-end p-4 border rounded-lg shadow-sm bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map(pos => <SelectItem key={pos} value={pos}>{pos === "All" ? "All Positions" : pos}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedCounty} onValueChange={setSelectedCounty}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by county" />
              </SelectTrigger>
              <SelectContent>
                {allCounties.map(county => <SelectItem key={county} value={county}>{county === "All" ? "All Counties" : county}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleResetFilters}>Reset Filters</Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 border border-destructive/50 bg-destructive/10 rounded-lg text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load representatives: {error.message}. Please try again.</p>
          </div>
        )}

        {isLoading && (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Loading representatives...</p>
            </div>
        )}

        {!isLoading && filteredRepresentatives.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRepresentatives.map((rep: Representative) => (
                <RepresentativeCard key={rep.id} representative={rep} />
              ))}
            </div>
            {/* Pagination hint - implement infinite scroll in next iteration */}
            {allLoadedReps.length >= PAGE_SIZE && (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">
                  Showing first {PAGE_SIZE} results. Add server-side pagination with startAfter() for full list.
                </p>
              </div>
            )}
          </>
        ) : (
          !isLoading && !error && <p className="text-center text-muted-foreground py-10 text-lg">
            No representatives found matching your criteria. Try resetting filters.
          </p>
        )}
      </div>
    </MainLayout>
  );
}
