'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { IconLogout, IconUser } from '@tabler/icons-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useTranslations } from 'next-intl';

export function UserNav() {
  const router = useRouter();
  const t = useTranslations('userNav');

  async function handleLogout() {
    try {
      await apiClient('/api/auth/session', { method: 'DELETE' });
      router.push('/auth/login');
    } catch {
      toast.error(t('logoutFailed'));
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>{t('account')}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href='/dashboard/profile'>
            <IconUser className='mr-2 h-4 w-4' />
            {t('profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <IconLogout className='mr-2 h-4 w-4' />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
