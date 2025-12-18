import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ColorScheme, ThemeMode } from '../theme';

const THEME_STORAGE_KEY = '@athlo:theme';

interface ThemeContextType {
  mode: ThemeMode;
  theme: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Dark mode é o padrão
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    loadStoredTheme();
  }, []);

  async function loadStoredTheme() {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setMode(storedTheme);
      }
    } catch (error) {
      // Mantém dark mode como padrão
    }
  }

  async function setTheme(newMode: ThemeMode) {
    setMode(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      // Silently fail
    }
  }

  function toggleTheme() {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setTheme(newMode);
  }

  const theme = mode === 'dark' ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider
      value={{
        mode,
        theme,
        isDark: mode === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook para acessar cores diretamente
export function useColors() {
  const { theme } = useTheme();
  return theme;
}
