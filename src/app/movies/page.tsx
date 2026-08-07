'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useApp } from '@/components/AppProvider';
import { RatingStars } from '@/components/RatingStars';
import { formatMediaUrl, getSplitValues, formatReleaseDate } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { ALL_BASE_FIELDS, AppSettings } from '@/lib/types';
import {
  List,
  Play,
  ArrowUpDown,
  Filter,
  Film,
  Calendar,
  User,
  Tag,
  X,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';

type SortKey = 'title' | 'genre' | 'cast' | 'release';

const getKeyFieldLabel = (keyId: string, settings: AppSettings | null): string => {
  const base = ALL_BASE_FIELDS.find((f) => f.id === keyId);
  if (base) return base.label;

  if (keyId === 'custom_field_1') return settings?.custom_field_1_name || 'ユーザー定義項目1';
  if (keyId === 'custom_field_2') return settings?.custom_field_2_name || 'ユーザー定義項目2';
  if (keyId === 'custom_field_3') return settings?.custom_field_3_name || 'ユーザー定義項目3';

  return 'キー項目';
};

function MoviesContent() {
  const { movies, settings, updateMovieRating, openMoviePlayer, loading } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterSignature = searchParams.get('filter');

  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [ratingFilter, setRatingFilter] = useState<'all' | number>('all');

  const keyFields = settings?.key_fields || [];
  const keyFieldId = keyFields.length > 0 ? keyFields[0] : 'genre';
  const keyLabel = getKeyFieldLabel(keyFieldId, settings);

  const filterValues = useMemo(() => {
    if (!filterSignature) return null;
    try {
      return JSON.parse(filterSignature) as Record<string, string>;
    } catch {
      return null;
    }
  }, [filterSignature]);

  const isFromKeyItemsPage = Boolean(filterValues);

  const pageTitle = useMemo(() => {
    if (filterValues && Object.keys(filterValues).length > 0) {
      const keyValStr = Object.values(filterValues).join(' / ');
      return `${keyValStr}動画一覧`;
    }
    return '動画一覧';
  }, [filterValues]);

  const filteredMovies = useMemo(() => {
    let result = movies;
    if (filterValues) {
      result = result.filter((movie) => {
        for (const [k, v] of Object.entries(filterValues)) {
          const values = getSplitValues((movie as any)[k]);
          if (!values.includes(v)) return false;
        }
        return true;
      });
    }
    if (ratingFilter !== 'all') {
      result = result.filter((movie) => movie.rating === ratingFilter);
    }
    return result;
  }, [movies, filterValues, ratingFilter]);

  const sortedMovies = useMemo(() => {
    return [...filteredMovies].sort((a, b) => {
      let result = 0;
      if (sortKey === 'title') {
        result = (a.title || '').localeCompare(b.title || '');
      } else if (sortKey === 'genre') {
        result = (a.genre || '').localeCompare(b.genre || '');
      } else if (sortKey === 'cast') {
        const aVal = a.cast_kana || a.cast || '';
        const bVal = b.cast_kana || b.cast || '';
        result = aVal.localeCompare(bVal, 'ja');
      } else if (sortKey === 'release') {
        const aYear = a.release_year || 0;
        const bYear = b.release_year || 0;
        if (aYear !== bYear) {
          result = aYear - bYear;
        } else {
          result = (a.release_date || '').localeCompare(b.release_date || '');
        }
      }
      return sortOrder === 'desc' ? -result : result;
    });
  }, [filteredMovies, sortKey, sortOrder]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <List className="w-7 h-7 text-blue-400" />
            <span>{pageTitle}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {sortedMovies.length} 本
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Key Item Filter Indicator / Clear Button */}
          {filterSignature && (
            <button
              onClick={() => router.push('/movies')}
              className="flex items-center gap-1.5 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/40 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              title="キー項目絞り込み解除"
            >
              <span>絞り込み解除</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Rating Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> 評価絞り込み:
            </span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setRatingFilter('all')}
                className={clsx(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  ratingFilter === 'all'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                すべて
              </button>
              {[5, 4, 3, 2, 1].map((r) => (
                <button
                  key={r}
                  onClick={() => setRatingFilter(r)}
                  className={clsx(
                    'px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-0.5',
                    ratingFilter === r
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <span className="text-amber-400">★</span>
                  <span>{r}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> ソート:
            </span>
            {[
              { id: 'title', label: 'タイトル' },
              { id: 'release', label: '公開年月日' },
              { id: 'genre', label: 'カテゴリ' },
              { id: 'cast', label: '主演' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => toggleSort(item.id as SortKey)}
                className={clsx(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  sortKey === item.id
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                )}
              >
                <span>{item.label}</span>
                {sortKey === item.id && <ArrowUpDown className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sortedMovies.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-200">動画がありません</h3>
          <p className="text-sm text-slate-400">画面上に動画ファイルをドロップして追加してください。</p>
        </div>
      )}

      {/* Movies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedMovies.map((movie) => {
          const imageSrc = formatMediaUrl(movie.summary_image_path);

          return (
            <div
              key={movie.id}
              onClick={() => {
                const params = new URLSearchParams();
                params.set('id', movie.id.toString());
                if (filterSignature) {
                  params.set('filter', filterSignature);
                }
                router.push(`/movies/detail?${params.toString()}`);
              }}
              className="glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between border border-slate-800"
            >
              {/* Summary Image (720x405 Aspect Ratio) */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openMoviePlayer(movie.file_path);
                }}
                className="relative aspect-video w-full bg-slate-950 overflow-hidden group/img cursor-pointer"
                title="クリックで動画再生"
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={movie.title || 'Movie'}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900">
                    <Film className="w-10 h-10 mb-1 opacity-40" />
                    <span className="text-xs">NO IMAGE</span>
                  </div>
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-3 rounded-full bg-blue-600/90 text-white shadow-lg backdrop-blur-sm transform group-hover/img:scale-110 transition-transform">
                    <Play className="w-6 h-6 fill-current" />
                  </div>
                </div>
              </div>

              {/* Metadata & Rating */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                    {movie.title || movie.file_name}
                  </h3>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    {/* Custom key field value if not from key items page */}
                    {!isFromKeyItemsPage && keyFieldId.startsWith('custom_field_') && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-slate-300 font-medium">
                          {keyLabel}: {(movie as any)[keyFieldId] || '未指定'}
                        </span>
                      </div>
                    )}

                    {/* Category (genre) - excluded if transitioned from Key Items page */}
                    {!(isFromKeyItemsPage && keyFields.includes('genre')) && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-300">{movie.genre || '未指定'}</span>
                      </div>
                    )}

                    {/* Cast - excluded if transitioned from Key Items page */}
                    {!(isFromKeyItemsPage && keyFields.includes('cast')) && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-300">{movie.cast || '未指定'}</span>
                      </div>
                    )}

                    {/* Release Date - excluded if transitioned from Key Items page */}
                    {!(isFromKeyItemsPage && (keyFields.includes('release_year') || keyFields.includes('release_date'))) && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-300">
                          {formatReleaseDate(movie.release_year, movie.release_date)}
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {movie.tags && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {getSplitValues(movie.tags).slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-blue-600/10 text-blue-400 text-[10px] font-medium border border-blue-500/20"
                          >
                            #{tag}
                          </span>
                        ))}
                        {getSplitValues(movie.tags).length > 3 && (
                          <span className="text-[10px] text-slate-500 self-center">
                            +{getSplitValues(movie.tags).length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <RatingStars
                    rating={movie.rating}
                    onChange={(newRating) => updateMovieRating(movie.id, newRating)}
                  />
                  <span className="text-xs text-slate-500 group-hover:text-slate-400">詳細を見る →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12 text-slate-400">読み込み中...</div>}>
      <MoviesContent />
    </Suspense>
  );
}
