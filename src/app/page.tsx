'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { RatingStars } from '@/components/RatingStars';
import { formatMediaUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, Film, LayoutGrid, ChevronRight, Filter } from 'lucide-react';
import { clsx } from 'clsx';
import { KeyItemGroup, ALL_BASE_FIELDS, AppSettings } from '@/lib/types';

const getKeyFieldLabel = (keyId: string, settings: AppSettings | null): string => {
  const base = ALL_BASE_FIELDS.find((f) => f.id === keyId);
  if (base) return base.label;

  if (keyId === 'custom_field_1') return settings?.custom_field_1_name || 'ユーザー定義項目1';
  if (keyId === 'custom_field_2') return settings?.custom_field_2_name || 'ユーザー定義項目2';
  if (keyId === 'custom_field_3') return settings?.custom_field_3_name || 'ユーザー定義項目3';

  return 'キー項目';
};

export default function KeyItemsPage() {
  const { keyGroups, settings, updateKeyItemRating, loading } = useApp();
  const router = useRouter();

  const [sortField, setSortField] = useState<'key' | 'rating'>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  const keyFieldId = settings?.key_fields && settings.key_fields.length > 0 ? settings.key_fields[0] : 'genre';
  const keyLabel = getKeyFieldLabel(keyFieldId, settings);

  const sortedGroups = [...keyGroups].sort((a, b) => {
    if (sortField === 'rating') {
      return sortOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating;
    } else {
      const aVal = Object.values(a.key_values).join(' / ');
      const bVal = Object.values(b.key_values).join(' / ');
      return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    }
  });

  const toggleSort = (field: 'key' | 'rating') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleRowClick = (group: KeyItemGroup) => {
    const params = new URLSearchParams();
    params.set('filter', group.key_signature);
    router.push(`/movies?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <LayoutGrid className="w-7 h-7 text-blue-400" />
            <span>{keyLabel}一覧</span>
          </h1>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> ソート:
          </span>
          <button
            onClick={() => toggleSort('key')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              sortField === 'key'
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            )}
          >
            <span>{keyLabel}</span>
            {sortField === 'key' && <ArrowUpDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => toggleSort('rating')}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              sortField === 'rating'
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            )}
          >
            <span>評価</span>
            {sortField === 'rating' && <ArrowUpDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {sortedGroups.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">登録データがありません</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            動画ファイルを画面上にドラッグ＆ドロップして追加してください。
          </p>
        </div>
      )}

      {/* Key Item Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedGroups.map((group) => {
          const imageSrc = formatMediaUrl(group.summary_image_path);

          return (
            <div
              key={group.key_signature}
              onClick={() => handleRowClick(group)}
              className="glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between border border-slate-800"
            >
              {/* Summary Image (720x405 Aspect Ratio) */}
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Group Summary"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900">
                    <Film className="w-10 h-10 mb-1 opacity-40" />
                    <span className="text-xs">NO IMAGE</span>
                  </div>
                )}

                {/* Badge count */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-xs font-semibold text-blue-400 border border-blue-500/30">
                  {group.movie_count} 本の動画
                </div>
              </div>

              {/* Group Metadata & Rating */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* No English label display - values only */}
                <div className="space-y-1">
                  {Object.values(group.key_values).map((val, idx) => (
                    <div key={idx} className="text-lg font-bold text-white line-clamp-1">
                      {val}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{keyLabel}評価:</span>
                    <RatingStars
                      rating={group.rating}
                      onChange={(newRating) => updateKeyItemRating(group.key_signature, newRating)}
                    />
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
