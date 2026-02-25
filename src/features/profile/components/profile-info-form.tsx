'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';

interface ProfileInfoFormProps {
  userId: string;
  initialFullName: string | null;
  initialUsername: string | null;
  onUpdated: (data: {
    fullName: string | null;
    username: string | null;
  }) => void;
}

export function ProfileInfoForm({
  initialFullName,
  initialUsername,
  onUpdated
}: ProfileInfoFormProps) {
  const t = useTranslations('profile.infoForm');
  const tCommon = useTranslations('common');
  const [fullName, setFullName] = useState(initialFullName ?? '');
  const [username, setUsername] = useState(initialUsername ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim() || null,
          username: username.trim() || null
        })
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? t('updateFailed'));
        return;
      }

      onUpdated({
        fullName: json.data.user.fullName,
        username: json.data.user.username
      });
      toast.success(t('updateSuccess'));
    } catch {
      toast.error(t('updateFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label htmlFor='fullName'>{t('fullNameLabel')}</Label>
          <Input
            id='fullName'
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t('fullNamePlaceholder')}
            maxLength={255}
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='username'>{t('usernameLabel')}</Label>
          <Input
            id='username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('usernamePlaceholder')}
            maxLength={100}
          />
        </div>
      </div>
      <div className='flex justify-end'>
        <Button type='submit' disabled={saving}>
          {saving ? tCommon('saving') : t('saveChanges')}
        </Button>
      </div>
    </form>
  );
}
