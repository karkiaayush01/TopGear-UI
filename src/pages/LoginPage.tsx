import LoginForm from '../components/LoginForm';

type LoginPageProps = {
  onLoginSuccess: () => Promise<void>;
};

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  return (
    <main className="grid min-h-svh place-items-center bg-[#080908] px-5 pb-9 pt-7 max-[520px]:px-4 max-[520px]:pb-[30px] max-[520px]:pt-6">
      <section className="flex w-full max-w-[405px] flex-col items-center" aria-labelledby="login-title">
        <header className="mb-[33px] flex w-full flex-col items-center gap-2.5 text-center max-[520px]:mb-[26px]">
          <img src="/logo/TopGear-White.png" alt="TopGear" className="block h-auto w-[min(170px,56vw)]" />
          <p className="text-sm text-[#5f6b78]">Auto Parts Management System</p>
        </header>
        <LoginForm onLoginSuccess={onLoginSuccess} />
      </section>
    </main>
  );
};

export default LoginPage;
