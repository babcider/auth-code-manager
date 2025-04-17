/**
 * 인증 코드 목록 컴포넌트
 * 인증 코드의 생성, 조회, 수정, 삭제 기능을 제공합니다.
 * 
 * 주요 기능:
 * - 코드 생성: 단일 또는 대량 생성 지원
 * - 코드 검색: 코드 또는 컨텍스트로 검색
 * - 상태 필터링: 전체/사용됨/만료됨 상태별 필터링
 * - 만료일 관리: 개별 코드의 만료일 수정
 * - 대량 작업: 선택한 코들의 일괄 삭제
 * - 데이터 관리: 코드 목록 내보내기/가져오기
 */

'use client';

import { useState } from 'react';
import { AuthCodeListProps, AuthCodeView, CodeGenerationOptions } from '@/types/auth-code';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import GenerateCodeModal from './GenerateCodeModal';
import EditCodeModal from './EditCodeModal';
import { logAudit } from '@/lib/audit';
import { toast } from 'react-hot-toast';
import { message } from 'antd';

type DbAuthCode = Database['public']['Views']['auth_code_content_details']['Row'] & {
  status: string;
};

type Status = 'active' | 'inactive' | 'expired';

const mapToAuthCodeView = (dbCode: DbAuthCode): AuthCodeView => ({
  ...dbCode,
  content: [],
  created_at: dbCode.create_time,
  updated_at: undefined,
  contents: [],
  is_used: false,
  status: dbCode.status
});

interface ExtendedAuthCodeListProps {
  initialCodes: AuthCodeView[];
}

const defaultOptions: CodeGenerationOptions = {
  key: '',
  is_active: true,
  is_unlimit: false,
};

export default function AuthCodeList({ initialCodes }: ExtendedAuthCodeListProps) {
  const [codes, setCodes] = useState<AuthCodeView[]>(initialCodes);
  const [selectedCode, setSelectedCode] = useState<AuthCodeView | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCode, setEditingCode] = useState<AuthCodeView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [options, setOptions] = useState<CodeGenerationOptions>(defaultOptions);
  const supabase = createClientComponentClient<Database>();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return '활성';
      case 'inactive':
        return '비활성';
      case 'expired':
        return '만료됨';
      default:
        return '알 수 없음';
    }
  };

  const formatDate = (date: string | undefined | null): string => {
    if (!date) return '날짜 정보 없음';
    
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
    } catch (error) {
      return '날짜 정보 없음';
    }
  };

  const handleGenerateCode = async () => {
    try {
      setIsLoading(true);
      message.loading('인증 코드를 생성하는 중입니다...', 0);

      const currentTime = new Date().toISOString();
      const expireTime = options.expire_time ? new Date(options.expire_time).toISOString() : null;

      // 1. auth_codes 테이블에 데이터 삽입
      const { data: newAuthCode, error: authCodeError } = await supabase
        .from('auth_codes')
        .insert({
          key: options.key,
          is_active: options.is_active,
          is_unlimit: options.is_unlimit,
          create_time: currentTime,
          setup_key: options.setup_key || null,
          unity_key: options.unity_key || null,
          institution_name: options.institution_name || null,
          agency: options.agency || null,
          memo: options.memo || null,
          program_update: options.program_update || null,
          local_max_count: options.local_max_count || null,
          available_apps: options.available_apps || null,
          available_contents: options.available_contents || null,
          expire_time: expireTime
        })
        .select()
        .single();

      if (authCodeError) {
        if (authCodeError.code === '23505') { // 중복 키 에러 코드
          throw new Error('이미 존재하는 인증 코드입니다.');
        }
        throw new Error(`인증 코드 생성 실패: ${authCodeError.message}`);
      }

      if (!newAuthCode?.id) {
        throw new Error('인증 코드 생성 실패: 응답 데이터가 없습니다.');
      }

      // 2. 잠시 대기하여 데이터베이스 반영 시간 확보
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. content_ids가 있는 경우, 준비된 데이터로 한 번에 삽입
      if (options.content_ids && options.content_ids.length > 0) {
        const contentData = options.content_ids.map(contentId => ({
          auth_code_id: newAuthCode.id,
          content_id: contentId,
          created_at: currentTime
        }));

        const { error: contentError } = await supabase
          .from('auth_code_contents')
          .insert(contentData);

        if (contentError) {
          // 실패 시 생성된 인증 코드 삭제
          await supabase
            .from('auth_codes')
            .delete()
            .eq('id', newAuthCode.id);
          
          throw new Error(`콘텐츠 연결 실패: ${contentError.message}`);
        }
      }

      message.destroy();
      message.success('인증 코드가 성공적으로 생성되었습니다.');
      setOptions(defaultOptions);
      setShowGenerateModal(false);
      await refreshData();

    } catch (error) {
      console.error('Error in handleGenerateCode:', error);
      message.destroy();
      message.error(error instanceof Error ? error.message : '인증 코드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCode = async (id: string, options: Partial<CodeGenerationOptions>) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('인증 세션이 만료되었습니다.');
      }

      const now = new Date().toISOString();
      const updateData = {
        ...options,
        setup_key: options.setup_key || null,
        institution_name: options.institution_name || null,
        agency: options.agency || null,
        memo: options.memo || null,
        program_update: options.program_update || null,
        local_max_count: options.local_max_count || null,
        updated_at: now,
        updated_by: session.session.user.id
      };

      const { data: updatedCode, error: updateError } = await supabase
        .from('auth_codes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // 수정된 코드로 목록 업데이트
      setCodes(codes.map(code => 
        code.id === id ? mapToAuthCodeView(updatedCode as DbAuthCode) : code
      ));

      // 감사 로그 추가
      try {
        await logAudit('update', {
          code: id,
          changes: JSON.parse(JSON.stringify(options))
        });
      } catch (error) {
        console.error('Error logging audit:', error);
      }
    } catch (error) {
      console.error('Error updating code:', error);
      alert('코드 수정 중 오류가 발생했습니다.');
    }
  };

  const refreshData = async () => {
    // Implement data refresh logic here
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">인증 코드 관리</h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          onClick={() => setShowGenerateModal(true)}
        >
          새 코드 생성
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">키</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기관명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">만료일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">실행 횟수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{code.key}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{code.institution_name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(code.status || 'inactive')}`}>
                      {getStatusText(code.status || 'inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(code.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {code.expires_at ? formatDate(code.expires_at) : '무제한'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {code.run_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedCode(code)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      상세
                    </button>
                    <button
                      onClick={() => {
                        setEditingCode(code);
                        setShowEditModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">인증 코드 상세 정보</h2>
                <button
                  onClick={() => setSelectedCode(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">키</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedCode.key}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">기관명</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedCode.institution_name || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">상태</h3>
                  <p className="mt-1 text-sm text-gray-900">{getStatusText(selectedCode.status || 'inactive')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">실행 횟수</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedCode.run_count}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">메모</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedCode.memo || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">생성자</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedCode.user_email || '-'}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">콘텐츠 목록</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedCode.content.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedCode.content.map((content) => (
                        <li key={content.id} className="text-sm text-gray-700">
                          {content.content}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">등록된 콘텐츠가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <GenerateCodeModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateCode}
      />

      <EditCodeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCode(null);
        }}
        onUpdate={handleUpdateCode}
        code={editingCode}
      />
    </div>
  );
} 