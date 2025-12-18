
"use client";

import { useState, useMemo, useEffect } from 'react';
import { RepresentativeCard } from '@/components/representatives/RepresentativeCard';
import type { Representative } from '@/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from 'lucide-react';
import { useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const positions = ["All", "President", "Deputy President", "Governor", "Senator", "MP", "MCA", "Women Rep"];

export default function RepresentativesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [selectedCounty, setSelectedCounty] = useState('All');
  const [allCounties, setAllCounties] = useState<string[]>(["All"]);

  const firestore = useFirestore();

  const representativesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'representatives'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: representatives, isLoading } = useCollection<Representative>(representativesQuery);

  useEffect(() => {
    if (representatives) {
      const uniqueCounties = ["All", ...new Set(representatives.map(r => r.county).filter(Boolean))];
      setAllCounties(uniqueCounties.sort());
    }
  }, [representatives]);
  
  const filteredRepresentatives = useMemo(() => {
    if (!representatives) return [];
    return representatives.filter((rep) => {
      const nameMatch = rep.name.toLowerCase().includes(searchTerm.toLowerCase());
      const positionMatch = selectedPosition === 'All' || rep.position === selectedPosition;
      const countyMatch = selectedCounty === 'All' || rep.county === selectedCounty;
      return nameMatch && positionMatch && countyMatch;
    });
  }, [representatives, searchTerm, selectedPosition, selectedCounty]);

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-4xl font-bold text-primary tracking-tight">Elected Representatives</h1>
          <p className="mt-2 text-lg text-foreground/80">
            Discover information about your elected officials.
          </p>
        </header>

        <div className="sticky top-16 z-40 bg-background/90 py-4 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-end p-4 border rounded-lg shadow-sm bg-card">
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
                {positions.map(pos => <SelectItem key={pos} value={pos}>{pos === "All" ? "All Positions" : pos}</SelectItem>)}
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
          </div>
        </div>

        {isLoading && (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Loading representatives...</p>
            </div>
        )}

        {!isLoading && filteredRepresentatives.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRepresentatives.map((rep: Representative) => (
              <RepresentativeCard key={rep.id} representative={rep} />
            ))}
          </div>
        ) : (
          !isLoading && <p className="text-center text-muted-foreground py-10 text-lg">
            No representatives found matching your criteria.
          </p>
        )}
      </div>
    </MainLayout>
  );
}
