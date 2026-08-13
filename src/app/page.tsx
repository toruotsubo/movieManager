'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppProvider';
import { RatingStars } from '@/components/RatingStars';
import { formatMediaUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ArrowUpDown, Film, LayoutGrid, Star, Edit, Tag, FileText, X } from 'lucide-react';
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
  const { keyGroups, settings, updateKeyItemRating, openEditKeyItemModal, loading } = useApp();
  const router = useRouter();

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [ratingFilter, setRatingFilter] = useState<string | number>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [isTextListModalOpen, setIsTextListModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore filter/sort state from sessionStorage on mount
  useEffect(() => {
    try {
      const savedStateStr = sessionStorage.getItem('movie_manager_key_items_page_state');
      if (savedStateStr) {
        const savedState = JSON.parse(savedStateStr);
        if (savedState.sortOrder) setSortOrder(savedState.sortOrder);
        if (savedState.ratingFilter !== undefined) setRatingFilter(savedState.ratingFilter);
        if (savedState.tagFilter) setTagFilter(savedState.tagFilter);
      }
    } catch (e) {
      console.error('Failed to load filter state from sessionStorage:', e);
    }
    setIsInitialized(true);
  }, []);

  // Save filter/sort state to sessionStorage when changed
  useEffect(() => {
    if (!isInitialized) return;
    try {
      const stateToSave = {
        sortOrder,
        ratingFilter,
        tagFilter,
      };
      sessionStorage.setItem('movie_manager_key_items_page_state', JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save filter state to sessionStorage:', e);
    }
  }, [sortOrder, ratingFilter, tagFilter, isInitialized]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  const keyFieldId = settings?.key_fields && settings.key_fields.length > 0 ? settings.key_fields[0] : 'genre';
  const keyLabel = getKeyFieldLabel(keyFieldId, settings);

  // Extract all unique tags
  const availableTags = Array.from(
    new Set(
      keyGroups.flatMap((g) =>
        g.tags ? g.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
      )
    )
  ).sort((a, b) => a.localeCompare(b, 'ja'));

  const filteredGroups = keyGroups.filter((g) => {
    if (ratingFilter === 'gte4') {
      if (g.rating < 4) return false;
    } else if (ratingFilter === 'gte3') {
      if (g.rating < 3) return false;
    } else if (ratingFilter !== 'all' && g.rating !== Number(ratingFilter)) {
      return false;
    }
    if (tagFilter !== 'all') {
      if (!g.tags) return false;
      const groupTags = g.tags.split(',').map((t) => t.trim());
      if (!groupTags.includes(tagFilter)) return false;
    }
    return true;
  });

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    const aVal = (keyFieldId === 'cast' && a.sort_key) ? a.sort_key : Object.values(a.key_values).join(' / ');
    const bVal = (keyFieldId === 'cast' && b.sort_key) ? b.sort_key : Object.values(b.key_values).join(' / ');
    return sortOrder === 'desc' ? bVal.localeCompare(aVal, 'ja') : aVal.localeCompare(bVal, 'ja');
  });

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleRowClick = (group: KeyItemGroup) => {
    const params = new URLSearchParams();
    params.set('filter', group.key_signature);
    router.push(`/movies?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <LayoutGrid className="w-7 h-7 text-blue-400" />
            <span>{keyLabel}一覧</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Tag Filter Controls */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> タグ:
              </span>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="all">すべて</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rating Filter Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-slate-400" /> 評価:
            </span>
            <select
              value={ratingFilter}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all' || val === 'gte4' || val === 'gte3') {
                  setRatingFilter(val);
                } else {
                  setRatingFilter(Number(val));
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="all">すべて</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  ★{r}
                </option>
              ))}
              <hr className="border-slate-800 my-1" />
              <option value="gte4">★4以上</option>
              <option value="gte3">★3以上</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> ソート:
            </span>
            <button
              onClick={toggleSort}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-blue-600/20 border-blue-500 text-blue-400 transition-colors"
            >
              <span>{keyLabel}</span>
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Text List Button */}
          <button
            onClick={() => setIsTextListModalOpen(true)}
            className="flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border-blue-500/40 transition-colors cursor-pointer"
          >
            <span>テキスト一覧</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {sortedGroups.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">該当するキー項目がありません</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {tagFilter !== 'all' || ratingFilter !== 'all'
              ? '絞り込み条件を変更して再度ご確認ください。'
              : '動画ファイルを画面上にドラッグ＆ドロップして追加してください。'}
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
              className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-slate-800"
            >
              {/* Summary Image (720x405 Aspect Ratio) */}
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Group Summary"
                    className="w-full h-full object-cover"
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
                <div className="space-y-2">
                  <div className="space-y-1">
                    {Object.values(group.key_values).map((val, idx) => (
                      <div key={idx} className="text-lg font-bold text-white line-clamp-1">
                        {val}
                      </div>
                    ))}
                  </div>

                  {/* Key Item Tags Display */}
                  {group.tags && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      {group.tags.split(',').map((t, idx) => {
                        const trimmedTag = t.trim();
                        if (!trimmedTag) return null;
                        const isSelected = tagFilter === trimmedTag;
                        return (
                          <button
                            key={idx}
                            onClick={() => setTagFilter(isSelected ? 'all' : trimmedTag)}
                            className={clsx(
                              'px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors cursor-pointer',
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-500 font-semibold shadow-sm'
                                : 'bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30'
                            )}
                          >
                            {trimmedTag}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RatingStars
                      rating={group.rating}
                      onChange={(newRating) => updateKeyItemRating(group.key_signature, newRating)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditKeyItemModal(group)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 transition-colors cursor-pointer"
                      title="キー項目を編集"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-400" />
                      <span>編集</span>
                    </button>

                    <button
                      onClick={() => handleRowClick(group)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 text-xs font-medium border border-blue-500/40 transition-colors cursor-pointer"
                    >
                      <span>動画一覧</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Text List Modal */}
      {isTextListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">{keyLabel} テキスト一覧</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                  {sortedGroups.length} 件
                </span>
              </div>
              <button
                onClick={() => setIsTextListModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Tag Cloud Items */}
            <div className="p-5 overflow-y-auto flex-1 max-h-[60vh]">
              {sortedGroups.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  該当するキー項目がありません
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {sortedGroups.map((group) => {
                    const keyText = Object.values(group.key_values).join(' / ');
                    return (
                      <button
                        key={group.key_signature}
                        onClick={() => {
                          setIsTextListModalOpen(false);
                          handleRowClick(group);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-800/80 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700/70 hover:border-blue-500 transition-all cursor-pointer shadow-sm hover:shadow-blue-500/20 active:scale-95"
                      >
                        {keyText}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex justify-end">
              <button
                onClick={() => setIsTextListModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
