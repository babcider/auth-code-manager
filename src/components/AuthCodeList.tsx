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

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useNotification } from '@/contexts/NotificationContext';
import { generateCode, calculateExpiryDate } from '@/lib/auth-code';
import { CodeGenerationOptions, DEFAULT_GENERATION_OPTIONS } from '@/types/auth-code';
import GenerateCodeModal from './GenerateCodeModal';
import { logAudit } from '@/lib/audit'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ko } from 'date-fns/locale'
import { format } from 'date-fns'
import { Pencil as PencilIcon } from 'lucide-react'

interface AuthCode {
  id: string;
  code: string;
  created_at: string;
  expires_at: string | null;
  expiry_date: string | null;
  is_used: boolean;
  context: string;
  status?: 'active' | 'used' | 'expired';
}

interface SearchResult {
  total_count: number;
  filtered_count: number;
  codes: AuthCode[];
}

interface AuthCodeListProps {
  initialCodes?: AuthCode[]
}

interface Stats {
  total: number
  active: number
  used: number
  expired: number
}

export default function AuthCodeList({ initialCodes = [] }: AuthCodeListProps) {
  // 상태 관리
  const [codes, setCodes] = useState<AuthCode[]>(initialCodes)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'used' | 'expired'>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [editingExpiry, setEditingExpiry] = useState<string | null>(null)
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    used: 0,
    expired: 0
  })

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filteredCount, setFilteredCount] = useState(0)
  const itemsPerPage = 10

  // Supabase 클라이언트 및 알림 컨텍스트
  const supabase = createClientComponentClient()
  const notification = useNotification()

  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editingContext, setEditingContext] = useState<string | null>(null)
  const [newContext, setNewContext] = useState<string>('')
  const [sortField, setSortField] = useState<keyof AuthCode>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * 코드 목록을 조회합니다.
   * 검색어, 상태 필터, 페이지네이션을 적용하여 데이터를 가져옵니다.
   */
  const fetchCodes = async () => {
    try {
      setIsGenerating(true);
      console.log('Fetching codes with params:', {
        searchTerm,
        statusFilter,
        currentPage,
        itemsPerPage
      });

      // 전체 데이터 조회를 위한 쿼리
      let statsQuery = supabase
        .from('auth_codes')
        .select('*');

      // 검색 조건 적용
      if (searchTerm) {
        statsQuery = statsQuery.or(`code.ilike.%${searchTerm}%,context.ilike.%${searchTerm}%`);
      }

      // 상태 필터 적용
      if (statusFilter !== 'all') {
        if (statusFilter === 'used') {
          statsQuery = statsQuery.eq('is_used', true);
        } else if (statusFilter === 'expired') {
          statsQuery = statsQuery.eq('is_used', false).lt('expires_at', new Date().toISOString());
        } else if (statusFilter === 'active') {
          statsQuery = statsQuery.eq('is_used', false).gt('expires_at', new Date().toISOString());
        }
      }

      // 페이지네이션을 위한 쿼리
      let pageQuery = supabase
        .from('auth_codes')
        .select('*', { count: 'exact' });

      // 동일한 검색 조건 적용
      if (searchTerm) {
        pageQuery = pageQuery.or(`code.ilike.%${searchTerm}%,context.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'used') {
          pageQuery = pageQuery.eq('is_used', true);
        } else if (statusFilter === 'expired') {
          pageQuery = pageQuery.eq('is_used', false).lt('expires_at', new Date().toISOString());
        } else if (statusFilter === 'active') {
          pageQuery = pageQuery.eq('is_used', false).gt('expires_at', new Date().toISOString());
        }
      }

      // 페이지네이션 적용
      const { count } = await pageQuery;
      pageQuery = pageQuery
        .order('created_at', { ascending: false })
        .range(startIndex, endIndex - 1);

      // 두 쿼리 동시 실행
      const [statsResult, pageResult] = await Promise.all([
        statsQuery,
        pageQuery
      ]);

      if (statsResult.error || pageResult.error) {
        throw statsResult.error || pageResult.error;
      }

      // 전체 데이터로 통계 계산
      const allCodes = statsResult.data || [];
      const active = allCodes.filter(code => 
        !code.is_used && 
        code.expires_at && 
        new Date(code.expires_at) > new Date()
      ).length;
      const used = allCodes.filter(code => code.is_used).length;
      const expired = allCodes.filter(code => 
        !code.is_used && 
        code.expires_at && 
        new Date(code.expires_at) <= new Date()
      ).length;

      // 현재 페이지 데이터 설정
      setCodes(pageResult.data || []);
      setTotalCount(allCodes.length);
      setFilteredCount(count || 0);

      // 통계 정보 업데이트
      setStats({
        total: allCodes.length,
        active,
        used,
        expired
      });
    } catch (error) {
      console.error('Error fetching codes:', error);
      notification.showNotification('error', '인증 코드 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 새로운 인증 코드를 생성합니다.
   * 대문자, 소문자, 숫자를 조합하여 코드를 생성할 수 있습니다.
   */
  const handleGenerateCode = async (options: CodeGenerationOptions) => {
    try {
      const codes = [];
      for (let i = 0; i < options.count; i++) {
        const code = generateCode(options);
        codes.push({
          code,
          expires_at: options.expiryDate?.toISOString() || null,
          is_used: false,
          context: ''
        });
      }

      const { error } = await supabase
        .from('auth_codes')
        .insert(codes);

      if (error) {
        console.error('Error details:', error);
        throw error;
      }

      await logAudit('create', {
        count: options.count,
        codes: codes.map(code => code.code)
      });

      notification.showNotification('success', `${options.count}개의 인증 코드가 생성되었습니다.`);
      setShowGenerateModal(false);
      fetchCodes();
    } catch (error) {
      console.error('Error generating codes:', error);
      notification.showNotification('error', '인증 코드 생성 중 오류가 발생했습니다.');
    }
  };

  const getCodeStatus = (code: AuthCode) => {
    if (code.is_used) return { text: '사용됨', className: 'bg-red-100 text-red-800' };
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return { text: '만료됨', className: 'bg-gray-100 text-gray-800' };
    }
    return { text: '활성', className: 'bg-green-100 text-green-800' };
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleStatusToggle = async (code: AuthCode) => {
    try {
      setLoadingId(code.id);
      const { error } = await supabase
        .from('auth_codes')
        .update({ is_used: !code.is_used })
        .eq('id', code.id);

      if (error) throw error;

      await logAudit('update', {
        code: code.code,
        field: 'is_used',
        oldValue: code.is_used,
        newValue: !code.is_used
      });

      notification.showNotification('success', `인증 코드 상태가 ${!code.is_used ? '사용됨' : '미사용'}으로 변경되었습니다.`);
      fetchCodes();
    } catch (error) {
      console.error('Error updating code status:', error);
      notification.showNotification('error', '인증 코드 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleContextUpdate = async (code: AuthCode, newContext: string) => {
    try {
      setLoadingId(code.id);
      const { error } = await supabase
        .from('auth_codes')
        .update({ context: newContext })
        .eq('id', code.id);

      if (error) throw error;
      await logAudit('update', {
        code: code.code,
        old_context: code.context,
        new_context: newContext
      });
      notification.showNotification('success', '컨텍스트가 업데이트되었습니다.');
      setEditingContext(null);
      setNewContext('');
      fetchCodes();
    } catch (error) {
      console.error('Error updating context:', error);
      notification.showNotification('error', '컨텍스트 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (code: AuthCode) => {
    try {
      setLoadingId(code.id);
      const { error } = await supabase
        .from('auth_codes')
        .delete()
        .eq('id', code.id);

      if (error) throw error;
      await logAudit('delete', {
        code: code.code
      })
      notification.showNotification('success', '인증 코드가 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting code:', error);
      notification.showNotification('error', '코드 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setIsGenerating(true);
      const { error } = await supabase
        .from('auth_codes')
        .delete()
        .in('id', selectedCodes);

      if (error) throw error;
      await logAudit('bulk_delete', {
        count: selectedCodes.length,
        codes: codes.filter(code => selectedCodes.includes(code.id)).map(code => code.code)
      });
      notification.showNotification('success', `${selectedCodes.length}개의 인증 코드가 삭제되었습니다.`);
      setSelectedCodes([]);
      fetchCodes();
    } catch (error) {
      console.error('Error deleting codes:', error);
      notification.showNotification('error', '코드 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExpiryDateChange = async (code: AuthCode, newDate: Date | null) => {
    try {
      setLoadingId(code.id);
      const { error } = await supabase
        .from('auth_codes')
        .update({ 
          expires_at: newDate?.toISOString() || null
        })
        .eq('id', code.id);

      if (error) throw error;

      await logAudit('update', {
        code: code.code,
        field: 'expires_at',
        oldValue: code.expires_at,
        newValue: newDate?.toISOString() || null
      });

      await fetchCodes();
      notification.showNotification('success', '만료일이 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('Error updating expiry date:', error);
      notification.showNotification('error', '만료일 수정 중 오류가 발생했습니다.');
    } finally {
      setLoadingId(null);
    }
  };

  const exportCodes = () => {
    const dataStr = JSON.stringify(codes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'auth_codes.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importCodes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedCodes = JSON.parse(text);
      
      if (!Array.isArray(importedCodes)) {
        throw new Error('유효하지 않은 파일 형식입니다.');
      }

      setIsGenerating(true);
      const { error } = await supabase
        .from('auth_codes')
        .insert(importedCodes.map(code => ({
          code: code.code,
          expires_at: code.expires_at,
          is_used: code.is_used,
          context: code.context
        })));

      if (error) throw error;
      notification.showNotification('success', '코드가 성공적으로 가져와졌습니다.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error importing codes:', error);
      notification.showNotification('error', '코드 가져오기에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allCodeIds = codes.map(code => code.id);
      setSelectedCodes(allCodeIds);
    } else {
      setSelectedCodes([]);
    }
  };

  const handleCodeSelection = (codeId: string, checked: boolean) => {
    if (checked) {
      setSelectedCodes(prev => [...prev, codeId]);
    } else {
      setSelectedCodes(prev => prev.filter(id => id !== codeId));
    }
  };

  const handleSort = (field: keyof AuthCode) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedCodes = (codes: AuthCode[]) => {
    return [...codes].sort((a, b) => {
      if (sortField === 'created_at' || sortField === 'expires_at') {
        const dateA = new Date(a[sortField] || '');
        const dateB = new Date(b[sortField] || '');
        return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }
      
      const valueA = String(a[sortField] || '');
      const valueB = String(b[sortField] || '');
      return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    });
  };

  const filteredCodes = codes;
  const totalPages = Math.ceil(filteredCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCodes = getSortedCodes(filteredCodes);

  useEffect(() => {
    const active = codes.filter(code => 
      !code.is_used && 
      code.expires_at && 
      new Date(code.expires_at) > new Date()
    ).length;
    
    const used = codes.filter(code => code.is_used).length;
    
    const expired = codes.filter(code => 
      !code.is_used && 
      code.expires_at && 
      new Date(code.expires_at) <= new Date()
    ).length;

    setStats({
      total: codes.length,
      active,
      used,
      expired
    });
  }, [codes]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">전체 코드</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">활성 코드</div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">사용된 코드</div>
          <div className="text-2xl font-bold text-red-600">{stats.used}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">만료된 코드</div>
          <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="코드 또는 컨텍스트 검색..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as any)}
          className="border rounded p-2"
        >
          <option value="active">활성 코드</option>
          <option value="all">모든 코드</option>
          <option value="used">사용된 코드</option>
          <option value="expired">만료된 코드</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGenerateModal(true)}
          disabled={loadingId !== null}
        >
          코드 생성
        </Button>
        <Button onClick={exportCodes} disabled={isGenerating}>
          내보내기
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={importCodes}
          accept=".json"
          style={{ display: 'none' }}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating}
        >
          가져오기
        </Button>
        {selectedCodes.length > 0 && (
          <Button
            onClick={handleBulkDelete}
            disabled={isGenerating}
            variant="destructive"
          >
            선택한 코드 삭제 ({selectedCodes.length})
          </Button>
        )}
      </div>

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="w-[50px] text-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={codes.length > 0 && selectedCodes.length === codes.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th 
                className="p-2 text-left cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('code')}
              >
                코드 {sortField === 'code' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="p-2 text-left">상태</th>
              <th 
                className="p-2 text-left cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('expires_at')}
              >
                만료일 {sortField === 'expires_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="p-2 text-left cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('context')}
              >
                컨텍스트 {sortField === 'context' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="p-2 text-left cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('created_at')}
              >
                생성일 {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentCodes.map((code) => {
              const status = getCodeStatus(code);
              const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
              return (
                <tr key={code.id} className="border-b">
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={selectedCodes.includes(code.id)}
                      onChange={(e) => handleCodeSelection(code.id, e.target.checked)}
                    />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{code.code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        {copiedCode === code.code ? '✓' : '📋'}
                      </Button>
                    </div>
                  </td>
                  <td className="p-2">
                    <Button
                      onClick={() => !isExpired && handleStatusToggle(code)}
                      disabled={isGenerating || Boolean(isExpired)}
                      variant="ghost"
                      className="h-auto py-0.5"
                    >
                      <Badge 
                        variant={code.is_used ? "destructive" : isExpired ? "secondary" : "default"}
                        className={`${
                          code.is_used 
                            ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                            : isExpired 
                              ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {code.is_used ? "사용됨" : isExpired ? "만료됨" : "활성"}
                      </Badge>
                    </Button>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white" align="start">
                          <Calendar
                            mode="single"
                            selected={code.expires_at ? new Date(code.expires_at) : undefined}
                            onSelect={(date: Date | undefined) => handleExpiryDateChange(code, date || null)}
                            initialFocus
                            locale={ko}
                            disabled={{ before: new Date() }}
                            weekStartsOn={0}
                            ISOWeek={false}
                            captionLayout="dropdown"
                            fromYear={new Date().getFullYear()}
                            toYear={new Date().getFullYear() + 10}
                            formatters={{
                              formatCaption: () => ''
                            }}
                            classNames={{
                              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                              month: "space-y-4",
                              caption: "flex justify-center pt-1 relative items-center",
                              caption_label: "hidden",
                              caption_dropdowns: "flex gap-2 w-full justify-center",
                              vhidden: "hidden",
                              dropdown: "p-2 bg-white rounded-md border shadow min-w-[100px] text-center",
                              dropdown_month: "text-sm font-medium",
                              dropdown_year: "text-sm font-medium",
                              dropdown_icon: "h-4 w-4 opacity-50",
                              button: "rounded-md p-2 text-sm hover:bg-gray-100",
                              nav: "hidden",
                              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-gray-100 rounded-md",
                              nav_button_previous: "absolute left-1",
                              nav_button_next: "absolute right-1",
                              table: "w-full border-collapse space-y-1",
                              head_row: "flex",
                              head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center",
                              row: "flex w-full mt-2",
                              cell: "text-center text-sm relative p-0 hover:bg-gray-100 rounded-md",
                              day: "h-8 w-8 p-0 font-normal aria-selected:font-bold hover:bg-gray-100 rounded-md",
                              day_range_end: "day-range-end",
                              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold rounded-md",
                              day_today: "bg-accent text-accent-foreground font-bold rounded-md",
                              day_outside: "text-muted-foreground opacity-50 text-gray-400",
                              day_disabled: "text-muted-foreground opacity-50 text-gray-400",
                              day_hidden: "invisible",
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {code.expires_at ? format(new Date(code.expires_at), 'yyyy-MM-dd') : '없음'}
                    </div>
                  </td>
                  <td className="p-2">
                    {editingContext === code.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newContext}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewContext(e.target.value)}
                          placeholder="컨텍스트 입력..."
                        />
                        <Button
                          onClick={() => handleContextUpdate(code, newContext)}
                          disabled={loadingId === code.id}
                          size="sm"
                        >
                          확인
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingContext(null);
                            setNewContext('');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          취소
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{code.context || '-'}</span>
                        <Button
                          onClick={() => {
                            setEditingContext(code.id);
                            setNewContext(code.context || '');
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          ✏️
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    {new Date(code.created_at).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="text-sm text-gray-500">
          총 {filteredCount}개 중 {startIndex + 1}-{Math.min(endIndex, filteredCount)}개 표시
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            처음
          </Button>
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            이전
          </Button>
          <span className="mx-2">
            {currentPage} / {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            다음
          </Button>
          <Button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            마지막
          </Button>
        </div>
      </div>

      {showGenerateModal && (
        <GenerateCodeModal
          onGenerate={handleGenerateCode}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
    </div>
  );
} 