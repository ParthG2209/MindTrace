import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Award, Users, Video, BarChart3, LogOut, 
  User as UserIcon, Home, Settings
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import MindTraceFooter from '../components/ui/mindtrace-footer';
import { DottedSurface } from '../components/ui/dotted-surface';
import PillNav from '../components/ui/PillNav';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Navigation items for PillNav
  const navItems = [
    { 
      href: '/dashboard', 
      label: 'Dashboard',
      ariaLabel: 'Go to Dashboard'
    },
    { 
      href: '/dashboard/sessions', 
      label: 'Sessions',
      ariaLabel: 'View Sessions'
    },
    { 
      href: '/dashboard/mentors', 
      label: 'Mentors',
      ariaLabel: 'View Mentors'
    },
    { 
      href: '/dashboard/settings', 
      label: 'Settings',
      ariaLabel: 'View Settings'
    },
    { 
      href: '/dashboard/profile', 
      label: 'Profile',
      ariaLabel: 'View Profile'
    }
  ];

  // Convert Award icon to a data URL for the logo
  const logoDataUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'/%3E%3C/svg%3E";

  return (
    <div className="min-h-screen bg-black relative">
      {/* Dotted Surface Background - Z-INDEX 0 */}
      <DottedSurface darkMode={true} />
      
      {/* Top Navigation Bar - Z-INDEX 50 */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center px-6 py-4 bg-gradient-to-r from-gray-900/95 via-black/95 to-black/95 backdrop-blur-xl border-b border-white/10">
        {/* Left: PillNav 
            Positioned absolutely via the component's internal styles, 
            but integrated here with specific color props for the requested Black->White effect.
        */}
        <PillNav
          logo={logoDataUrl}
          logoAlt="MindTrace Logo"
          items={navItems}
          activeHref={location.pathname}
          // The baseColor dictates the "Hover Circle" color (White)
          baseColor="#ffffff"
          // The pillColor dictates the "Resting Pill" background (Black)
          pillColor="#000000"
          // The hovered text color (Black)
          hoveredPillTextColor="#000000"
          // The resting text color (White)
          pillTextColor="#ffffff"
          ease="power3.out"
          initialLoadAnimation={true}
        />

        {/* Right: User Menu - Added ml-auto to force it to the right */}
        {user && (
          <div className="relative ml-auto">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-white truncate max-w-[150px]">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-400 truncate max-w-[150px]">{user.email}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-64 bg-gradient-to-br from-gray-900 to-black rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <p className="text-sm font-semibold text-white truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate('/dashboard/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <UserIcon className="w-4 h-4" />
                      View Profile
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Content - Add top padding to account for fixed navbar */}
      <div className="relative z-10 pt-20">
        <main className="p-6 min-h-screen relative z-10">
          <Outlet />
        </main>

        {/* Footer */}
        <div className="relative z-10">
          <MindTraceFooter />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;