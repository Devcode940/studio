"use client";

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdmin } from '@/hooks/useAdmin';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, deleteDoc } from 'firebase/firestore';
import type { Representative } from '@/types';
import { Loader2, Plus, Trash2, Edit, Search } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function AdminRepsPage() {
  const { isAuthorized } = useAdmin(true);
  const firestore = useFirestore();
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const repsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'representatives'), orderBy('name', 'asc'), limit(50));
  }, [firestore]);

  const { data: reps, isLoading } = useCollection<Representative>(repsQuery);

  const filtered = reps?.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.county.toLowerCase().includes(search.toLowerCase())) || [];

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone. Use with caution.`)) return;
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'representatives', id));
      toast({ title: 'Deleted', description: `${name} removed` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: err.message });
    }
  };

  if (!isAuthorized) return null;

  return (
    <MainLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Manage Representatives</h1>
            <p className="text-muted-foreground">MCA-first strategy – own the ward level (1450 wards)</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/dashboard/admin">Back</Link></Button>
            <Button asChild><Link href="/dashboard/admin/representatives/new"><Plus className="h-4 w-4 mr-2" /> Add Rep</Link></Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Representatives ({filtered.length})</CardTitle>
            <CardDescription>Search by name or county – admin CRUD with audit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name or county..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-10" />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <div className="grid gap-3">
                {filtered.map(rep => (
                  <div key={rep.id} className="border rounded-lg p-4 flex items-center justify-between hover:shadow-sm">
                    <div className="flex items-center gap-4">
                      <img src={rep.photoUrl} alt={rep.name} className="w-12 h-12 rounded-full object-cover" />
                      <div>
                        <div className="font-semibold">{rep.name} <span className="text-xs text-muted-foreground ml-2">{rep.position}</span></div>
                        <div className="text-xs text-muted-foreground">{rep.county} • {rep.constituencyOrWard} • {rep.party}</div>
                        <div className="text-xs"><Link href={`/representatives/${rep.slug}`} className="text-primary hover:underline">View public profile</Link></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild><Link href={`/dashboard/admin/representatives/${rep.id}/edit`}><Edit className="h-4 w-4" /></Link></Button>
                      <Button variant="destructive" size="sm" onClick={()=>handleDelete(rep.id, rep.name)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && <p className="text-center text-muted-foreground py-10">No reps found. Seed via script or CSV.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">How to Seed Real Data (MCA-first Moat)</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <p>1. Download IEBC 2022 MCA results Excel → convert to CSV with headers: name,slug,county,constituency,ward,party,position</p>
            <p>2. Sample in <code>src/lib/mzalendo.ts SAMPLE_MCA_CSV</code></p>
            <p>3. Use script: <code>scripts/seed-firestore.ts</code> (create) batch writes with audit</p>
            <p>4. Photos: Upload to Firebase Storage <code>representatives/{'{slug}'}.webp</code> 400x400 WebP, update photoUrl</p>
            <p>5. Recompute leaderboard after seeding</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
