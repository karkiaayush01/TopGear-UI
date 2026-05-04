import { useTheme } from '../contexts/themeContextCore';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="relative inline-grid h-9 w-[124px] grid-cols-2 items-center rounded-full border border-[var(--toggle-border)] bg-[var(--toggle-bg)] p-1 text-xs font-extrabold text-[var(--toggle-text)] shadow-sm transition hover:border-[var(--accent)] focus:outline-[3px_solid_rgba(255,179,0,0.22)]"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      onClick={toggleTheme}
    >
      <span
        className={`absolute left-1 top-1 h-7 w-[56px] rounded-full bg-[var(--accent)] shadow transition-transform duration-200 ${
          isDark ? 'translate-x-[60px]' : 'translate-x-0'
        }`}
        aria-hidden="true"
      />
      <span className={`relative z-10 text-center transition-colors ${isDark ? '' : 'text-black'}`}>Light</span>
      <span className={`relative z-10 text-center transition-colors ${isDark ? 'text-black' : ''}`}>Dark</span>
    </button>
  );
};

export default ThemeToggle;
