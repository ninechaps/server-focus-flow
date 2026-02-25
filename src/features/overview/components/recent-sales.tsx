import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { getTranslations } from 'next-intl/server';

interface RecentUser {
  userId: string;
  lastActiveAt: string;
  clientSource: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  userType: string;
}

interface RecentSalesProps {
  users: RecentUser[];
}

const MOCK_USERS: RecentUser[] = [
  {
    userId: '1',
    lastActiveAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    clientSource: 'macos-app',
    email: 'alice@example.com',
    fullName: 'Alice Chen',
    avatarUrl: null,
    userType: 'client'
  },
  {
    userId: '2',
    lastActiveAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    clientSource: 'web-dashboard',
    email: 'bob@example.com',
    fullName: 'Bob Smith',
    avatarUrl: null,
    userType: 'admin'
  },
  {
    userId: '3',
    lastActiveAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    clientSource: 'macos-app',
    email: 'carol@example.com',
    fullName: 'Carol Wu',
    avatarUrl: null,
    userType: 'client'
  },
  {
    userId: '4',
    lastActiveAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    clientSource: 'macos-app',
    email: 'david@example.com',
    fullName: null,
    avatarUrl: null,
    userType: 'client'
  },
  {
    userId: '5',
    lastActiveAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    clientSource: 'web-dashboard',
    email: 'eve@example.com',
    fullName: 'Eve Johnson',
    avatarUrl: null,
    userType: 'admin'
  }
];

function getInitials(name: string | null, email: string): string {
  if (name)
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

function SourceBadge({ source }: { source: string }) {
  if (source === 'macos-app') {
    return (
      <Badge variant='outline' className='text-xs'>
        macOS
      </Badge>
    );
  }
  if (source === 'web-dashboard') {
    return (
      <Badge variant='secondary' className='text-xs'>
        Web
      </Badge>
    );
  }
  return null;
}

export async function RecentSales({ users }: RecentSalesProps) {
  const t = await getTranslations('overview.recentSales');
  const displayUsers = users.length === 0 ? MOCK_USERS : users;

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {displayUsers.map((user) => (
            <div key={user.userId} className='flex items-center gap-3'>
              <Avatar className='h-9 w-9'>
                <AvatarImage
                  src={user.avatarUrl ?? undefined}
                  alt={user.fullName ?? user.email}
                  className='object-cover'
                />
                <AvatarFallback className='text-xs'>
                  {getInitials(user.fullName, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0 flex-1 space-y-0.5'>
                <p className='truncate text-sm leading-none font-medium'>
                  {user.fullName ?? user.email}
                </p>
                <p className='text-muted-foreground truncate text-xs'>
                  {user.fullName ? user.email : ''}
                </p>
              </div>
              <div className='flex flex-col items-end gap-1'>
                <SourceBadge source={user.clientSource} />
                <span className='text-muted-foreground text-xs'>
                  {formatDistanceToNow(new Date(user.lastActiveAt), {
                    addSuffix: true
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
