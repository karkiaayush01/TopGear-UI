import LoginForm from '../components/LoginForm';
import ThemedLogo from '../components/ThemedLogo';
import ThemeToggle from '../components/ThemeToggle';

type LoginPageProps = {
  onLoginSuccess: () => Promise<void>;
};

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  return (
    <main className="grid min-h-svh place-items-center bg-[var(--bg)] px-5 pb-9 pt-7 text-[var(--text)] max-[520px]:px-4 max-[520px]:pb-[30px] max-[520px]:pt-6">
      <div className="fixed right-5 top-5 z-10">
        <ThemeToggle />
      </div>
      <section className="flex w-full max-w-[405px] flex-col items-center" aria-labelledby="login-title">
        <header className="mb-[33px] flex w-full flex-col items-center gap-2.5 text-center max-[520px]:mb-[26px]">
          <ThemedLogo className="block h-auto w-[min(170px,56vw)]" />
          <p className="text-sm text-[var(--muted)]">Auto Parts Management System</p>
        </header>
        <LoginForm onLoginSuccess={onLoginSuccess} />
      </section>
    </main>
  );
};

export default LoginPage;
