'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

interface AuthCode {
  id: string;
  key: string;
  setup_key: string | null;
  unity_key: string | null;
  institution_name: string | null;
  agency: string | null;
  memo: string | null;
  expire_time: string | null;
  is_active: boolean;
  is_unlimit: boolean;
  local_max_count: number | null;
  create_time: string;
  start_time: string | null;
  last_check_time: string | null;
  last_check_ip: string | null;
  run_count: number | null;
}

interface InsolApp {
  app_id: number;
  program_name: string;
}

interface InsolContent {
  id: number;
  name: string;
  app_type: number | null;
}

export default function CodeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [loading, setLoading] = useState(true);
  const [authCode, setAuthCode] = useState<AuthCode | null>(null);
  const [apps, setApps] = useState<InsolApp[]>([]);
  const [contents, setContents] = useState<InsolContent[]>([]);
  const [selectedApps, setSelectedApps] = useState<number[]>([]);
  const [selectedContents, setSelectedContents] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      // 인증 코드 정보 조회
      const { data: authCodeData, error: authCodeError } = await supabase
        .from('auth_codes')
        .select('*')
        .eq('id', params.id)
        .single();

      if (authCodeError) throw authCodeError;
      setAuthCode({
        ...authCodeData,
        create_time: authCodeData.created_at
      });

      // 선택된 앱 조회
      const { data: appData, error: appError } = await supabase
        .from('auth_code_apps')
        .select('app_id')
        .eq('auth_code_id', params.id);

      if (appError) throw appError;
      setSelectedApps(appData.map(item => item.app_id).filter((id): id is number => id !== null));

      // 선택된 콘텐츠 조회
      const { data: contentData, error: contentError } = await supabase
        .from('auth_code_contents')
        .select('content_id')
        .eq('auth_code_id', params.id);

      if (contentError) throw contentError;
      setSelectedContents(
        contentData
          .map(item => parseInt(item.content_id))
          .filter((id): id is number => !isNaN(id))
      );

      // 전체 앱 목록 조회
      const { data: allApps, error: allAppsError } = await supabase
        .from('insol_apps')
        .select('*')
        .order('app_id');

      if (allAppsError) throw allAppsError;
      setApps(allApps);

      // 전체 콘텐츠 목록 조회
      const { data: allContents, error: allContentsError } = await supabase
        .from('insol_contents')
        .select('*')
        .order('name');

      if (allContentsError) throw allContentsError;
      
      // app_type을 숫자로 변환
      const contentsWithNumericAppType = allContents?.map(content => ({
        ...content,
        app_type: content.app_type ? parseInt(content.app_type) : null
      })) || [];

      setContents(contentsWithNumericAppType);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
      router.push('/');
    }
  };

  const handleEdit = () => {
    router.push(`/codes/${params.id}/edit`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!authCode) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">인증 코드를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">인증 코드 상세 정보</h1>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              수정
            </button>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="grid grid-cols-2 gap-4 p-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">기관명</dt>
                  <dd className="mt-1">{authCode.institution_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">기관 구분</dt>
                  <dd className="mt-1">{authCode.agency}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">메모</dt>
                  <dd className="mt-1">{authCode.memo || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">만료일</dt>
                  <dd className="mt-1">{authCode.expire_time ? formatDate(authCode.expire_time) : '무제한'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">최대 실행 횟수</dt>
                  <dd className="mt-1">{authCode.is_unlimit ? '무제한' : authCode.local_max_count}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">사용 현황</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">상태</dt>
                  <dd className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      authCode.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {authCode.is_active ? '활성화' : '비활성화'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">생성일</dt>
                  <dd className="mt-1">{formatDate(authCode.create_time)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">시작일</dt>
                  <dd className="mt-1">{formatDate(authCode.start_time)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">마지막 확인</dt>
                  <dd className="mt-1">{formatDate(authCode.last_check_time)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">실행 횟수</dt>
                  <dd className="mt-1">{authCode.run_count}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="border-t">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">사용 가능한 앱 및 콘텐츠</h2>
              <div className="space-y-4">
                {apps.filter(app => selectedApps.includes(app.app_id)).map(app => {
                  const appContents = contents.filter(content => 
                    content.app_type === app.app_id && selectedContents.includes(content.id)
                  );

                  return (
                    <div key={app.app_id} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b">
                        <span className="flex-1 font-medium">{app.program_name}</span>
                        {appContents.length > 0 && (
                          <span className="text-xs text-gray-500">
                            콘텐츠 {appContents.length}개
                          </span>
                        )}
                      </div>
                      
                      {appContents.length > 0 ? (
                        <div className="p-2 space-y-1">
                          {appContents.map(content => (
                            <div key={content.id} className="pl-8 py-1">
                              <span className="text-sm text-gray-700">{content.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-sm text-gray-500">
                          사용 가능한 콘텐츠가 없습니다.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">인증 키</h2>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">인증 키</dt>
                  <dd className="mt-1 font-mono bg-gray-50 p-2 rounded">{authCode.key}</dd>
                </div>
                {authCode.setup_key && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">설치 키</dt>
                    <dd className="mt-1 font-mono bg-gray-50 p-2 rounded">{authCode.setup_key}</dd>
                  </div>
                )}
                {authCode.unity_key && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Unity 키</dt>
                    <dd className="mt-1 font-mono bg-gray-50 p-2 rounded">{authCode.unity_key}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 