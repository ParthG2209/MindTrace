import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { slide as Menu } from 'react-burger-menu';
import {
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Video,
  Users,
  Settings as SettingsIcon,
  BarChart3
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import MindTraceFooter from '../components/ui/mindtrace-footer';
import { GridBackground } from '../components/ui/grid-background'; // CHANGED: Import GridBackground
import { MenuToggleIcon } from '../components/ui/menu-toggle-icon';
import '../styles/burger-menu.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleStateChange = (state) => {
    setMenuOpen(state.isOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    closeMenu();
  };

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Sessions',
      href: '/dashboard/sessions',
      icon: Video,
    },
    {
      label: 'Mentors',
      href: '/dashboard/mentors',
      icon: Users,
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: SettingsIcon,
    },
    {
      label: 'Profile',
      href: '/dashboard/profile',
      icon: UserIcon,
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-black relative">
      <GridBackground darkMode={true} /> {/* CHANGED: Use GridBackground with darkMode */}

      <div className="fixed top-6 left-6 z-[1100]">
        <MenuToggleIcon
          open={menuOpen}
          onClick={toggleMenu}
          className="w-8 h-8 text-white"
        />
      </div>

      <Menu
        isOpen={menuOpen}
        onStateChange={handleStateChange}
        width={'280px'}
        customBurgerIcon={false}
        customCrossIcon={false}
      >
        {/* Menu content remains the same */}
        <div className="px-4 pb-6 mb-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">MindTrace</h2>
        </div>

        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`menu-item ${isActive(item.href) ? 'active' : ''}`}
              >
                <Icon />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        {user && (
          <div className="menu-user-profile">
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="user-dropdown">
                  <div
                    onClick={() => {
                      handleNavigation('/dashboard/profile');
                      setShowUserMenu(false);
                    }}
                    className="user-dropdown-item"
                  >
                    <UserIcon />
                    <span>View Profile</span>
                  </div>
                  <div
                    onClick={() => {
                      handleLogout();
                      setShowUserMenu(false);
                    }}
                    className="user-dropdown-item logout"
                  >
                    <LogOut />
                    <span>Logout</span>
                  </div>
                </div>
              </>
            )}

            <div
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="user-profile-button"
            >
              <div className="user-avatar">
                <UserIcon />
              </div>
              <div className="user-info">
                <p className="user-name">
                  {user.displayName || user.email?.split('@')[0]}
                </p>
                <p className="user-email">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </Menu>

      <div className="flex flex-1 flex-col w-full">
        <main className="p-6 flex-1 relative z-10 overflow-auto">
          <Outlet />
        </main>
        <div className="relative z-10">
          <MindTraceFooter />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;