'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, X, Calendar } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

interface ContentFiltersProps {
  search: string;
  type: string;
  flagged: boolean;
  dateRange: DateRange | undefined;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onFlaggedChange: (value: boolean) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onReset: () => void;
}

export function ContentFilters({
  search,
  type,
  flagged,
  dateRange,
  onSearchChange,
  onTypeChange,
  onFlaggedChange,
  onDateRangeChange,
  onReset,
}: ContentFiltersProps) {
  const hasFilters = search || type !== 'all' || flagged || dateRange;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">
            Search content
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title or content..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-4">
          <Select value={type} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="notes">Notes</SelectItem>
              <SelectItem value="folders">Folders</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={flagged ? 'flagged' : 'all'} 
            onValueChange={(value) => onFlaggedChange(value === 'flagged')}
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="All content" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All content</SelectItem>
              <SelectItem value="flagged">Flagged only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Date range:</span>
          {dateRange?.from ? (
            <span className="text-sm">
              {dateRange.from.toLocaleDateString()} - {dateRange.to?.toLocaleDateString() || 'Today'}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">All time</span>
          )}
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}