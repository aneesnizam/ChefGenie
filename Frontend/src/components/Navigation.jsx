import React from 'react';
import { Home, BookOpen, MessageCircle, Calendar,PlusCircle , User, Moon, Sun, Sparkles } from 'lucide-react';
import LogoImage from '../assets/logo/whiteLogoCroped.png';
import { useNavigate, useLocation } from 'react-router-dom';


export default function Navigation({ isDark, onToggleTheme })  {

  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'recipes', label: 'Recipes', icon: BookOpen },
    { id: 'ai-recipes', label: 'AI Recipes', icon: Sparkles },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    // { id: 'planner', label: 'Planner', icon: Calendar },
    //  { id: 'add', label: 'Add Recipe', icon: PlusCircle  },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      <nav className="sticky top-0 z-999 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/app/home')}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
              {/* <Sparkles className="w-6 h-6 text-white" /> */}
              <img src={LogoImage} className="w-full px-[4px] " alt="Logo" />
            </div>
            <span className="font-['Poppins'] text-xl text-foreground">ChefGenie</span>
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === `/app/${item.id}`;

              // const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/app/${item.id}`)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="rounded-full p-2 hover:bg-muted transition-colors"
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around pb-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === `/app/${item.id}`;

            return (
              <button
                key={item.id}
                onClick={() => navigate(`/app/${item.id}`)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
    </>
  )
}


