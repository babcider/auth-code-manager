import { Input } from '@/components/ui/input';

interface CodeFiltersProps {
  searchTerm: string;
  statusFilter: 'all' | 'used' | 'expired' | 'active';
  onSearchChange: (value: string) => void;
  onStatusChange: (value: 'all' | 'used' | 'expired' | 'active') => void;
}

export default function CodeFilters({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange
}: CodeFiltersProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Input
        placeholder="코드 또는 컨텍스트 검색..."
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
        className="max-w-xs"
      />
      <select
        value={statusFilter}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
          onStatusChange(e.target.value as 'all' | 'used' | 'expired' | 'active')}
        className="border rounded p-2"
      >
        <option value="active">활성 코드</option>
        <option value="all">모든 코드</option>
        <option value="used">사용된 코드</option>
        <option value="expired">만료된 코드</option>
      </select>
    </div>
  );
} 