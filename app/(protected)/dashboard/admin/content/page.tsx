'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContentTable } from '@/components/admin/content/content-table';
import { ContentFilters } from '@/components/admin/content/content-filters';
import { ContentPreviewModal } from '@/components/admin/content/content-preview-modal';
import { UsersPagination } from '@/components/admin/users/users-pagination';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRange } from 'react-day-picker';

interface ContentItem {
  id: string;
  type: 'note' | 'folder';
  title: string;
  content: any;
  userId: string;
  userName: string | null;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
  flagged: boolean;
}

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [flaggedFilter, setFlaggedFilter] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalContent, setTotalContent] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch content
  const fetchContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(flaggedFilter && { flagged: 'true' }),
        ...(dateRange?.from && { dateFrom: dateRange.from.toISOString() }),
        ...(dateRange?.to && { dateTo: dateRange.to.toISOString() }),
      });

      const response = await fetch(`/api/admin/content?${params}`);
      if (!response.ok) throw new Error('Failed to fetch content');

      const data = await response.json();
      setContent(data.content);
      setTotalContent(data.pagination.total);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [page, limit, search, typeFilter, flaggedFilter, dateRange]);

  // View content
  const handleViewContent = (item: ContentItem) => {
    setSelectedContent(item);
    setPreviewOpen(true);
  };

  // Flag content
  const handleFlagContent = async (item: ContentItem) => {
    toast.info('Flag functionality coming soon');
    // TODO: Implement flagging system
  };

  // Approve content
  const handleApproveContent = async (item: ContentItem) => {
    toast.info('Approve functionality coming soon');
    // TODO: Implement approval system
  };

  // Delete content
  const handleDeleteContent = async (item: ContentItem) => {
    if (!confirm(`Are you sure you want to delete this ${item.type}?`)) return;

    try {
      const response = await fetch('/api/admin/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contentId: item.id, 
          contentType: item.type 
        }),
      });

      if (!response.ok) throw new Error('Failed to delete content');

      toast.success('Content deleted successfully');
      fetchContent(); // Refresh the list
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setFlaggedFilter(false);
    setDateRange(undefined);
    setPage(1);
  };

  // Export content
  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  // Stats
  const flaggedCount = content.filter(item => item.flagged).length;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Moderation</h2>
          <p className="text-muted-foreground">
            Review and moderate user-generated content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flaggedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {content.filter(item => item.type === 'note').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {content.filter(item => item.type === 'folder').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ContentFilters
            search={search}
            type={typeFilter}
            flagged={flaggedFilter}
            dateRange={dateRange}
            onSearchChange={setSearch}
            onTypeChange={setTypeFilter}
            onFlaggedChange={setFlaggedFilter}
            onDateRangeChange={setDateRange}
            onReset={handleResetFilters}
          />

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : content.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8">
              <p className="text-center text-muted-foreground">
                No content found matching your criteria
              </p>
            </div>
          ) : (
            <>
              <ContentTable
                content={content}
                onViewContent={handleViewContent}
                onFlagContent={handleFlagContent}
                onDeleteContent={handleDeleteContent}
                onApproveContent={handleApproveContent}
              />
              <UsersPagination
                page={page}
                totalPages={totalPages}
                limit={limit}
                totalUsers={totalContent}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ContentPreviewModal
        content={selectedContent}
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setSelectedContent(null);
        }}
        onFlag={handleFlagContent}
        onApprove={handleApproveContent}
        onDelete={handleDeleteContent}
      />
    </div>
  );
}