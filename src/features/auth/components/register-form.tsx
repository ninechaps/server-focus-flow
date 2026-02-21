'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@/components/ui/input-otp';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { encryptPassword } from '@/lib/crypto';

type Step = 'email' | 'code' | 'password' | 'success';

interface RegisterFormProps {
  source?: 'dashboard' | 'client';
}

export function RegisterForm({ source = 'dashboard' }: RegisterFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'register' })
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error);
        return;
      }

      toast.success('Verification code sent to your email');
      setStep('code');
    } catch {
      toast.error('Network error, please try again');
    } finally {
      setLoading(false);
    }
  }

  function handleCodeComplete() {
    setStep('password');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        source === 'client' ? '/api/auth/register' : '/api/auth/session';
      const method = source === 'client' ? 'POST' : 'PUT';

      const encryptedPassword = await encryptPassword(password);

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, encryptedPassword })
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error);
        return;
      }

      if (source === 'client') {
        toast.success('Registration successful');
        setStep('success');
      } else {
        toast.success('Registration successful');
        router.push('/dashboard/overview');
      }
    } catch {
      toast.error('Network error, please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-2xl'>Register</CardTitle>
        <CardDescription>
          {step === 'email' && 'Enter your email to get started'}
          {step === 'code' && 'Enter the verification code sent to your email'}
          {step === 'password' && 'Set your password to complete registration'}
          {step === 'success' && 'Your account is ready'}
        </CardDescription>
      </CardHeader>

      {step === 'email' && (
        <form onSubmit={handleSendCode}>
          <CardContent className='flex flex-col gap-6'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='name@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete='email'
                autoFocus
              />
            </div>
            <div className='flex flex-col gap-3'>
              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? 'Sending...' : 'Send Verification Code'}
              </Button>
              <p className='text-muted-foreground text-center text-sm'>
                Already have an account?{' '}
                <Link
                  href='/auth/login'
                  className='text-primary underline-offset-4 hover:underline'
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </form>
      )}

      {step === 'code' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCodeComplete();
          }}
        >
          <CardContent className='flex flex-col gap-6'>
            <div className='flex flex-col items-center gap-3'>
              <Label>Verification Code</Label>
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                onComplete={handleCodeComplete}
              >
                <InputOTPGroup className='gap-2'>
                  <InputOTPSlot index={0} className='rounded-md border' />
                  <InputOTPSlot index={1} className='rounded-md border' />
                  <InputOTPSlot index={2} className='rounded-md border' />
                  <InputOTPSlot index={3} className='rounded-md border' />
                  <InputOTPSlot index={4} className='rounded-md border' />
                  <InputOTPSlot index={5} className='rounded-md border' />
                </InputOTPGroup>
              </InputOTP>
              <p className='text-muted-foreground text-xs'>
                Code sent to {email}
              </p>
            </div>
            <div className='flex flex-col gap-3'>
              <Button
                type='submit'
                className='w-full'
                disabled={code.length !== 6}
              >
                Verify Code
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='w-full'
                onClick={() => setStep('email')}
              >
                Back
              </Button>
            </div>
          </CardContent>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handleRegister}>
          <CardContent className='flex flex-col gap-6'>
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete='new-password'
                  autoFocus
                />
                <p className='text-muted-foreground text-xs'>
                  At least 8 characters with uppercase, lowercase, and number
                </p>
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='confirm-password'>Confirm Password</Label>
                <Input
                  id='confirm-password'
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete='new-password'
                />
              </div>
            </div>
            <div className='flex flex-col gap-3'>
              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='w-full'
                onClick={() => setStep('code')}
              >
                Back
              </Button>
            </div>
          </CardContent>
        </form>
      )}

      {step === 'success' && <SuccessCountdown />}
    </Card>
  );
}

function SuccessCountdown() {
  const [countdown, setCountdown] = useState(5);

  const handleClose = useCallback(() => {
    window.close();
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      handleClose();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, handleClose]);

  return (
    <CardContent className='flex flex-col items-center gap-4 py-8'>
      <div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
        <svg
          className='h-8 w-8 text-green-600'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={2}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M5 13l4 4L19 7'
          />
        </svg>
      </div>
      <div className='text-center'>
        <p className='text-lg font-semibold'>Registration Successful</p>
        <p className='text-muted-foreground mt-1 text-sm'>
          Your account has been created. You can now log in from the app.
        </p>
      </div>
      <p className='text-muted-foreground text-sm'>
        This page will close in {countdown} seconds
      </p>
      <Button variant='outline' onClick={handleClose}>
        Close Now
      </Button>
    </CardContent>
  );
}
