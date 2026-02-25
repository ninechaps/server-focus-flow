'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Product } from '@/constants/data';
import { Column, ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Text, XCircle } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { CellAction } from './cell-action';
import { CATEGORY_OPTIONS } from './options';

export function useProductColumns(): ColumnDef<Product>[] {
  const t = useTranslations('products.columns');

  return [
    {
      accessorKey: 'photo_url',
      header: t('image'),
      cell: ({ row }) => {
        return (
          <div className='relative aspect-square'>
            <Image
              src={row.getValue('photo_url')}
              alt={row.getValue('name')}
              fill
              className='rounded-lg'
            />
          </div>
        );
      }
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: ({ column }: { column: Column<Product, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('name')} />
      ),
      cell: ({ cell }) => <div>{cell.getValue<Product['name']>()}</div>,
      meta: {
        label: t('name'),
        placeholder: t('namePlaceholder'),
        variant: 'text',
        icon: Text
      },
      enableColumnFilter: true
    },
    {
      id: 'category',
      accessorKey: 'category',
      header: ({ column }: { column: Column<Product, unknown> }) => (
        <DataTableColumnHeader column={column} title={t('category')} />
      ),
      cell: ({ cell }) => {
        const status = cell.getValue<Product['category']>();
        const Icon = status === 'active' ? CheckCircle2 : XCircle;

        return (
          <Badge variant='outline' className='capitalize'>
            <Icon />
            {status}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: t('category'),
        variant: 'multiSelect',
        options: CATEGORY_OPTIONS
      }
    },
    {
      accessorKey: 'price',
      header: t('price')
    },
    {
      accessorKey: 'description',
      header: t('description')
    },
    {
      id: 'actions',
      cell: ({ row }) => <CellAction data={row.original} />
    }
  ];
}
