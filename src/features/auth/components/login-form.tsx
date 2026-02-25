'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function LoginForm() {
  const t = useTranslations('auth.login');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const encryptedPassword = await encryptPassword(password);

      const res = await apiClient('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, encryptedPassword, rememberMe })
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error);
        return;
      }

      toast.success(t('successToast'));
      router.push('/dashboard/overview');
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
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className='flex flex-col gap-6'>
          <div className='flex flex-col gap-4'>
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
            <div className='flex flex-col gap-2'>
              <Label htmlFor='password'>{t('passwordLabel')}</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete='current-password'
              />
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Checkbox
              id='rememberMe'
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <Label htmlFor='rememberMe' className='cursor-pointer text-sm'>
              {t('rememberMe')}
            </Label>
          </div>
          <div className='flex flex-col gap-3'>
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? t('signingIn') : t('signIn')}
            </Button>
            <p className='text-muted-foreground text-center text-sm'>
              {t('noAccount')}{' '}
              <Link
                href='/auth/register'
                className='text-primary underline-offset-4 hover:underline'
              >
                {t('register')}
              </Link>
            </p>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
