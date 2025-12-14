import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, 
  User as UserIcon,
  LayoutDashboard,
  Video,
  Users,
  Settings as SettingsIcon,
  BarChart3,
  Award
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import MindTraceFooter from '../components/ui/mindtrace-footer';
import { DottedSurface } from '../components/ui/dotted-surface';
import { Sidebar, SidebarBody, SidebarLink } from '../components/ui/sidebar';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [open, setOpen] = useState(false);

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

  const links = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: (
        <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Sessions',
      href: '/dashboard/sessions',
      icon: (
        <Video className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Mentors',
      href: '/dashboard/mentors',
      icon: (
        <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: (
        <BarChart3 className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: (
        <SettingsIcon className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: 'Profile',
      href: '/dashboard/profile',
      icon: (
        <UserIcon className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const Logo = () => {
    return (
      <div
        onClick={() => navigate('/dashboard')}
        className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20 cursor-pointer"
      >
        <Award className="h-6 w-6 text-white dark:text-white flex-shrink-0" />
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-bold text-white dark:text-white whitespace-pre text-lg"
        >
          MindTrace
        </motion.span>
      </div>
    );
  };

  const LogoIcon = () => {
    return (
      <div
        onClick={() => navigate('/dashboard')}
        className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20 cursor-pointer"
      >
        <Award className="h-6 w-6 text-white dark:text-white flex-shrink-0" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Dotted Surface Background - Z-INDEX 0 */}
      <DottedSurface darkMode={true} />
      
      {/* Main Layout Container */}
      <div
        className={cn(
          "flex flex-col md:flex-row w-full flex-1 mx-auto border-neutral-200 dark:border-neutral-700 overflow-hidden",
          "min-h-screen"
        )}
      >
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10 bg-gradient-to-b from-gray-900/95 to-black/95 border-r border-white/10">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
              {open ? <Logo /> : <LogoIcon />}
              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                  <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>
            
            {/* User Profile Section */}
            <div>
              {user && (
                <div className="relative">
                  <div
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <motion.div
                      animate={{
                        display: open ? "block" : "none",
                        opacity: open ? 1 : 0,
                      }}
                      className="flex-1 min-w-0"
                    >
                      <p className="text-sm font-semibold text-white truncate">
                        {user.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </motion.div>
                  </div>

                  {/* Dropdown Menu */}
                  {showUserMenu && open && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-gradient-to-br from-gray-900 to-black rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
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
          </SidebarBody>
        </Sidebar>
        
        {/* Main Content */}
        <div className="flex flex-1 flex-col w-full">
          <main className="p-6 flex-1 relative z-10 overflow-auto">
            <Outlet />
          </main>
          <div className="relative z-10">
            <MindTraceFooter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
