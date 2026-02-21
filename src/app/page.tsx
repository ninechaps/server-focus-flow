import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (token) {
    redirect('/dashboard/overview');
  } else {
    redirect('/auth/login');
  }
}
