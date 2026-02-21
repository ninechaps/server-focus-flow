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
import type { AdminPermission } from './permission-tables/columns';

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

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Request failed');
      }

      toast.success(isEditing ? 'Permission updated' : 'Permission created');
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong'
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
            {isEditing ? 'Edit Permission' : 'Add Permission'}
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
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder='e.g. admin:users:read'
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Permission description...'
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
              Cancel
            </Button>
            <Button type='submit' disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
