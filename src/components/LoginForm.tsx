import type { FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import { login } from '../api/api';

type LoginFormProps = {
  onLoginSuccess: () => Promise<void>;
};

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const toastId = toast.loading('Signing in...', {
      description: 'Checking your credentials.',
    });

    try {
      await login({ email, password });
      await onLoginSuccess();

      toast.success('Signed in successfully', {
        id: toastId,
        description: 'Redirecting to your dashboard.',
      });
    } catch (err) {
      toast.error('Unable to sign in', {
        id: toastId,
        description: err instanceof Error ? err.message : 'Please check your details and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="flex w-full flex-col gap-[13px] rounded-[13px] border border-[rgba(255,179,0,0.32)] bg-[#0b0c0c] px-[31px] pb-[33px] pt-[30px] text-left max-[520px]:px-5 max-[520px]:pb-7 max-[520px]:pt-6"
      onSubmit={handleSubmit}
    >
      <h1 id="login-title" className="sr-only">
        Sign in to TopGear
      </h1>

      <label htmlFor="email" className="text-sm font-medium text-[#9aa1ad]">
        Email address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Enter your email"
        className="min-h-[41px] w-full rounded-md border border-[rgba(255,179,0,0.36)] bg-[#1a1a1a] px-3.5 py-2.5 font-bold text-[#f4f6f8] placeholder:text-[#7c838d] placeholder:opacity-70 focus:border-[var(--accent)] focus:outline-[3px_solid_rgba(255,179,0,0.14)]"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />

      <label htmlFor="password" className="text-sm font-medium text-[#9aa1ad]">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        className="min-h-[41px] w-full rounded-md border border-[rgba(255,179,0,0.36)] bg-[#1a1a1a] px-3.5 py-2.5 font-bold text-[#f4f6f8] placeholder:text-[#7c838d] placeholder:opacity-70 focus:border-[var(--accent)] focus:outline-[3px_solid_rgba(255,179,0,0.14)]"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Enter your password"
        required
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2.5 min-h-11 cursor-pointer rounded-md border border-[var(--accent)] bg-[#ffad1a] font-extrabold text-black hover:not-disabled:bg-[#ffbd35] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>

      <a href="/forgot-password" className="mt-0.5 self-center text-sm font-bold text-[#ffad1a] no-underline">
        Forgot password?
      </a>
    </form>
  );
};

export default LoginForm;
