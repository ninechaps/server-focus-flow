'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'>;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [show, setShow] = useState(false);

    return (
      <div className='relative'>
        <Input
          {...props}
          ref={ref}
          type={show ? 'text' : 'password'}
          className={cn('pr-10', className)}
        />
        <Button
          type='button'
          variant='ghost'
          size='sm'
          tabIndex={-1}
          className='absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent'
          onClick={() => setShow((prev) => !prev)}
          aria-label={show ? '隐藏密码' : '显示密码'}
        >
          {show ? (
            <EyeOff className='text-muted-foreground size-4' />
          ) : (
            <Eye className='text-muted-foreground size-4' />
          )}
        </Button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
