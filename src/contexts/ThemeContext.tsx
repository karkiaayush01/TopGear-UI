import Cookies from 'js-cookie';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, type Theme } from './themeContextCore';

const THEME_COOKIE = 'topgear-theme';

const getInitialTheme = (): Theme => {
  if (typeof document === 'undefined') {
    return 'light';
  }

  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.style.colorScheme = theme;
  Cookies.set(THEME_COOKIE, theme, {
    expires: 365,
    path: '/',
    sameSite: 'lax',
  });
};

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, updateThemeState] = useState<Theme>(getInitialTheme);

  const setTheme = useCallback((nextTheme: Theme) => {
    updateThemeState((currentTheme) => {
      applyTheme(nextTheme);
      return currentTheme === nextTheme ? currentTheme : nextTheme;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
