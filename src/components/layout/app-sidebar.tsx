'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { navItems } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useFilteredNavItems } from '@/hooks/use-nav';
import { useTranslations } from 'next-intl';
import {
  IconChevronRight,
  IconChevronsDown,
  IconLogout,
  IconUser
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { apiClient } from '@/lib/api-client';

const NAV_KEY_MAP: Record<string, string> = {
  Dashboard: 'dashboard',
  Product: 'product',
  Kanban: 'kanban',
  Members: 'members',
  Users: 'users',
  Sessions: 'sessions',
  'API Logs': 'apiLogs',
  'Access Control': 'accessControl',
  Roles: 'roles',
  Permissions: 'permissions'
};

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen } = useMediaQuery();
  const itemsToShow = useFilteredNavItems(navItems);
  const tNav = useTranslations('nav');
  const tSidebar = useTranslations('sidebar');

  async function handleLogout() {
    await apiClient('/api/auth/session', { method: 'DELETE' });
    router.push('/auth/login');
  }

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader />
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>{tSidebar('overviewGroup')}</SidebarGroupLabel>
          <SidebarMenu>
            {itemsToShow.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={tNav(NAV_KEY_MAP[item.title] ?? item.title)}
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon />}
                        <span>
                          {tNav(NAV_KEY_MAP[item.title] ?? item.title)}
                        </span>
                        <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>
                                  {tNav(
                                    NAV_KEY_MAP[subItem.title] ?? subItem.title
                                  )}
                                </span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={tNav(NAV_KEY_MAP[item.title] ?? item.title)}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{tNav(NAV_KEY_MAP[item.title] ?? item.title)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <span className='truncate'>{tSidebar('account')}</span>
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='text-muted-foreground px-1 py-1.5 text-sm'>
                    {tSidebar('accountSettings')}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href='/dashboard/profile'>
                    <IconUser className='mr-2 h-4 w-4' />
                    {tSidebar('profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <IconLogout className='mr-2 h-4 w-4' />
                  {tSidebar('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
