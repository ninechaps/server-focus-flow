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
import { useTranslations } from 'next-intl';
import type { AdminPermission } from './permission-tables/columns';
import { apiClient } from '@/lib/api-client';

const formSchema = z.object({
  code: z.string().min(1, 'Code is required').max(100),
  description: z.string().max(255).optional()
});

type FormValues = z.infer<typeof formSchema>;

interface PermissionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission?: AdminPermission;
}

export function PermissionFormDialog({
  open,
  onOpenChange,
  permission
}: PermissionFormDialogProps) {
  const t = useTranslations('admin.permissions.form');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!permission;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      description: ''
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        code: permission?.code ?? '',
        description: permission?.description ?? ''
      });
    }
  }, [open, permission, form]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const url = isEditing
        ? `/api/admin/permissions/${permission.id}`
        : '/api/admin/permissions';
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
      <DialogContent className='max-w-md'>
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
            name='code'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('code')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('codePlaceholder')}
                    className='font-mono'
                    {...field}
                  />
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
