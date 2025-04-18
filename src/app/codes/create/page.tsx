'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';

interface InsolContent {
  id: number;
  name: string;
  app_type: number | null;
}

interface InsolApp {
  app_id: number;
  program_name: string;
}

export default function CreateCodePage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [loading, setLoading] = useState(false);
  const [contents, setContents] = useState<InsolContent[]>([]);
  const [apps, setApps] = useState<InsolApp[]>([]);
  const [filteredContents, setFilteredContents] = useState<InsolContent[]>([]);
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
    fetchContents();
    fetchApps();
  }, []);

  // 선택된 앱이 변경될 때마다 콘텐츠 필터링
  useEffect(() => {
    if (formData.selectedApps.length === 0) {
      setFilteredContents([]);
      // 앱이 선택되지 않았을 때는 선택된 콘텐츠도 초기화
      setFormData(prev => ({
        ...prev,
        selectedContents: []
      }));
    } else {
      const filtered = contents.filter(content => 
        content.app_type !== null && formData.selectedApps.includes(content.app_type)
      );
      setFilteredContents(filtered);
      // 필터링된 콘텐츠 목록에 없는 선택된 콘텐츠 제거
      const validContentIds = filtered.map(c => c.id);
      setFormData(prev => ({
        ...prev,
        selectedContents: prev.selectedContents.filter(id => validContentIds.includes(id))
      }));
    }
  }, [formData.selectedApps, contents]);

  const fetchApps = async () => {
    try {
      const { data, error } = await supabase
        .from('insol_apps')
        .select('app_id, program_name')
        .order('app_id');

      if (error) throw error;
      setApps(data || []);
    } catch (error) {
      console.error('Error fetching apps:', error);
      alert('앱 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('insol_contents')
        .select('id, name, app_type')
        .order('name');

      if (error) throw error;

      // app_type을 숫자로 변환
      const contentsWithNumericAppType = data?.map(content => ({
        ...content,
        app_type: content.app_type ? parseInt(content.app_type) : null
      })) || [];

      setContents(contentsWithNumericAppType);
    } catch (error) {
      console.error('Error fetching contents:', error);
      alert('콘텐츠 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) throw new Error('인증 세션을 확인하는 중 오류가 발생했습니다.');
      if (!session) {
        router.replace('/auth/login');
        return;
      }

      const newCodeId = uuidv4();
      const newKey = uuidv4();

      // 저장 프로시저 호출
      const { data: result, error: procedureError } = await supabase
        .rpc('create_auth_code_with_contents', {
          auth_code_data: {
            key: newKey,
            is_active: true,
            is_unlimit: formData.is_unlimit,
            local_max_count: formData.local_max_count ? parseInt(formData.local_max_count) : null,
            expire_time: formData.expire_time ? new Date(formData.expire_time).toISOString() : null,
            institution_name: formData.institution_name || null,
            agency: formData.agency || null,
            memo: formData.memo || null,
            setup_key: null,
            unity_key: null,
            program_update: null,
            available_apps: formData.selectedApps.length > 0 ? JSON.stringify(formData.selectedApps) : null,
            available_contents: formData.selectedContents.length > 0 ? JSON.stringify(formData.selectedContents) : null
          },
          content_ids: formData.selectedContents.map(id => id.toString())
        });

      if (procedureError) {
        throw new Error(`인증 코드 생성 실패: ${procedureError.message}`);
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error creating code:', error);
      alert(error instanceof Error ? error.message : '코드 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
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

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">인증 코드 생성</h1>
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
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? '생성 중...' : '생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 