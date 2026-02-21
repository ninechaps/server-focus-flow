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
import type { AdminRole } from './role-tables/columns';

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

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Request failed');
      }

      toast.success(isEditing ? 'Role updated' : 'Role created');
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
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Role' : 'Add Role'}</DialogTitle>
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
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder='e.g. admin' {...field} />
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
                    placeholder='Role description...'
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
                <FormLabel>Permissions</FormLabel>
                <ScrollArea className='h-48 rounded-md border p-3'>
                  <div className='space-y-2'>
                    {allPermissions.length === 0 && (
                      <p className='text-muted-foreground text-sm'>
                        No permissions available
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
