import { Link, useLocation } from "wouter";
import { LayoutDashboard, Book, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNavigation() {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/", icon: <LayoutDashboard className="text-xl" />, label: "Home" },
    { href: "/courses", icon: <Book className="text-xl" />, label: "Courses" },
    { href: "/study-plans", icon: <FileText className="text-xl" />, label: "Plans" },
    { href: "/profile", icon: <User className="text-xl" />, label: "Profile" },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 border-t border-neutral-200 bg-white md:hidden">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a className={cn(
              "flex flex-col items-center justify-center text-xs",
              location === item.href ? "text-primary-600" : "text-neutral-600"
            )}>
              <div className="mb-1">{item.icon}</div>
              <span>{item.label}</span>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
