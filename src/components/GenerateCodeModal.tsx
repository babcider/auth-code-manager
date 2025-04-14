'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CodeGenerationOptions, DEFAULT_GENERATION_OPTIONS } from '@/types/auth-code'

interface GenerateCodeModalProps {
  onGenerate: (options: CodeGenerationOptions) => void
  onClose: () => void
}

export default function GenerateCodeModal({ onGenerate, onClose }: GenerateCodeModalProps) {
  const [options, setOptions] = useState<CodeGenerationOptions>(DEFAULT_GENERATION_OPTIONS)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGenerate(options)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>인증 코드 생성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="count">생성할 코드 수</Label>
            <Input
              id="count"
              type="number"
              min="1"
              value={options.count}
              onChange={(e) => setOptions({ ...options, count: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <Label htmlFor="length">코드 길이</Label>
            <Input
              id="length"
              type="number"
              min="4"
              value={options.length}
              onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) || 8 })}
            />
          </div>
          <div>
            <Label htmlFor="prefix">접두사 (선택)</Label>
            <Input
              id="prefix"
              value={options.prefix}
              onChange={(e) => setOptions({ ...options, prefix: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="suffix">접미사 (선택)</Label>
            <Input
              id="suffix"
              value={options.suffix}
              onChange={(e) => setOptions({ ...options, suffix: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="context">컨텍스트 (선택)</Label>
            <Input
              id="context"
              placeholder="코드 사용 목적이나 메모를 입력하세요"
              value={options.context || ''}
              onChange={(e) => setOptions({ ...options, context: e.target.value })}
            />
          </div>
          <div>
            <Label>만료일</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {options.expiryDate ? (
                    format(options.expiryDate, 'PPP', { locale: ko })
                  ) : (
                    <span>날짜 선택</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                  mode="single"
                  selected={options.expiryDate || undefined}
                  onSelect={(date) => setOptions({ ...options, expiryDate: date || null })}
                  initialFocus
                  locale={ko}
                  disabled={{ before: new Date() }}
                  weekStartsOn={0}
                  ISOWeek={false}
                  captionLayout="dropdown"
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 10}
                  formatters={{
                    formatCaption: (date) => {
                      return '';  // 캡션 텍스트 숨기기
                    }
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
          </div>
          <div className="space-y-2">
            <Label>문자 종류</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="useUppercase"
                  checked={options.useUppercase}
                  onCheckedChange={(checked) => setOptions({ ...options, useUppercase: checked as boolean })}
                />
                <Label htmlFor="useUppercase">대문자 (A-Z)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="useLowercase"
                  checked={options.useLowercase}
                  onCheckedChange={(checked) => setOptions({ ...options, useLowercase: checked as boolean })}
                />
                <Label htmlFor="useLowercase">소문자 (a-z)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="useNumbers"
                  checked={options.useNumbers}
                  onCheckedChange={(checked) => setOptions({ ...options, useNumbers: checked as boolean })}
                />
                <Label htmlFor="useNumbers">숫자 (0-9)</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">생성</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 