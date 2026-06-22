import React, { useState } from 'react';
import { Logo } from './Logo';
import { ShoppingCart, LogIn, User, LogOut, Menu, X, Shield, Truck, Sun, Moon } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  user: UserType | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  cartCount: number;
  onOpenCart: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export function Navbar({
  user,
  onOpenAuth,
  onLogout,
  cartCount,
  onOpenCart,
  activeTab,
  setActiveTab,
  isDarkMode = false,
  onToggleDarkMode
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Trang Chủ' },
    { id: 'menu', label: 'Thực Đơn' },
    { id: 'about', label: 'Về Chúng Tôi' },
    { id: 'tracking', label: 'Theo Dõi Đơn Hàng' },
  ];

  const handleLinkClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-[#1C1311] border-b border-[#E5E1D8] dark:border-[#2D2321] shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => handleLinkClick('home')}>
            <Logo size="md" />
          </div>

          {/* Desktop Navigation links */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`px-2.5 py-1.5 text-xs lg:text-sm font-semibold transition-all duration-200 border-b-2 ${
                  activeTab === link.id
                    ? 'border-[#D97706] text-[#D97706] font-bold'
                    : 'border-transparent text-[#3E2F26] dark:text-[#EAE3D2] hover:text-[#D97706] dark:hover:text-[#F3F0E9] hover:border-[#D97706]/30'
                }`}
              >
                {link.label}
              </button>
            ))}

            {/* Admin Dashboard view if logged in as Admin */}
            {user && user.role === 'admin' && (
              <button
                onClick={() => handleLinkClick('admin')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full border transition-all duration-200 shrink-0 ${
                  activeTab === 'admin'
                    ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E] border-[#2D241E] dark:border-[#FAF8F5]'
                    : 'bg-[#F3F0E9] dark:bg-[#2D2321] text-[#2D241E] dark:text-[#FAF8F5] border-[#E5E1D8] dark:border-[#3D302D] hover:bg-[#E5E1D8] dark:hover:bg-[#3D302D]'
                }`}
              >
                <Shield className="w-3 h-3 text-[#D97706]" /> Quản Lý ⚙️
              </button>
            )}
          </div>

          {/* Action buttons (Cart, Auth, Theme, Mobile toggle) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3">
            {/* Theme Toggle Button (Desktop & Mobile) */}
            {onToggleDarkMode && (
              <button
                onClick={onToggleDarkMode}
                className="p-2 text-[#3E2F26] dark:text-[#EAE3D2] hover:text-[#D97706] transition-all duration-200 rounded-full hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321]"
                title={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-amber-500 hover:rotate-45 transition-transform" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-700 dark:text-[#E1DBD1]" />
                )}
              </button>
            )}

            {/* Shopping Cart button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-[#3E2F26] dark:text-[#EAE3D2] hover:text-[#D97706] transition-colors duration-200 rounded-full hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321]"
            >
              <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D97706] text-white min-w-4 h-4 text-[10px] px-1 flex items-center justify-center font-black rounded-full shadow-md animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth / Profile menu */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#E5E1D8] dark:border-[#2D2321]">
                {/* Modern visual profile pill */}
                <div className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#251A18] px-2.5 py-1.5 rounded-xl border border-[#E5E1D8] dark:border-[#332522] text-xs font-bold text-[#2D241E] dark:text-[#E1DBD1]">
                  <div className="w-4 h-4 rounded-full bg-[#E5E1D8] dark:bg-[#3D302D] flex items-center justify-center text-[10px] text-white dark:text-[#E1DBD1] font-serif shrink-0">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[80px] truncate font-sans font-bold leading-none">{user.username}</span>
                  <span className="text-[8px] bg-[#E1DBD1] dark:bg-[#3D302D] text-[#2D241E] dark:text-amber-400 font-black px-1.5 py-0.5 rounded uppercase font-mono tracking-tight shrink-0">
                    {user.role === 'admin' ? 'Chủ' : user.role === 'driver' ? 'Shipper' : 'Khách'}
                  </span>
                </div>
                
                <button
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="p-2 text-[#8B7E74] hover:text-red-600 hover:bg-[#F3F0E9] dark:hover:bg-[#2D2321] rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs lg:text-sm font-semibold rounded-xl bg-[#D97706] text-white shadow-xs hover:bg-[#D97706]/90 transition-all duration-300"
              >
                <LogIn className="w-4 h-4" />
                Đăng Nhập
              </button>
            )}

            {/* Mobile menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-[#3E2F26] dark:text-[#EAE3D2] hover:text-[#D97706] focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF8F5]/98 dark:bg-[#1E1311]/98 backdrop-blur-md border-b border-[#E5E1D8] dark:border-[#2D2321] pb-4 px-4 transition-all duration-300 shadow-inner">
          <div className="flex flex-col space-y-2 pt-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`py-2 px-3 text-left text-sm font-semibold rounded-xl transition-all ${
                  activeTab === link.id
                    ? 'bg-[#D97706] text-white font-bold'
                    : 'text-[#3E2F26] dark:text-[#EAE3D2] hover:bg-[#F3F0E9] dark:hover:bg-[#231816]'
                }`}
              >
                {link.label}
              </button>
            ))}

            {user && user.role === 'admin' && (
              <button
                onClick={() => handleLinkClick('admin')}
                className={`flex items-center gap-2 py-2 px-3 text-left text-sm font-semibold rounded-xl transition-all ${
                  activeTab === 'admin'
                    ? 'bg-[#2D241E] dark:bg-[#FAF8F5] text-white dark:text-[#2D241E]'
                    : 'bg-[#F3F0E9] dark:bg-[#231816] text-[#2D241E] dark:text-[#FAF8F5] hover:bg-[#E5E1D8] dark:hover:bg-[#332522]'
                }`}
              >
                <Shield className="w-4 h-4 text-[#D97706]" />
                Quản Lý Quán & Java
              </button>
            )}

            <div className="border-t border-[#E5E1D8] dark:border-[#2D2321] my-2 pt-2 col-span-1 flex flex-col gap-2">
              {/* Extra row for toggle inside mobile drawer for instant access */}
              {onToggleDarkMode && (
                <div className="flex items-center justify-between px-3 py-1 bg-[#F3F0E9] dark:bg-[#2D2321] rounded-xl border border-[#E5E1D8] dark:border-[#3D302D]">
                  <span className="text-xs font-bold text-[#3E2F26] dark:text-[#EAE3D2]">Chế độ ban đêm</span>
                  <button
                    onClick={onToggleDarkMode}
                    className="p-1 px-3 bg-white dark:bg-[#1C1311] border border-[#E5E1D8] dark:border-[#2D2321] text-xs font-extrabold rounded-lg shadow-xs flex items-center gap-1.5 text-[#2D241E] dark:text-[#FAF8F5]"
                  >
                    {isDarkMode ? (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-500" /> Bật
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5 text-slate-700" /> Tắt
                      </>
                    )}
                  </button>
                </div>
              )}

              {user ? (
                <div className="flex items-center justify-between px-3 pt-1">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-[#3E2F26] dark:text-[#EAE3D2]" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#2D241E] dark:text-[#FAF8F5]">{user.username}</span>
                      <span className="text-[10px] text-[#8B7E74] dark:text-[#B2A496] capitalize">{user.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-1 text-xs text-red-600 font-bold bg-white dark:bg-[#251A18] px-3 py-1.5 rounded-xl border border-[#E5E1D8] dark:border-[#332522] shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Đăng Xuất
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 text-center text-sm font-bold bg-[#D97706] text-white rounded-xl shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng Nhập / Đăng Ký
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
