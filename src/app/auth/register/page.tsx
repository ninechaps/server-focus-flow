import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/features/auth/components/register-form';

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  // 已登录则直接进入 dashboard，无需重新注册
  if (token) {
    redirect('/dashboard/overview');
  }

  return <RegisterForm />;
}
