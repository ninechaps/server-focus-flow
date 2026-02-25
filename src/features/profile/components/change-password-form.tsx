'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { encryptPassword } from '@/lib/crypto';
import { apiClient } from '@/lib/api-client';

export function ChangePasswordForm() {
  const t = useTranslations('profile.passwordForm');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (next !== confirm) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    setSaving(true);
    try {
      const [currentEncryptedPassword, newEncryptedPassword] =
        await Promise.all([encryptPassword(current), encryptPassword(next)]);

      const res = await apiClient('/api/auth/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentEncryptedPassword, newEncryptedPassword })
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? t('failedToast'));
        return;
      }

      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success(t('successToast'));
    } catch {
      toast.error(t('failedToast'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-1.5'>
        <Label htmlFor='current'>{t('currentPassword')}</Label>
        <Input
          id='current'
          type='password'
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='next'>{t('newPassword')}</Label>
        <Input
          id='next'
          type='password'
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <p className='text-muted-foreground text-xs'>{t('newPasswordHint')}</p>
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='confirm'>{t('confirmNewPassword')}</Label>
        <Input
          id='confirm'
          type='password'
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      <div className='flex justify-end'>
        <Button
          type='submit'
          disabled={saving || !current || !next || !confirm}
        >
          {saving ? t('updating') : t('updatePassword')}
        </Button>
      </div>
    </form>
  );
}
