
import type { Representative } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MapPin, Building, Mail, Phone, Twitter } from 'lucide-react';

interface RepresentativeCardProps {
  representative: Representative;
}

export function RepresentativeCard({ representative }: RepresentativeCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
      <CardHeader className="relative p-0">
        <div className="aspect-[4/3] w-full overflow-hidden">
          <Image
            src={representative.photoUrl}
            alt={representative.name}
            width={400}
            height={300}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="politician portrait"
          />
        </div>
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4">
           <CardTitle className="font-headline text-xl font-semibold text-white">{representative.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 space-y-2">
        <p className="text-sm text-primary font-medium flex items-center">
          <Users className="mr-2 h-4 w-4" /> {representative.position}
        </p>
        <p className="text-sm text-muted-foreground flex items-center">
          <MapPin className="mr-2 h-4 w-4" /> {representative.constituencyOrWard}, {representative.county} County
        </p>
        <p className="text-sm text-muted-foreground flex items-center">
          <Building className="mr-2 h-4 w-4" /> Party: {representative.party}
        </p>
        {representative.contactInfo.email && (
          <p className="text-sm text-muted-foreground flex items-center truncate">
            <Mail className="mr-2 h-4 w-4 flex-shrink-0" /> 
            <a href={`mailto:${representative.contactInfo.email}`} className="hover:text-primary truncate">
              {representative.contactInfo.email}
            </a>
          </p>
        )}
        {representative.contactInfo.phone && (
          <p className="text-sm text-muted-foreground flex items-center">
            <Phone className="mr-2 h-4 w-4" /> {representative.contactInfo.phone}
          </p>
        )}
        {representative.contactInfo.twitter && (
           <p className="text-sm text-muted-foreground flex items-center">
            <Twitter className="mr-2 h-4 w-4" /> 
            <a 
              href={`https://twitter.com/${representative.contactInfo.twitter.replace('@','')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              {representative.contactInfo.twitter}
            </a>
          </p>
        )}

      </CardContent>
      <CardFooter className="p-4 bg-secondary/20">
        <Button asChild className="w-full" variant="default">
          <Link href={`/representatives/${representative.slug}`}>View Full Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
