
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Home, Users, BarChartBig, Landmark, Database, LogIn, LogOut, LayoutDashboard, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import type { NavItem } from '@/types';
import { cn } from '@/lib/utils';
import React from 'react';

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/representatives', label: 'Representatives', icon: Users },
  { href: '/data/leaderboard', label: 'Leaderboard', icon: BarChartBig },
  { href: '/data/county-gdp', label: 'County GDP', icon: Landmark },
  { href: '/data/census', label: 'Census Data', icon: Database },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, protected: true },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const filteredNavItems = navItems.filter(item => !item.protected || (item.protected && user));

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {filteredNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => mobile && setIsMobileMenuOpen(false)}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
            pathname === item.href ? "text-primary bg-primary/5" : "text-foreground/80",
            mobile && "w-full justify-start text-base"
          )}
        >
          {item.icon && <item.icon className="h-5 w-5" />}
          {item.label}
        </Link>
      ))}
    </>
  );
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-2xl font-semibold text-primary">KenyaWatch</h1>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4" /> Login
              </Link>
            </Button>
          )}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background p-6">
                <div className="mb-6 flex items-center gap-2">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                  <h1 className="font-headline text-2xl font-semibold text-primary">KenyaWatch</h1>
                </div>
                <nav className="flex flex-col gap-3">
                  <NavLinks mobile />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
