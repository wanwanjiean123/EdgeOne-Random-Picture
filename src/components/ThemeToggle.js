"use client";

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initial check
    const isDarkTheme = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(isDarkTheme);
    
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listen for storage events (including manual dispatches)
    const handleStorageChange = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
    // 强制触发重绘
    window.dispatchEvent(new Event('storage'));
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-all backdrop-blur-md z-50 group border border-black/10 dark:border-white/10 shadow-sm"
      aria-label="Toggle Dark Mode"
    >
      {isDark ? (
        // Sun icon
        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon icon
        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
