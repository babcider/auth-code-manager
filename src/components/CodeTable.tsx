import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Pencil as PencilIcon } from 'lucide-react';
import { AuthCodeView } from '@/types/auth-code';

interface CodeTableProps {
  codes: AuthCodeView[];
  selectedCodes: string[];
  loadingId: string | null;
  sortField: keyof AuthCodeView;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof AuthCodeView) => void;
  onSelectAll: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCodeSelection: (key: string, checked: boolean) => void;
  onDelete: (code: AuthCodeView) => void;
}

export default function CodeTable({
  codes,
  selectedCodes,
  loadingId,
  sortField,
  sortDirection,
  onSort,
  onSelectAll,
  onCodeSelection,
  onDelete
}: CodeTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <Checkbox
                checked={selectedCodes.length > 0 && selectedCodes.length === codes.length}
                onCheckedChange={(checked) => {
                  const event = { target: { checked } } as React.ChangeEvent<HTMLInputElement>;
                  onSelectAll(event);
                }}
              />
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('key')}
            >
              키
              {sortField === 'key' && (
                <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => onSort('institution_name')}
            >
              기관명
              {sortField === 'institution_name' && (
                <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              콘텐츠
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              앱 타입
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              작업
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {codes.map((code) => (
            <tr key={code.key}>
              <td className="px-6 py-4 whitespace-nowrap">
                <Checkbox
                  checked={selectedCodes.includes(code.key)}
                  onCheckedChange={(checked) => onCodeSelection(code.key, checked as boolean)}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{code.key}</div>
                {code.setup_key && (
                  <div className="text-sm text-gray-500">{code.setup_key}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{code.institution_name || '-'}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {code.content_names?.map((name, index) => (
                    <Badge key={index} variant="outline" className="mr-1 mb-1">
                      {name}
                    </Badge>
                  )) || '-'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {code.app_types?.map((type, index) => (
                    <Badge key={index} variant="outline" className="mr-1 mb-1">
                      {type}
                    </Badge>
                  )) || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">삭제</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>인증 코드 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        이 인증 코드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(code)}>삭제</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 