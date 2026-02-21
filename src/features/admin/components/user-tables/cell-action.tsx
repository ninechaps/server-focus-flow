'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { IconDotsVertical, IconEye, IconShield } from '@tabler/icons-react';
import { useState } from 'react';
import { UserDetailDialog } from '../user-detail-dialog';
import { UserAssignRolesDialog } from '../user-assign-roles-dialog';
import type { AdminUser } from './columns';

interface CellActionProps {
  data: AdminUser;
  canAssignRoles: boolean;
}

export function CellAction({ data, canAssignRoles }: CellActionProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [rolesOpen, setRolesOpen] = useState(false);

  return (
    <>
      <UserDetailDialog
        user={data}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      {canAssignRoles && (
        <UserAssignRolesDialog
          open={rolesOpen}
          onOpenChange={setRolesOpen}
          userId={data.id}
          userEmail={data.email}
        />
      )}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setDetailOpen(true)}>
            <IconEye className='mr-2 h-4 w-4' /> View Details
          </DropdownMenuItem>
          {canAssignRoles && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRolesOpen(true)}>
                <IconShield className='mr-2 h-4 w-4' /> Assign Roles
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
