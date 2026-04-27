import { Link, Outlet, Navigate } from "react-router-dom";
import { BookOpen, LogOut, Coins } from "lucide-react";
import BottomNav from "./components/nav/BottomNav";
import { useAuth } from "./context/AuthContext";

export default function Layout() {
  const { user, userData, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background font-inter pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm shadow-primary/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-sora font-bold text-foreground">
              Book<span className="text-primary">Loop</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent-foreground rounded-full px-3 py-1.5 text-sm font-semibold">
              <Coins className="w-4 h-4 text-accent" />
              <span>{userData?.tokenBalance ?? 0}</span>
            </div>
            <button onClick={logout} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}
