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
import { useTranslations } from 'next-intl';
import { encryptPassword } from '@/lib/crypto';
import { apiClient } from '@/lib/api-client';
import { PasswordInput } from '@/components/forms/password-input';

const RESEND_COUNTDOWN = 120;

type Step = 'email' | 'code' | 'password' | 'success';

interface RegisterFormProps {
  source?: 'dashboard' | 'client';
}

export function RegisterForm({ source = 'dashboard' }: RegisterFormProps) {
  const t = useTranslations('auth.register');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  // 进入验证码步骤时启动倒计时
  useEffect(() => {
    if (step !== 'code') return;
    setResendSeconds(RESEND_COUNTDOWN);
  }, [step]);

  // 倒计时 tick
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  async function sendCode(emailAddress: string) {
    setLoading(true);
    try {
      const res = await apiClient('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddress, purpose: 'register' })
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error);
        return false;
      }
      toast.success(t('codeSentToast'));
      return true;
    } catch {
      toast.error(tCommon('networkError'));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    const ok = await sendCode(email);
    if (ok) setStep('code');
  }

  async function handleResend() {
    const ok = await sendCode(email);
    if (ok) setResendSeconds(RESEND_COUNTDOWN);
  }

  function handleCodeComplete() {
    setStep('password');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        source === 'client' ? '/api/auth/register' : '/api/auth/session';
      const method = source === 'client' ? 'POST' : 'PUT';

      const encryptedPassword = await encryptPassword(password);

      const res = await apiClient(endpoint, {
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
        toast.success(t('successToast'));
        setStep('success');
      } else {
        toast.success(t('successToast'));
        router.push('/dashboard/overview');
      }
    } catch {
      toast.error(tCommon('networkError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-2xl'>{t('title')}</CardTitle>
        <CardDescription>
          {step === 'email' && t('descriptionEmail')}
          {step === 'code' && t('descriptionCode')}
          {step === 'password' && t('descriptionPassword')}
          {step === 'success' && t('descriptionSuccess')}
        </CardDescription>
      </CardHeader>

      {step === 'email' && (
        <form onSubmit={handleSendCode}>
          <CardContent className='flex flex-col gap-6'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='email'>{t('emailLabel')}</Label>
              <Input
                id='email'
                type='email'
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete='email'
                autoFocus
              />
            </div>
            <div className='flex flex-col gap-3'>
              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? t('sending') : t('sendCode')}
              </Button>
              {source !== 'client' && (
                <p className='text-muted-foreground text-center text-sm'>
                  {t('alreadyHaveAccount')}{' '}
                  <Link
                    href='/auth/login'
                    className='text-primary underline-offset-4 hover:underline'
                  >
                    {t('signIn')}
                  </Link>
                </p>
              )}
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
              <Label>{t('verificationCode')}</Label>
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
                {t('codeSentTo', { email })}
              </p>
            </div>
            <div className='flex flex-col gap-3'>
              <Button
                type='submit'
                className='w-full'
                disabled={code.length !== 6}
              >
                {t('verifyCode')}
              </Button>
              {/* 重新发送按钮 + 倒计时 */}
              <Button
                type='button'
                variant='ghost'
                className='w-full'
                disabled={resendSeconds > 0 || loading}
                onClick={handleResend}
              >
                {resendSeconds > 0
                  ? t('resendIn', { seconds: resendSeconds })
                  : t('resendCode')}
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='w-full'
                onClick={() => setStep('email')}
              >
                {tCommon('back')}
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
                <Label htmlFor='password'>{t('passwordLabel')}</Label>
                <PasswordInput
                  id='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete='new-password'
                  autoFocus
                />
                <p className='text-muted-foreground text-xs'>
                  {t('passwordHint')}
                </p>
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='confirm-password'>
                  {t('confirmPasswordLabel')}
                </Label>
                <PasswordInput
                  id='confirm-password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete='new-password'
                />
              </div>
            </div>
            <div className='flex flex-col gap-3'>
              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? t('creatingAccount') : t('createAccount')}
              </Button>
              <Button
                type='button'
                variant='ghost'
                className='w-full'
                onClick={() => setStep('code')}
              >
                {tCommon('back')}
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
  const t = useTranslations('auth.register');
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
        <p className='text-lg font-semibold'>{t('successTitle')}</p>
        <p className='text-muted-foreground mt-1 text-sm'>
          {t('successMessage')}
        </p>
      </div>
      <p className='text-muted-foreground text-sm'>
        {t('closeCountdown', { countdown })}
      </p>
      <Button variant='outline' onClick={handleClose}>
        {t('closeNow')}
      </Button>
    </CardContent>
  );
}
