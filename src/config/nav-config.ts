import { NavItem } from '@/types';

/**
 * Navigation configuration
 * Used by sidebar and Cmd+K bar.
 */
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Product',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: []
  },
  {
    title: 'Kanban',
    url: '/dashboard/kanban',
    icon: 'kanban',
    shortcut: ['k', 'k'],
    isActive: false,
    items: []
  },
  {
    title: 'Members',
    url: '#',
    icon: 'teams',
    isActive: true,
    access: { permission: 'admin:users:read' },
    items: [
      {
        title: 'Users',
        shortcut: ['a', 'u'],
        url: '/dashboard/admin/users',
        icon: 'user'
      },
      {
        title: 'Sessions',
        shortcut: ['s', 's'],
        url: '/dashboard/sessions',
        icon: 'laptop'
      }
    ]
  },
  {
    title: 'Access Control',
    url: '#',
    icon: 'shield',
    isActive: false,
    access: { permission: 'admin:users:read' },
    items: [
      {
        title: 'Roles',
        shortcut: ['r', 'r'],
        url: '/dashboard/admin/roles',
        icon: 'pro'
      },
      {
        title: 'Permissions',
        shortcut: ['p', 'm'],
        url: '/dashboard/admin/permissions',
        icon: 'key'
      }
    ]
  }
];
