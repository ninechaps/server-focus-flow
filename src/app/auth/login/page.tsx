import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/features/auth/components/login-form';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  // 已登录则直接进入 dashboard，无需重新登录
  if (token) {
    redirect('/dashboard/overview');
  }

  return <LoginForm />;
}
