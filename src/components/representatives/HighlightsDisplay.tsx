
import type { Highlight } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Star, ThumbsUp, MessageSquare, ExternalLink, Trophy } from 'lucide-react';

interface HighlightsDisplayProps {
  highlights: Highlight[];
  title?: string;
}

const CategoryIcon = ({ category }: { category: Highlight['category'] }) => {
  switch (category) {
    case 'Achievement': return <Star className="h-5 w-5 text-yellow-500" />;
    case 'Significant Vote': return <ThumbsUp className="h-5 w-5 text-green-500" />;
    case 'Important Statement': return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'Project Launch': return <Trophy className="h-5 w-5 text-purple-500" />;
    default: return <Star className="h-5 w-5 text-gray-500" />;
  }
};

export function HighlightsDisplay({ highlights, title = "Key Highlights" }: HighlightsDisplayProps) {
  if (!highlights || highlights.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
           <CardTitle className="font-headline text-xl flex items-center">
            <Star className="mr-2 h-6 w-6 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No highlights available for this representative.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
       <CardHeader>
        <div className="flex items-center gap-3">
         <Star className="mr-2 h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-xl">{title}</CardTitle>
            <CardDescription>Notable achievements, votes, statements, and projects.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-6">
          {highlights.map((highlight) => (
            <li key={highlight.id} className="p-4 rounded-md border bg-card hover:bg-secondary/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CategoryIcon category={highlight.category} />
                    <h3 className="font-semibold text-md text-primary">{highlight.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(highlight.date), 'PPP')} - <span className="font-medium">{highlight.category}</span>
                  </p>
                </div>
                {highlight.sourceUrl && (
                  <a
                    href={highlight.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 p-1 -mr-1 -mt-1"
                    aria-label="View source"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="mt-2 text-sm text-foreground/90 leading-relaxed">{highlight.description}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
