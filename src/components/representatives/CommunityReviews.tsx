
'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Star, MessageCircle, Loader2, UserCircle, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Review } from '@/types';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters.').max(500, 'Comment must not exceed 500 characters.'),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface CommunityReviewsProps {
  representativeId: string;
}

const StarRatingInput = ({ field }: { field: any }) => {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`cursor-pointer h-7 w-7 transition-colors ${
            star <= (hover || field.value || 0)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
          onClick={() => field.onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        />
      ))}
    </div>
  );
};

export function CommunityReviews({ representativeId }: CommunityReviewsProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'representatives', representativeId, 'reviews'), orderBy('createdAt', 'desc'));
  }, [firestore, representativeId]);

  const { data: reviews, isLoading: isLoadingReviews } = useCollection<Review>(reviewsQuery);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  async function onSubmit(data: ReviewFormValues) {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to submit a review.' });
      return;
    }
    setIsLoading(true);

    const newReview = {
      ...data,
      userId: user.uid,
      userName: user.displayName || user.email || 'Anonymous',
      createdAt: serverTimestamp(),
    };

    try {
      const reviewsCollection = collection(firestore, 'representatives', representativeId, 'reviews');
      addDocumentNonBlocking(reviewsCollection, newReview);

      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback! Your review will appear shortly.',
      });
      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="font-headline text-xl">Community Feedback</CardTitle>
            <CardDescription>Ratings and reviews from fellow citizens.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {user ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 border rounded-lg space-y-4">
              <h3 className="font-semibold">Leave a Review</h3>
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Rating</FormLabel>
                    <FormControl>
                      <StarRatingInput field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Comment</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Share your thoughts on the representative's performance..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="mr-2 h-4 w-4" /> Submit Review</>}
              </Button>
            </form>
          </Form>
        ) : (
          <Card className="bg-secondary/50 p-4 text-center">
            <CardDescription>
              <a href="/auth/login" className="font-semibold text-primary hover:underline">Log in</a> to leave a review and share your opinion.
            </CardDescription>
          </Card>
        )}

        <div className="space-y-6">
          <h3 className="font-headline text-lg font-semibold">Recent Reviews</h3>
          {isLoadingReviews ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">Loading reviews...</p>
            </div>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="p-4 border rounded-md bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-6 w-6 text-muted-foreground" />
                    <span className="font-semibold">{review.userName}</span>
                  </div>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground/90 mb-2">{review.comment}</p>
                <p className="text-xs text-muted-foreground">
                  {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : ''}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No reviews have been submitted yet. Be the first!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
