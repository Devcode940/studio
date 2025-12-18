
'use client';

import Image from 'next/image';
import type { Representative } from '@/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrityReportGenerator } from '@/components/representatives/IntegrityReportGenerator';
import { PerformanceMetricsDisplay } from '@/components/representatives/PerformanceMetricsDisplay';
import { HighlightsDisplay } from '@/components/representatives/HighlightsDisplay';
import { Mail, Phone, MapPin, Building, Users, Twitter, Facebook, ArrowLeft, Info, Activity, ShieldCheck, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useEffect, useMemo } from 'react';

interface RepresentativeProfilePageProps {
  params: { slug: string };
}

export default function RepresentativeProfilePage({ params }: RepresentativeProfilePageProps) {
  const firestore = useFirestore();

  const representativeQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'representatives'), where('slug', '==', params.slug), limit(1));
  }, [firestore, params.slug]);

  const { data: representativeData, isLoading: isLoadingRep } = useCollection<Representative>(representativeQuery);
  const representative = representativeData?.[0];

  const highlightsQuery = useMemo(() => {
    if (!firestore || !representative?.id) return null;
    return collection(firestore, 'representatives', representative.id, 'highlights');
  }, [firestore, representative?.id]);
  const { data: highlights, isLoading: isLoadingHighlights } = useCollection(highlightsQuery);

  const performanceMetricsQuery = useMemo(() => {
    if (!firestore || !representative?.id) return null;
    return collection(firestore, 'representatives', representative.id, 'performance_metrics');
  }, [firestore, representative?.id]);
  const { data: performanceMetrics, isLoading: isLoadingMetrics } = useCollection(performanceMetricsQuery);


  if (isLoadingRep) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg font-medium">Loading representative...</p>
        </div>
      </MainLayout>
    );
  }
  
  if (!representative) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <h1 className="font-headline text-3xl font-bold text-destructive">Representative Not Found</h1>
          <p className="mt-4 text-lg text-muted-foreground">The profile you are looking for does not exist.</p>
          <Button asChild className="mt-8">
            <Link href="/representatives">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Representatives
            </Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <Button asChild variant="outline" className="mb-6">
          <Link href="/representatives">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Representatives
          </Link>
        </Button>

        {/* Header Section */}
        <Card className="overflow-hidden shadow-xl">
          <div className="md:flex">
            <div className="md:w-1/3 relative">
              <Image
                src={representative.photoUrl}
                alt={representative.name}
                width={400}
                height={400}
                className="object-cover w-full h-full aspect-square md:aspect-auto"
                priority
                data-ai-hint="politician official photo"
              />
            </div>
            <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-center">
              <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">{representative.name}</h1>
              <p className="text-xl text-muted-foreground mt-1">{representative.position}</p>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <InfoItem icon={MapPin} label="Area" value={`${representative.constituencyOrWard}, ${representative.county} County`} />
                <InfoItem icon={Building} label="Party" value={representative.party} />
                {representative.contactInfo.email && <InfoItem icon={Mail} label="Email" value={representative.contactInfo.email} isLink={`mailto:${representative.contactInfo.email}`} />}
                {representative.contactInfo.phone && <InfoItem icon={Phone} label="Phone" value={representative.contactInfo.phone} isLink={`tel:${representative.contactInfo.phone}`} />}
                {representative.contactInfo.officeAddress && <InfoItem icon={Users} label="Office" value={representative.contactInfo.officeAddress} />}
                {representative.votesGarnered && <InfoItem icon={Users} label="Votes Garnered" value={representative.votesGarnered.toLocaleString()} />}
              </div>
              <div className="mt-4 flex space-x-3">
                {representative.contactInfo.twitter && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`https://twitter.com/${representative.contactInfo.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer">
                      <Twitter className="mr-2 h-4 w-4" /> Twitter
                    </a>
                  </Button>
                )}
                {representative.contactInfo.facebook && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={representative.contactInfo.facebook} target="_blank" rel="noopener noreferrer">
                      <Facebook className="mr-2 h-4 w-4" /> Facebook
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview"><Info className="mr-2 h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="performance"><Activity className="mr-2 h-4 w-4" />Performance</TabsTrigger>
            <TabsTrigger value="integrity"><ShieldCheck className="mr-2 h-4 w-4" />Integrity</TabsTrigger>
            <TabsTrigger value="highlights"><Star className="mr-2 h-4 w-4" />Highlights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Overview</CardTitle>
                <CardDescription>General information and participation summary.</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                {representative.participationRecordSummary ? (
                  <p>{representative.participationRecordSummary}</p>
                ) : (
                  <p className="text-muted-foreground">No participation summary available.</p>
                )}
                {/* More overview details can be added here */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <PerformanceMetricsDisplay metrics={performanceMetrics ?? []} isLoading={isLoadingMetrics} />
          </TabsContent>

          <TabsContent value="integrity" className="mt-6">
            <IntegrityReportGenerator representative={representative} />
          </TabsContent>

          <TabsContent value="highlights" className="mt-6">
            <HighlightsDisplay highlights={highlights ?? []} isLoading={isLoadingHighlights} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function InfoItem({ icon: Icon, label, value, isLink }: { icon: React.ElementType, label: string, value: string | number, isLink?: string }) {
  return (
    <div className="flex items-start">
      <Icon className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
      <div>
        <span className="font-medium text-foreground/80">{label}: </span>
        {isLink ? (
          <a href={isLink} className="text-primary hover:underline" target={isLink.startsWith('http') ? '_blank' : undefined} rel={isLink.startsWith('http') ? 'noopener noreferrer' : undefined}>{value}</a>
        ) : (
          <span className="text-foreground">{value}</span>
        )}
      </div>
    </div>
  );
}
