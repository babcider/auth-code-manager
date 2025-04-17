'use client'

import { useState } from 'react'
import { CodeGenerationOptions } from '@/types/auth-code'
import { generateCode } from '@/lib/auth-code'

interface GenerateCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (options: CodeGenerationOptions) => Promise<void>
}

export default function GenerateCodeModal({ isOpen, onClose, onGenerate }: GenerateCodeModalProps) {
  const [options, setOptions] = useState<CodeGenerationOptions>({
    key: generateCode({
      length: 8,
      useUppercase: true,
      useNumbers: true,
    }),
    setup_key: '',
    unity_key: '',
    institution_name: '',
    agency: '',
    memo: '',
    program_update: '',
    is_active: true,
    is_unlimit: false,
    local_max_count: null,
    available_apps: '',
    available_contents: '',
    content_ids: []
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      await onGenerate(options)
      onClose()
    } catch (error) {
      console.error('Error generating code:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">새 인증 코드 생성</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                키
              </label>
              <input
                type="text"
                value={options.key}
                onChange={(e) => setOptions({ ...options, key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설정 키
              </label>
              <input
                type="text"
                value={options.setup_key}
                onChange={(e) => setOptions({ ...options, setup_key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기관명
              </label>
              <input
                type="text"
                value={options.institution_name}
                onChange={(e) => setOptions({ ...options, institution_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기관 코드
              </label>
              <input
                type="text"
                value={options.agency}
                onChange={(e) => setOptions({ ...options, agency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                메모
              </label>
              <textarea
                value={options.memo}
                onChange={(e) => setOptions({ ...options, memo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.is_active}
                  onChange={(e) => setOptions({ ...options, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  활성화
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.is_unlimit}
                  onChange={(e) => setOptions({ ...options, is_unlimit: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  무제한
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                실행 제한 횟수
              </label>
              <input
                type="number"
                value={options.local_max_count === null ? '' : options.local_max_count}
                onChange={(e) => {
                  const value = e.target.value;
                  setOptions({ 
                    ...options, 
                    local_max_count: value === '' ? null : parseInt(value)
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={1}
                disabled={options.is_unlimit}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isLoading ? '생성 중...' : '생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 