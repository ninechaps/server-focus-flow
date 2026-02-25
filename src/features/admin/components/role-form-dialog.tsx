'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl';
import type { AdminRole } from './role-tables/columns';
import { apiClient } from '@/lib/api-client';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  description: z.string().max(255).optional(),
  permissionCodes: z.array(z.string())
});

type FormValues = z.infer<typeof formSchema>;

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: AdminRole;
  allPermissions: { id: string; code: string }[];
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  allPermissions
}: RoleFormDialogProps) {
  const t = useTranslations('admin.roles.form');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!role;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      permissionCodes: []
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: role?.name ?? '',
        description: role?.description ?? '',
        permissionCodes: role?.permissions ?? []
      });
    }
  }, [open, role, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const url = isEditing
        ? `/api/admin/roles/${role.id}`
        : '/api/admin/roles';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await apiClient(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Request failed');
      }

      toast.success(isEditing ? t('updateSuccess') : t('createSuccess'));
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tCommon('somethingWentWrong')
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editTitle') : t('addTitle')}
          </DialogTitle>
        </DialogHeader>
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tCommon('name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('namePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tCommon('description')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('descriptionPlaceholder')}
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='permissionCodes'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('permissionsLabel')}</FormLabel>
                <ScrollArea className='h-48 rounded-md border p-3'>
                  <div className='space-y-2'>
                    {allPermissions.length === 0 && (
                      <p className='text-muted-foreground text-sm'>
                        {t('noPermissions')}
                      </p>
                    )}
                    {allPermissions.map((perm) => (
                      <div
                        key={perm.code}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`perm-${perm.code}`}
                          checked={field.value.includes(perm.code)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...field.value, perm.code]
                              : field.value.filter((c) => c !== perm.code);
                            field.onChange(next);
                          }}
                        />
                        <label
                          htmlFor={`perm-${perm.code}`}
                          className='cursor-pointer text-sm'
                        >
                          {perm.code}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button type='submit' disabled={submitting}>
              {submitting
                ? tCommon('saving')
                : isEditing
                  ? tCommon('update')
                  : tCommon('create')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
