'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthCode } from '@/types/auth-code';
import { Database } from '@/types/supabase';

type SortField = 'id' | 'institution_name' | 'agency' | 'memo' | 'is_active' | 'expire_time' | 'create_time';
type SortOrder = 'asc' | 'desc';
type StatusFilter = '전체' | '활성화' | '생성됨' | '만료됨';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [codes, setCodes] = useState<AuthCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('create_time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    checkAuthAndLoadCodes();
  }, []);

  const checkAuthAndLoadCodes = async () => {
    try {
      setError(null);
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) throw new Error('인증 세션을 확인하는 중 오류가 발생했습니다.');
      if (!session) {
        router.replace('/auth/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', session.user.id)
        .single();

      if (userError) throw new Error('사용자 정보를 확인하는 중 오류가 발생했습니다.');
      if (!userData?.is_active) {
        setError('비활성화된 계정입니다. 관리자에게 문의하세요.');
        router.replace('/auth/login');
        return;
      }

      await fetchCodes();
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCodes = async () => {
    const { data: authCodes, error: codesError } = await supabase
      .from('auth_codes')
      .select('*')
      .order('create_time', { ascending: false });

    if (codesError) {
      console.error('Codes error:', codesError);
      throw new Error('인증 코드 목록을 불러오는 중 오류가 발생했습니다.');
    }

    setCodes(authCodes || []);
  };

  const handleExpireDateClick = (code: AuthCode) => {
    if (code.expire_time) {
      // DB의 날짜를 YYYY-MM-DD 형식으로 변환
      const date = new Date(code.expire_time);
      const formattedDate = date.toISOString().split('T')[0];
      setEditDate(formattedDate);
    } else {
      setEditDate('');
    }
    setEditingId(code.id);
  };

  const handleExpireDateUpdate = async (codeId: string) => {
    if (!codeId) return;

    setUpdateLoading(true);
    try {
      // 날짜가 비어있으면 null로 설정
      const formattedDate = editDate ? `${editDate}T00:00:00+00:00` : null;
      
      const { error: updateError } = await supabase
        .from('auth_codes')
        .update({
          expire_time: formattedDate
        })
        .eq('id', codeId);

      if (updateError) {
        console.error('Update error details:', updateError);
        throw new Error(updateError.message);
      }

      await fetchCodes();
      setEditingId(null);
      setEditDate('');
    } catch (error) {
      console.error('Error updating expire date:', error);
      alert(error instanceof Error ? error.message : '만료일 수정 중 오류가 발생했습니다.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusText = (code: AuthCode) => {
    if (code.expire_time && new Date(code.expire_time) < new Date()) return '만료됨';
    return code.is_active ? '활성화' : '생성됨';
  };

  const getStatusStyle = (code: AuthCode) => {
    if (code.expire_time && new Date(code.expire_time) < new Date()) {
      return 'bg-gray-100 text-gray-800';
    }
    return code.is_active 
      ? 'bg-green-100 text-green-800 cursor-pointer hover:bg-green-200' 
      : 'bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200';
  };

  const handleStatusToggle = async (code: AuthCode) => {
    // 만료된 코드는 상태 변경 불가
    if (code.expire_time && new Date(code.expire_time) < new Date()) return;
    
    if (statusUpdateId) return; // 이미 업데이트 중이면 중복 실행 방지
    
    try {
      setStatusUpdateId(code.id);
      
      const { error: updateError } = await supabase
        .from('auth_codes')
        .update({
          is_active: !code.is_active
        })
        .eq('id', code.id);

      if (updateError) {
        console.error('Status update error:', updateError);
        throw new Error(updateError.message);
      }

      await fetchCodes();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다.');
    } finally {
      setStatusUpdateId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // 2초 후 복사 상태 초기화
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // 같은 필드를 다시 클릭하면 정렬 순서를 토글
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드를 클릭하면 해당 필드로 내림차순 정렬
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedCodes = useMemo(() => {
    let filtered = [...codes];
    
    if (statusFilter !== '전체') {
      filtered = filtered.filter(code => getStatusText(code) === statusFilter);
    }

    return filtered.sort((a, b) => {
      let compareA: string | number | boolean | null = null;
      let compareB: string | number | boolean | null = null;

      switch (sortField) {
        case 'id':
        case 'institution_name':
        case 'agency':
        case 'memo':
          compareA = a[sortField] || '';
          compareB = b[sortField] || '';
          break;
        case 'is_active':
          compareA = getStatusText(a);
          compareB = getStatusText(b);
          break;
        case 'expire_time':
        case 'create_time':
          compareA = a[sortField] ? new Date(a[sortField]).getTime() : 0;
          compareB = b[sortField] ? new Date(b[sortField]).getTime() : 0;
          break;
      }

      if (compareA === compareB) return 0;
      if (compareA === null) return 1;
      if (compareB === null) return -1;

      const comparison = compareA < compareB ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [codes, statusFilter, sortField, sortOrder]);

  const paginatedCodes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCodes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCodes, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedCodes.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 상단으로 부드럽게 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5; // 한 번에 보여줄 페이지 번호 수

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 시작 페이지 조정
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 첫 페이지 버튼
    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          className="px-3 py-1 rounded border hover:bg-gray-100"
          title="첫 페이지"
        >
          <span className="sr-only">첫 페이지</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      );
    }

    // 이전 페이지 버튼
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-1 rounded border hover:bg-gray-100"
          title="이전 페이지"
        >
          <span className="sr-only">이전 페이지</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      );
    }

    // 페이지 번호 버튼
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded border ${
            currentPage === i
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }

    // 다음 페이지 버튼
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-1 rounded border hover:bg-gray-100"
          title="다음 페이지"
        >
          <span className="sr-only">다음 페이지</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      );
    }

    // 마지막 페이지 버튼
    if (endPage < totalPages) {
      pages.push(
        <button
          key="last"
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 rounded border hover:bg-gray-100"
          title="마지막 페이지"
        >
          <span className="sr-only">마지막 페이지</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      );
    }

    return (
      <div className="flex justify-between items-center mt-4 px-4">
        <div className="text-sm text-gray-500">
          총 {filteredAndSortedCodes.length}개 중 {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, filteredAndSortedCodes.length)}개 표시
        </div>
        <div className="flex gap-2">{pages}</div>
      </div>
    );
  };

  const statistics = useMemo(() => {
    const stats = {
      total: codes.length,
      active: 0,
      created: 0,
      expired: 0
    };

    codes.forEach(code => {
      const status = getStatusText(code);
      if (status === '활성화') stats.active++;
      else if (status === '생성됨') stats.created++;
      else if (status === '만료됨') stats.expired++;
    });

    return stats;
  }, [codes]);

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">인증 코드 목록</h1>
      
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => router.push('/codes/create')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          코드 생성
        </button>
      </div>
      
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="전체">전체 상태</option>
              <option value="활성화">활성화</option>
              <option value="생성됨">생성됨</option>
              <option value="만료됨">만료됨</option>
            </select>
            <span className="text-sm text-gray-500">
              필터링된 결과: {filteredAndSortedCodes.length}개
            </span>
          </div>
          
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>활성화: {statistics.active}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>생성됨: {statistics.created}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>만료됨: {statistics.expired}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>전체: {statistics.total}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">
                <button
                  onClick={() => handleSort('id')}
                  className="flex items-center gap-1 w-full hover:bg-gray-200 px-2 py-1 rounded"
                >
                  <span>ID</span>
                  {getSortIcon('id')}
                </button>
              </th>
              <th className="px-4 py-2 border">
                <button
                  onClick={() => handleSort('institution_name')}
                  className="flex items-center gap-1 w-full hover:bg-gray-200 px-2 py-1 rounded"
                >
                  <span>기관명</span>
                  {getSortIcon('institution_name')}
                </button>
              </th>
              <th className="px-4 py-2 border">
                <button
                  onClick={() => handleSort('agency')}
                  className="flex items-center gap-1 w-full hover:bg-gray-200 px-2 py-1 rounded"
                >
                  <span>기관 구분</span>
                  {getSortIcon('agency')}
                </button>
              </th>
              <th className="px-4 py-2 border">
                <button
                  onClick={() => handleSort('memo')}
                  className="flex items-center gap-1 w-full hover:bg-gray-200 px-2 py-1 rounded"
                >
                  <span>메모</span>
                  {getSortIcon('memo')}
                </button>
              </th>
              <th className="px-4 py-2 border">
                <button
                  onClick={() => handleSort('is_active')}
                  className="flex items-center gap-1 w-full hover:bg-gray-200 px-2 py-1 rounded"
                >
                  <span>상태</span>
                  {getSortIcon('is_active')}
                </button>
              </th>
              <th className="px-4 py-2 border">
                <button
                  onClick={() => handleSort('expire_time')}
                  className="flex items-center gap-1 w-full hover:bg-gray-200 px-2 py-1 rounded"
                >
                  <span>만료일</span>
                  {getSortIcon('expire_time')}
                </button>
              </th>
              <th className="px-4 py-2 border">
                <button
                  onClick={() => handleSort('create_time')}
                  className="flex items-center gap-1 w-full hover:bg-gray-200 px-2 py-1 rounded"
                >
                  <span>생성일</span>
                  {getSortIcon('create_time')}
                </button>
              </th>
              <th className="px-4 py-2 border">수정</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCodes.map((code) => (
              <tr key={code.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{code.id}</td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => router.push(`/codes/${code.id}`)}
                    className="text-left text-blue-600 hover:underline w-full"
                  >
                    {code.institution_name || '-'}
                  </button>
                </td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => router.push(`/codes/${code.id}`)}
                    className="text-left text-blue-600 hover:underline w-full"
                  >
                    {code.agency || '-'}
                  </button>
                </td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => router.push(`/codes/${code.id}`)}
                    className="text-left text-blue-600 hover:underline w-full"
                  >
                    {code.memo || '-'}
                  </button>
                </td>
                <td className="px-4 py-2 border">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    getStatusText(code) === '활성화'
                      ? 'bg-green-100 text-green-800'
                      : getStatusText(code) === '생성됨'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusText(code)}
                  </span>
                </td>
                <td className="px-4 py-2 border">
                  {editingId === code.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => handleExpireDateUpdate(code.id)}
                        className="text-blue-600 hover:text-blue-800"
                        disabled={updateLoading}
                      >
                        {updateLoading ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleExpireDateClick(code)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {formatDate(code.expire_time)}
                    </button>
                  )}
                </td>
                <td className="px-4 py-2 border">{formatDate(code.create_time)}</td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => router.push(`/codes/${code.id}/edit`)}
                    className="text-blue-600 hover:text-blue-700"
                    title="수정"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {renderPagination()}
      </div>
    </div>
  );
} 