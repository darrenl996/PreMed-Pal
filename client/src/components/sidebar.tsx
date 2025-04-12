import { Link, useLocation } from "wouter";
import { PillBottle, LayoutDashboard, Book, FileText, Calendar, Settings, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon, label, active, onClick }: NavItemProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center space-x-2 rounded-lg px-3 py-2 transition-colors cursor-pointer",
          active 
            ? "bg-neutral-100 text-neutral-900" 
            : "text-neutral-600 hover:bg-neutral-100"
        )}
        onClick={onClick}
      >
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  );
}

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const initials = useMemo(() => {
    if (!user?.fullName) return "U";
    
    const parts = user.fullName.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [user?.fullName]);

  // Navigation items
  const navItems = [
    { href: "/", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { href: "/courses", icon: <Book size={18} />, label: "My Courses" },
    { href: "/study-plans", icon: <FileText size={18} />, label: "Study Plans" },
    { href: "/calendar", icon: <Calendar size={18} />, label: "Calendar" },
    { href: "/settings", icon: <Settings size={18} />, label: "Settings" },
  ];

  const navigationContent = (
    <>
      <div className="p-6">
        <div className="flex items-center">
          <PillBottle className="h-6 w-6 text-primary-600 mr-2" />
          <h1 className="text-xl font-bold text-primary-600">PreMedPal</h1>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={location === item.href}
            onClick={() => setOpen(false)}
          />
        ))}
      </nav>
      
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary-100 text-primary-600">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-neutral-500">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => logoutMutation.mutate()}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-white">
        <div className="fixed top-0 left-0 right-0 h-16 border-b border-neutral-200 bg-white z-10 px-4 flex items-center justify-between">
          <div className="flex items-center">
            <PillBottle className="h-6 w-6 text-primary-600 mr-2" />
            <h1 className="text-xl font-bold text-primary-600">PreMedPal</h1>
          </div>
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex flex-col h-full">
                {navigationContent}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="pt-16 pb-16">
          {children}
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-neutral-200 bg-white flex items-center justify-around">
          {navItems.slice(0, 4).map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex flex-col items-center justify-center text-xs cursor-pointer",
                location === item.href ? "text-primary-600" : "text-neutral-600"
              )}>
                <div className="text-xl mb-1">{item.icon}</div>
                <span>{item.label.split(' ')[0]}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-neutral-200 bg-white hidden md:flex md:flex-col">
        {navigationContent}
      </aside>
      <main className="flex-1 bg-neutral-50">
        {children}
      </main>
    </div>
  );
}
