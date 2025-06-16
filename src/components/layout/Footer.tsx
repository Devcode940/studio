
export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground md:px-6">
        <p>&copy; {currentYear} KenyaWatch. All rights reserved.</p>
        <p className="mt-1">Promoting transparency and accountability in Kenyan governance.</p>
      </div>
    </footer>
  );
}
