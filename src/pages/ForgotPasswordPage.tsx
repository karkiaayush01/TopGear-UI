import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { requestForgotPasswordCode, resetPassword } from '../api/api';
import ThemedLogo from '../components/ThemedLogo';
import ThemeToggle from '../components/ThemeToggle';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSendingCode(true);

    const toastId = toast.loading('Sending reset code...', {
      description: 'Checking the email address.',
    });

    try {
      const response = await requestForgotPasswordCode({ email });
      setCodeSent(true);

      toast.success('Check your email', {
        id: toastId,
        description: response.message,
      });
    } catch (err) {
      toast.error('Unable to send reset code', {
        id: toastId,
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'Please confirm the new password again.',
      });
      return;
    }

    setIsResetting(true);

    const toastId = toast.loading('Resetting password...', {
      description: 'Verifying your code.',
    });

    try {
      await resetPassword({ email, verificationCode, password });

      toast.success('Password reset successfully', {
        id: toastId,
        description: 'You can now sign in with your new password.',
      });

      navigate('/login', { replace: true });
    } catch (err) {
      toast.error('Unable to reset password', {
        id: toastId,
        description: err instanceof Error ? err.message : 'Please check the code and try again.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="grid min-h-svh place-items-center bg-[var(--bg)] px-5 pb-9 pt-7 text-[var(--text)] max-[520px]:px-4 max-[520px]:pb-[30px] max-[520px]:pt-6">
      <div className="fixed right-5 top-5 z-10">
        <ThemeToggle />
      </div>
      <section className="flex w-full max-w-[405px] flex-col items-center" aria-labelledby="forgot-password-title">
        <header className="mb-[33px] flex w-full flex-col items-center gap-2.5 text-center max-[520px]:mb-[26px]">
          <ThemedLogo className="block h-auto w-[min(170px,56vw)]" />
          <p className="text-sm text-[var(--muted)]">Auto Parts Management System</p>
        </header>

        <div className="flex w-full flex-col gap-[13px] rounded-[13px] border border-[var(--border)] bg-[var(--panel)] px-[31px] pb-[33px] pt-[30px] text-left shadow-[var(--shadow)] max-[520px]:px-5 max-[520px]:pb-7 max-[520px]:pt-6">
          <div className="mb-2 flex flex-col gap-2">
            <h1 id="forgot-password-title" className="text-2xl font-extrabold text-[var(--text-h)]">
              Reset password
            </h1>
            <p className="text-sm leading-6 text-[var(--text)]">
              Enter your email to receive a verification code, then choose a new password.
            </p>
          </div>

          <form className="flex flex-col gap-[13px]" onSubmit={handleSendCode}>
            <label htmlFor="email" className="text-sm font-medium text-[var(--text)]">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              className="min-h-[41px] w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-3.5 py-2.5 font-bold text-[var(--text-h)] placeholder:text-[var(--muted)] placeholder:opacity-70 focus:border-[var(--accent)] focus:outline-[3px_solid_rgba(255,179,0,0.14)] disabled:opacity-70"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSendingCode || isResetting}
              required
            />

            <button
              type="submit"
              disabled={isSendingCode || isResetting}
              className="mt-2.5 min-h-11 cursor-pointer rounded-md border border-[var(--accent)] bg-[#ffad1a] font-extrabold text-black hover:not-disabled:bg-[#ffbd35] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSendingCode ? 'Sending code...' : codeSent ? 'Send code again' : 'Send reset code'}
            </button>
          </form>

          {codeSent && (
            <form className="mt-3 flex flex-col gap-[13px]" onSubmit={handleResetPassword}>
              <label htmlFor="verificationCode" className="text-sm font-medium text-[var(--text)]">
                Verification code
              </label>
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit code"
                className="min-h-[41px] w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-3.5 py-2.5 font-bold text-[var(--text-h)] placeholder:text-[var(--muted)] placeholder:opacity-70 focus:border-[var(--accent)] focus:outline-[3px_solid_rgba(255,179,0,0.14)]"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                minLength={6}
                maxLength={6}
                required
              />

              <label htmlFor="password" className="text-sm font-medium text-[var(--text)]">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Enter new password"
                className="min-h-[41px] w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-3.5 py-2.5 font-bold text-[var(--text-h)] placeholder:text-[var(--muted)] placeholder:opacity-70 focus:border-[var(--accent)] focus:outline-[3px_solid_rgba(255,179,0,0.14)]"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--text)]">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                className="min-h-[41px] w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-3.5 py-2.5 font-bold text-[var(--text-h)] placeholder:text-[var(--muted)] placeholder:opacity-70 focus:border-[var(--accent)] focus:outline-[3px_solid_rgba(255,179,0,0.14)]"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />

              <button
                type="submit"
                disabled={isResetting || isSendingCode}
                className="mt-2.5 min-h-11 cursor-pointer rounded-md border border-[var(--accent)] bg-[#ffad1a] font-extrabold text-black hover:not-disabled:bg-[#ffbd35] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isResetting ? 'Resetting password...' : 'Reset password'}
              </button>
            </form>
          )}

          <Link to="/login" className="mt-0.5 self-center text-sm font-bold text-[#ffad1a] no-underline">
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
};

export default ForgotPasswordPage;
