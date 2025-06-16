
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BarChartBig, Landmark, Database, ShieldAlert, ArrowRight, LogIn } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import Image from 'next/image';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
  linkText: string;
}

function FeatureCard({ title, description, icon: Icon, link, linkText }: FeatureCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="bg-secondary/30 p-6">
        <div className="flex items-center gap-4">
          <Icon className="h-10 w-10 text-primary" />
          <CardTitle className="font-headline text-xl">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6">
        <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
      </CardContent>
      <div className="p-6 pt-0">
        <Button asChild variant="link" className="p-0 text-primary hover:text-primary/80">
          <Link href={link}>
            {linkText} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

export default function HomePage() {
  return (
    <MainLayout>
      <section className="py-12 text-center md:py-20">
        <div className="container mx-auto max-w-3xl">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
            Welcome to KenyaWatch
          </h1>
          <p className="mt-6 text-lg leading-8 text-foreground/80 sm:text-xl">
            Your comprehensive platform for tracking the performance and integrity of elected representatives in Kenya. Empowering citizens with data for accountability.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className="shadow-md">
              <Link href="/representatives">Explore Representatives</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-md">
              <Link href="/data/leaderboard">View Leaderboards</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
         <div className="relative mb-12 h-64 md:h-96 w-full overflow-hidden rounded-lg shadow-xl">
            <Image 
              src="https://placehold.co/1200x400.png" 
              alt="Kenya Parliament" 
              layout="fill" 
              objectFit="cover" 
              data-ai-hint="Kenya parliament building"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <h2 className="font-headline text-3xl md:text-4xl font-semibold text-white text-center p-4">
                Transparency. Accountability. Progress.
              </h2>
            </div>
          </div>

        <h2 className="font-headline mb-10 text-center text-3xl font-semibold text-primary md:text-4xl">
          Key Features
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Representative Profiles"
            description="Detailed profiles of elected officials, from President to MCA, including contact info, constituency, and performance."
            icon={Users}
            link="/representatives"
            linkText="View Profiles"
          />
          <FeatureCard
            title="Integrity Reports"
            description="AI-powered summaries of verified news on representative integrity, helping you stay informed about potential concerns."
            icon={ShieldAlert}
            link="/representatives" // Link to profiles where reports are shown
            linkText="Learn More"
          />
          <FeatureCard
            title="Performance Leaderboards"
            description="Interactive rankings based on performance metrics, integrity scores, and public engagement."
            icon={BarChartBig}
            link="/data/leaderboard"
            linkText="See Rankings"
          />
          <FeatureCard
            title="County GDP Data"
            description="Access and compare GDP data across different counties to understand regional economic performance."
            icon={Landmark}
            link="/data/county-gdp"
            linkText="Explore GDP Data"
          />
          <FeatureCard
            title="Census Information"
            description="View sortable Kenyan census data to understand demographic trends and population distribution."
            icon={Database}
            link="/data/census"
            linkText="Analyze Census Data"
          />
           <FeatureCard
            title="Secure Access"
            description="Login to access personalized features and contribute to community discussions (future feature)."
            icon={LogIn}
            link="/auth/login"
            linkText="Login or Register"
          />
        </div>
      </section>
    </MainLayout>
  );
}
