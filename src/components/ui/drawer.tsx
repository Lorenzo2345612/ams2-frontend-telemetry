import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, BarChart3, Fuel, GitCompare, Database, KeyRound, LogOut } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Race Packages',
    path: '/races',
    icon: <Database className="h-5 w-5" />,
  },
  {
    label: 'Lap Comparison',
    path: '/',
    icon: <GitCompare className="h-5 w-5" />,
  },
  {
    label: 'Fuel Analysis',
    path: '/fuel',
    icon: <Fuel className="h-5 w-5" />,
  },
  {
    label: 'Fuel Comparison',
    path: '/fuel/compare',
    icon: <BarChart3 className="h-5 w-5" />,
  },
];

interface DrawerProps {
  children: React.ReactNode;
}

export function Drawer({ children }: DrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-background"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-muted border-r border-border transform transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">AMS2 Telemetry</h2>
            <p className="text-sm text-muted-foreground mt-1">Analysis Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent'
                      )
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Account Section */}
          <div className="p-4 border-t border-border space-y-2">
            {user && (
              <p className="text-xs text-muted-foreground truncate px-2 mb-2">
                {user.email}
              </p>
            )}
            <NavLink
              to="/change-password"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent'
                )
              }
            >
              <KeyRound className="h-4 w-4" />
              <span>Change Password</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm text-red-500 hover:bg-red-500/10 w-full"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              AMS2 Telemetry v1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
