'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Table2,
  LayoutDashboard,
  HelpCircle,
  BarChart3,
  Lightbulb,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import type { User } from '@/types';

interface NavbarProps {
  user: User | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navLinks = [
    { href: '/track', label: 'Track Sheet', icon: Table2 },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/questions', label: 'Questions', icon: HelpCircle },
    { href: '/analytics', label: 'Analytics', icon: BarChart3, ownerB: true },
    { href: '/insights', label: 'Insights', icon: Lightbulb, ownerB: true },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/track" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform flex-shrink-0 bg-slate-900 border border-slate-800/80">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/icon-192.png"
                  alt="HabitFlow Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Habit<span className="text-emerald-400">Flow</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-1 tracking-wider uppercase font-medium">
                  Hourly Habit Tracker
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href === '/track' && pathname === '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                  {link.ownerB && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      B
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User profile / Logout */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-200">
                    {user.name || user.email.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 max-w-[140px] truncate">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  title="Sign out"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-slate-800 hover:border-rose-500/30 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{loggingOut ? 'Signing out...' : 'Sign out'}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900/98 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href === '/track' && pathname === '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
                {link.ownerB && (
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Owner B
                  </span>
                )}
              </Link>
            );
          })}

          {user && (
            <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-slate-200">
                  {user.name || user.email.split('@')[0]}
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  {user.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
