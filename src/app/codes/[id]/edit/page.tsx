'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

interface InsolContent {
  id: number;
  name: string;
  app_type: number | null;
}

interface InsolApp {
  app_id: number;
  program_name: string;
}

export default function EditCodePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contents, setContents] = useState<InsolContent[]>([]);
  const [apps, setApps] = useState<InsolApp[]>([]);
  const [formData, setFormData] = useState({
    institution_name: '',
    agency: '',
    memo: '',
    expire_time: '',
    is_unlimit: false,
    local_max_count: '',
    selectedApps: [] as number[],
    selectedContents: [] as number[]
  });

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      // 인증 코드 정보 조회
      const { data: authCodeData, error: authCodeError } = await supabase
        .from('auth_codes')
        .select('*')
        .eq('key', params.id)
        .single();

      if (authCodeError) throw authCodeError;

      // 선택된 앱 조회
      const { data: appData, error: appError } = await supabase
        .from('auth_code_apps')
        .select('app_id')
        .eq('auth_code_id', authCodeData.id);

      if (appError) throw appError;

      // 선택된 콘텐츠 조회
      const { data: contentData, error: contentError } = await supabase
        .from('auth_code_contents')
        .select('content_id')
        .eq('auth_code_id', authCodeData.id);

      if (contentError) throw contentError;

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

      // 폼 데이터 설정
      setFormData({
        institution_name: authCodeData.institution_name || '',
        agency: authCodeData.agency || '',
        memo: authCodeData.memo || '',
        expire_time: authCodeData.expire_time ? authCodeData.expire_time.split('T')[0] : '',
        is_unlimit: authCodeData.is_unlimit,
        local_max_count: authCodeData.local_max_count?.toString() || '',
        selectedApps: appData.map(item => item.app_id).filter((id): id is number => id !== null),
        selectedContents: contentData.map(item => parseInt(item.content_id)).filter((id): id is number => !isNaN(id))
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
      router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 먼저 현재 auth_code의 id를 가져옵니다
      const { data: authCodeData, error: authCodeError } = await supabase
        .from('auth_codes')
        .select('id')
        .eq('key', params.id)
        .single();

      if (authCodeError) throw authCodeError;

      const authCodeId = authCodeData.id;

      // 인증 코드 정보 업데이트
      const { error: updateError } = await supabase
        .from('auth_codes')
        .update({
          institution_name: formData.institution_name || null,
          agency: formData.agency || null,
          memo: formData.memo || null,
          expire_time: formData.expire_time ? `${formData.expire_time}T00:00:00+00:00` : null,
          is_unlimit: formData.is_unlimit,
          local_max_count: formData.local_max_count ? parseInt(formData.local_max_count) : null,
        })
        .eq('key', params.id);

      if (updateError) throw updateError;

      // 기존 앱 관계 삭제
      const { error: deleteAppError } = await supabase
        .from('auth_code_apps')
        .delete()
        .eq('auth_code_id', authCodeId);

      if (deleteAppError) throw deleteAppError;

      // 새로운 앱 관계 생성
      if (formData.selectedApps.length > 0) {
        const appRelations = formData.selectedApps.map(appId => ({
          auth_code_id: authCodeId,
          app_id: appId
        }));

        const { error: appRelationError } = await supabase
          .from('auth_code_apps')
          .insert(appRelations);

        if (appRelationError) throw appRelationError;
      }

      // 기존 콘텐츠 관계 삭제
      const { error: deleteContentError } = await supabase
        .from('auth_code_contents')
        .delete()
        .eq('auth_code_id', authCodeId);

      if (deleteContentError) throw deleteContentError;

      // 새로운 콘텐츠 관계 생성
      if (formData.selectedContents.length > 0) {
        const contentRelations = formData.selectedContents.map(contentId => ({
          auth_code_id: authCodeId,
          content_id: contentId.toString()
        }));

        const { error: contentRelationError } = await supabase
          .from('auth_code_contents')
          .insert(contentRelations);

        if (contentRelationError) throw contentRelationError;
      }

      router.push(`/codes/${params.id}`);
    } catch (error) {
      console.error('Error updating code:', error);
      alert(error instanceof Error ? error.message : '코드 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'is_unlimit') {
        setFormData(prev => ({
          ...prev,
          [name]: (e.target as HTMLInputElement).checked
        }));
      } else if (name.startsWith('app_')) {
        const appId = parseInt(name.replace('app_', ''));
        setFormData(prev => ({
          ...prev,
          selectedApps: (e.target as HTMLInputElement).checked
            ? [...prev.selectedApps, appId]
            : prev.selectedApps.filter(id => id !== appId)
        }));
      } else if (name.startsWith('content_')) {
        const contentId = parseInt(name.replace('content_', ''));
        setFormData(prev => ({
          ...prev,
          selectedContents: (e.target as HTMLInputElement).checked
            ? [...prev.selectedContents, contentId]
            : prev.selectedContents.filter(id => id !== contentId)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">인증 코드 수정</h1>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="institution_name" className="block text-sm font-medium text-gray-700 mb-1">
                기관명
              </label>
              <input
                type="text"
                id="institution_name"
                name="institution_name"
                value={formData.institution_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="agency" className="block text-sm font-medium text-gray-700 mb-1">
                기관 구분
              </label>
              <input
                type="text"
                id="agency"
                name="agency"
                value={formData.agency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
                메모
              </label>
              <textarea
                id="memo"
                name="memo"
                value={formData.memo}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="expire_time" className="block text-sm font-medium text-gray-700 mb-1">
                만료일
              </label>
              <input
                type="date"
                id="expire_time"
                name="expire_time"
                value={formData.expire_time}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_unlimit"
                name="is_unlimit"
                checked={formData.is_unlimit}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_unlimit" className="text-sm font-medium text-gray-700">
                무제한 사용
              </label>
            </div>

            <div>
              <label htmlFor="local_max_count" className="block text-sm font-medium text-gray-700 mb-1">
                최대 실행 횟수
              </label>
              <input
                type="number"
                id="local_max_count"
                name="local_max_count"
                value={formData.local_max_count}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={formData.is_unlimit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용 가능한 앱 및 콘텐츠
              </label>
              <div className="space-y-4">
                {apps.map(app => {
                  const appContents = contents.filter(content => 
                    content.app_type === app.app_id
                  );
                  const isAppSelected = formData.selectedApps.includes(app.app_id);

                  return (
                    <div key={app.app_id} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b">
                        <input
                          type="checkbox"
                          id={`app_${app.app_id}`}
                          name={`app_${app.app_id}`}
                          checked={isAppSelected}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`app_${app.app_id}`} className="flex-1 text-sm font-medium text-gray-700">
                          {app.program_name}
                        </label>
                        {appContents.length > 0 && (
                          <span className="text-xs text-gray-500">
                            콘텐츠 {appContents.length}개
                          </span>
                        )}
                      </div>
                      
                      {isAppSelected && appContents.length > 0 && (
                        <div className="p-2 space-y-1 bg-white">
                          {appContents.map(content => (
                            <div key={content.id} className="flex items-center gap-2 pl-8 py-1">
                              <input
                                type="checkbox"
                                id={`content_${content.id}`}
                                name={`content_${content.id}`}
                                checked={formData.selectedContents.includes(content.id)}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`content_${content.id}`} className="text-sm text-gray-700">
                                {content.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {isAppSelected && appContents.length === 0 && (
                        <div className="p-3 text-center text-sm text-gray-500 bg-white">
                          사용 가능한 콘텐츠가 없습니다.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 