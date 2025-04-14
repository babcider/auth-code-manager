'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useNotification } from '@/contexts/NotificationContext'

interface AuditLog {
  id: string
  user_id: string
  user_email: string
  action: string
  details: any
  created_at: string
}

export default function AuditLogList() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const notification = useNotification()
  const supabase = createClientComponentClient()

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      let query = supabase
        .from('auth_codes_audit_log')
        .select('*')
        .order('created_at', { ascending: false })

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter)
      }

      if (searchTerm) {
        query = query.or(`user_email.ilike.%${searchTerm}%,details->>'code'.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      notification.showNotification('error', '감사 로그를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [searchTerm, actionFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      create: '생성',
      update: '수정',
      delete: '삭제',
      bulk_delete: '일괄 삭제'
    }
    return actionMap[action] || action
  }

  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      bulk_delete: 'bg-red-100 text-red-800'
    }
    return colorMap[action] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">감사 로그</h2>
        <div className="flex space-x-4">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">모든 작업</option>
            <option value="create">생성</option>
            <option value="update">수정</option>
            <option value="delete">삭제</option>
            <option value="bulk_delete">일괄 삭제</option>
          </select>
          <input
            type="text"
            placeholder="이메일 또는 코드로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
          감사 로그가 없습니다.
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상세 정보</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.user_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {getActionText(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.action === 'create' && `코드: ${log.details.code}`}
                    {log.action === 'update' && `컨텍스트: ${log.details.context}`}
                    {log.action === 'delete' && `코드: ${log.details.code}`}
                    {log.action === 'bulk_delete' && `${log.details.count}개의 코드`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 