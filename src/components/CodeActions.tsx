import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { logAudit } from '@/lib/audit';

interface CodeActionsProps {
  isGenerating: boolean;
  loadingId: string | null;
  selectedCodes: string[];
  onGenerateClick: () => void;
  onBulkDelete: () => void;
  fetchCodes: () => void;
}

export default function CodeActions({
  isGenerating,
  loadingId,
  selectedCodes,
  onGenerateClick,
  onBulkDelete,
  fetchCodes
}: CodeActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();
  const notification = useNotification();

  const exportCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_codes')
        .select('*');

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auth-codes-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await logAudit('export', {
        count: data.length
      });
    } catch (error) {
      console.error('Error exporting codes:', error);
      notification.showNotification('error', '코드 내보내기에 실패했습니다.');
    }
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
      fetchCodes();
    } catch (error) {
      console.error('Error importing codes:', error);
      notification.showNotification('error', '코드 가져오기에 실패했습니다.');
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={onGenerateClick}
        disabled={isGenerating}
        className="bg-green-500 hover:bg-green-600 font-bold"
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
          variant="destructive"
          onClick={onBulkDelete}
          disabled={isGenerating || loadingId !== null}
        >
          선택한 코드 삭제
        </Button>
      )}
    </div>
  );
} 