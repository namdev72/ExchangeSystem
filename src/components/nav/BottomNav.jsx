import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, GraduationCap, BookOpen, Users } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { path: "/Dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/upload", icon: BookOpen, label: "List Book", isUpload: true },
  { path: "/", icon: BookOpen, label: "Home" },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ path, icon: Icon, label, isUpload }) => {
          const active = pathname === path || (path === "/" && pathname.startsWith("/books"));
          
          if (isUpload) {
            return (
              <Link key={path} to={path} className="relative flex flex-col items-center justify-end h-full px-2">
                <div className="absolute -top-5 w-14 h-14 bg-gradient-to-tr from-accent to-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 text-accent-foreground transform hover:scale-105 transition-transform">
                  <span className="text-2xl font-bold mb-1">+</span>
                </div>
                <span className="text-[10px] font-semibold text-accent-foreground mt-auto mb-1 whitespace-nowrap">
                  List a Book
                </span>
              </Link>
            );
          }

          return (
            <Link key={path} to={path} className="flex flex-col items-center gap-1 p-2 w-16">
              <Icon className={clsx("w-6 h-6 transition-colors", active ? "text-primary" : "text-muted-foreground")} />
              <span className={clsx("text-[10px] transition-colors", active ? "text-primary font-semibold" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
