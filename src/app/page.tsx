import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import AuthCodeList from '@/components/AuthCodeList';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });

  const { data, error } = await supabase
    .from('auth_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching initial codes:', error);
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">인증 코드 관리</h1>
      <AuthCodeList initialCodes={data || []} />
    </main>
  );
} 