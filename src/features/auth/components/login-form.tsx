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
import { encryptPassword } from '@/lib/crypto';

export function LoginForm() {
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

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, encryptedPassword, rememberMe })
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error);
        return;
      }

      toast.success('Login successful');
      router.push('/dashboard/overview');
    } catch {
      toast.error('Network error, please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-2xl'>Login</CardTitle>
        <CardDescription>
          Enter your email and password to sign in
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className='flex flex-col gap-6'>
          <div className='flex flex-col gap-4'>
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
            <div className='flex flex-col gap-2'>
              <Label htmlFor='password'>Password</Label>
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
              记住我
            </Label>
          </div>
          <div className='flex flex-col gap-3'>
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className='text-muted-foreground text-center text-sm'>
              Don&apos;t have an account?{' '}
              <Link
                href='/auth/register'
                className='text-primary underline-offset-4 hover:underline'
              >
                Register
              </Link>
            </p>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
