import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function HomePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (token) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
