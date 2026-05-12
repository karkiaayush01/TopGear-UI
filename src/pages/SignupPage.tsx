import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login, signup } from '../api/api';
import ThemedLogo from '../components/ThemedLogo';
import ThemeToggle from '../components/ThemeToggle';

type SignupPageProps = {
  onLoginSuccess: () => Promise<void>;
};

const SignupPage = ({ onLoginSuccess }: SignupPageProps) => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const toastId = toast.loading('Creating your account...');
    try {
      await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phoneNumber: phoneNumber.trim() || null,
      });
      await login({ email: email.trim(), password });
      await onLoginSuccess();
      toast.success('Welcome to TopGear!', { id: toastId });
      navigate('/home', { replace: true });
    } catch (err) {
      toast.error('Unable to sign up', {
        id: toastId,
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-svh place-items-center bg-[var(--bg)] px-5 pb-9 pt-7 text-[var(--text)] max-[520px]:px-4 max-[520px]:pb-[30px] max-[520px]:pt-6">
      <div className="fixed right-5 top-5 z-10">
        <ThemeToggle />
      </div>
      <section className="flex w-full max-w-[440px] flex-col items-center">
        <header className="mb-[33px] flex w-full flex-col items-center gap-2.5 text-center max-[520px]:mb-[26px]">
          <ThemedLogo className="block h-auto w-[min(170px,56vw)]" />
          <p className="text-sm text-[var(--muted)]">Create your customer account</p>
        </header>

        <form
          className="flex w-full flex-col gap-[13px] rounded-[13px] border border-[var(--border)] bg-[var(--panel)] px-[31px] pb-[33px] pt-[30px] text-left shadow-[var(--shadow)] max-[520px]:px-5 max-[520px]:pb-7 max-[520px]:pt-6"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
            <div>
              <label htmlFor="firstName" className="text-sm font-medium text-[var(--text)]">First name</label>
              <input
                id="firstName"
                className="mt-1 min-h-[41px] w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-3.5 py-2.5 font-bold text-[var(--text-h)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="text-sm font-medium text-[var(--text)]">Last name</label>
              <input
                id="lastName"
                className="mt-1 min-h-[41px] w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-3.5 py-2.5 font-bold text-[var(--text-h)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <label htmlFor="email" className="text-sm font-medium text-[var(--text)]">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="min-h-[41px] w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-3.5 py-2.5 font-bold text-[var(--text-h)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="phoneNumber" className="text-sm font-medium text-[var(--text)]">Phone (optional)</label>
          <input
            id="phoneNumber"
            className="min-h-[41px] w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-3.5 py-2.5 font-bold text-[var(--text-h)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <label htmlFor="password" className="text-sm font-medium text-[var(--text)]">Password (min 8 chars)</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="min-h-[41px] w-full rounded-md border border-[var(--border)] bg-[var(--field)] px-3.5 py-2.5 font-bold text-[var(--text-h)] placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-2.5 min-h-11 cursor-pointer rounded-md border border-[var(--accent)] bg-[#ffad1a] font-extrabold text-black hover:not-disabled:bg-[#ffbd35] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>

          <p className="mt-0.5 self-center text-sm font-medium text-[var(--text)]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#ffad1a] no-underline">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default SignupPage;
