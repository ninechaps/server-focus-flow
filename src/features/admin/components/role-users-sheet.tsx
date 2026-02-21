'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

interface UserEntry {
  id: string;
  email: string;
  username: string | null;
}

interface RoleUsersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: string;
  roleName: string;
}

export function RoleUsersSheet({
  open,
  onOpenChange,
  roleId,
  roleName
}: RoleUsersSheetProps) {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !roleId) return;

    setLoading(true);
    fetch(`/api/admin/roles/${roleId}/users`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => setUsers(json.data.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [open, roleId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md'>
        <SheetHeader className='px-6 pt-6 pb-4'>
          <SheetTitle>Users with this Role</SheetTitle>
          <SheetDescription>{roleName}</SheetDescription>
        </SheetHeader>
        <Separator />
        <div className='flex-1 overflow-y-auto px-6 py-4'>
          {loading ? (
            <div className='space-y-2'>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className='bg-muted h-14 animate-pulse rounded-lg'
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              No users have this role.
            </p>
          ) : (
            <div className='space-y-2'>
              {users.map((user) => (
                <div key={user.id} className='rounded-lg border p-3'>
                  <p className='text-sm font-medium'>{user.email}</p>
                  {user.username && (
                    <p className='text-muted-foreground mt-0.5 text-xs'>
                      @{user.username}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
