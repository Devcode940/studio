
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg font-medium">Loading dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="rounded-lg bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground shadow-lg">
          <h1 className="font-headline text-4xl font-bold">Welcome to Your Dashboard, {user.name || user.email}!</h1>
          <p className="mt-2 text-lg opacity-90">
            Here you can manage your preferences and view personalized insights.
          </p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Account Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><strong>Email:</strong> {user.email}</p>
            <p>This is a placeholder for your dashboard content. More features coming soon!</p>
            <Button onClick={logout} variant="destructive">Logout</Button>
          </CardContent>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Followed Representatives</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You are not following any representatives yet.</p>
              {/* Placeholder for followed representatives list */}
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No recent activity.</p>
              {/* Placeholder for recent activity feed */}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
