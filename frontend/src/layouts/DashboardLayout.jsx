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
  BarChart3,
  Award
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import MindTraceFooter from '../components/ui/mindtrace-footer';
import { DottedSurface } from '../components/ui/dotted-surface';
import MenuBarToggle from '../components/ui/menu-toggle-icon';
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

  // Syncs the library's internal state with our local state
  const handleStateChange = (state) => {
    setMenuOpen(state.isOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Manually toggle the menu
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
      {/* Dotted Surface Background */}
      <DottedSurface darkMode={true} />
      
      {/* CUSTOM TOGGLE BUTTON 
        Placed manually to ensure your custom component and animations work 
        independently of the library's default button wrapper.
      */}
      <div className="fixed top-6 left-6 z-[1100]">
        <MenuBarToggle 
          isOpen={menuOpen} 
          toggle={toggleMenu} 
        />
      </div>

      {/* Burger Menu Sidebar */}
      <Menu
        isOpen={menuOpen}
        onStateChange={handleStateChange}
        width={'280px'}
        customBurgerIcon={false} /* We disable the default icon to use our own above */
        customCrossIcon={false}  /* Optional: disable default close X if you want to use the toggle to close too */
      >
        {/* Logo */}
        <div className="menu-logo" onClick={() => handleNavigation('/dashboard')}>
          <Award />
          <span>MindTrace</span>
        </div>

        {/* Menu Items */}
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

        {/* User Profile Section */}
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
  );
};

export default DashboardLayout;