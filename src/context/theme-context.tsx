
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const MEDIA_QUERY = "(prefers-color-scheme: dark)";
const LOCAL_STORAGE_KEY = "appTheme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  // Effect to load theme from localStorage on initial mount
  useEffect(() => {
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_KEY) as Theme | null;
    if (storedTheme && ["light", "dark", "system"].includes(storedTheme)) {
      setThemeState(storedTheme);
    }
  }, []);

  // Effect to update localStorage and resolvedTheme when theme changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, theme);

    const applyTheme = (newResolvedTheme: ResolvedTheme) => {
      setResolvedTheme(newResolvedTheme);
      if (newResolvedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    if (theme === "system") {
      const mql = window.matchMedia(MEDIA_QUERY);
      const handleChange = () => applyTheme(mql.matches ? "dark" : "light");
      handleChange(); // Initial check
      mql.addEventListener("change", handleChange);
      return () => mql.removeEventListener("change", handleChange);
    } else {
      applyTheme(theme as ResolvedTheme);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
