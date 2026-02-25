'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { IconLanguage } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { setLocale } from '@/i18n/actions';

const LOCALES = [
  { value: 'zh', label: '简体中文' },
  { value: 'en', label: 'English' }
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: string) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='secondary'
          size='icon'
          className='size-8'
          disabled={isPending}
          aria-label='Switch language'
        >
          <IconLanguage className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {LOCALES.map(({ value, label }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => handleSelect(value)}
            className={locale === value ? 'font-semibold' : ''}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
