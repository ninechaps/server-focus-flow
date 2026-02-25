import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page() {
  const headerStore = await headers();
  const cookieStore = await cookies();

  // macOS 客户端通过 X-Client-Type 标识自己，
  // 不做 dashboard 重定向，交由客户端自行导航到注册/登录页。
  const clientType = headerStore.get('x-client-type');
  if (clientType === 'macos-app') {
    redirect('/auth/register/client');
  }

  const token = cookieStore.get('access_token')?.value;
  if (token) {
    redirect('/dashboard/overview');
  }

  redirect('/auth/login');
}
