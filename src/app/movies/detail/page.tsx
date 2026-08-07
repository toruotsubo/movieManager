'use client';

import React, { Suspense, useMemo } from 'react';
import { useApp } from '@/components/AppProvider';
import { RatingStars } from '@/components/RatingStars';
import { formatMediaUrl, formatReleaseDate, getSplitValues } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';
import { Movie, AppSettings } from '@/lib/types';
import {
  ArrowLeft,
  Play,
  Edit,
  Film,
  Calendar,
  User,
  Shapes,
  MessageSquare,
  FileText,
  Tags,
  Layers,
} from 'lucide-react';

const extractNumber = (m: Movie, settings: AppSettings | null): number => {
  const customFieldConfigs = [
    { key: 'custom_field_1', name: settings?.custom_field_1_name },
    { key: 'custom_field_2', name: settings?.custom_field_2_name },
    { key: 'custom_field_3', name: settings?.custom_field_3_name },
  ];

  // 1. Check custom fields with names including "番号", "No", "#", or "vol"
  for (const cfg of customFieldConfigs) {
    if (cfg.name && /(番号|No|#|vol)/i.test(cfg.name)) {
      const val = (m as any)[cfg.key];
      if (val) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed)) return parsed;
      }
    }
  }

  // 2. Check any custom field value if purely numeric
  for (const cfg of customFieldConfigs) {
    const val = (m as any)[cfg.key];
    if (val) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) return parsed;
    }
  }

  // 3. Fallback: parse number from title or file_name
  const titleText = m.title || m.file_name || '';
  const match = titleText.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }

  return m.id;
};

function MovieDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { movies, settings, updateMovieRating, openMoviePlayer, openEditMovieModal, loading } = useApp();

  const movieId = Number(searchParams.get('id'));
  const filterSignature = searchParams.get('filter');
  const movie = movies.find((m) => m.id === movieId);

  const handleBack = () => {
    if (filterSignature) {
      const params = new URLSearchParams();
      params.set('filter', filterSignature);
      router.push(`/movies?${params.toString()}`);
    } else {
      router.push('/movies');
    }
  };

  const groupMovies = useMemo(() => {
    if (!movie) return [];
    const parentId = movie.parent_movie_id || (movie.is_grouped ? movie.id : null);
    if (!parentId) return [];

    const matches = movies.filter(
      (m) => m.id === parentId || m.parent_movie_id === parentId
    );

    return matches.sort((a, b) => {
      const numA = extractNumber(a, settings);
      const numB = extractNumber(b, settings);
      if (numA !== numB) {
        return numA - numB; // 昇順（左側から小さい順）
      }
      const titleCompare = (a.title || a.file_name || '').localeCompare(
        b.title || b.file_name || '',
        'ja',
        { numeric: true }
      );
      if (titleCompare !== 0) return titleCompare;
      return a.id - b.id;
    });
  }, [movies, movie, settings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-slate-300">動画が見つかりませんでした</h2>
        <button
          onClick={handleBack}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium"
        >
          動画一覧へ戻る
        </button>
      </div>
    );
  }

  const imageSrc = formatMediaUrl(movie.summary_image_path);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button & Title Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white truncate">
            {movie.title || movie.file_name}
          </h1>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => openEditMovieModal(movie)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-500/20 transition-all shrink-0 whitespace-nowrap"
        >
          <Edit className="w-4 h-4" />
          <span>編集</span>
        </button>
      </div>

      {/* Summary Image Hero Card (720px × 405px Aspect Ratio) */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
        <div
          onClick={() => openMoviePlayer(movie.file_path)}
          className="relative aspect-video w-full max-w-[720px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 cursor-pointer group shadow-2xl"
          title="クリックで動画再生"
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={movie.title || 'Summary'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900">
              <Film className="w-12 h-12 mb-2 opacity-40" />
              <span className="text-sm">サマリー画像なし</span>
            </div>
          )}

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="p-3 rounded-full bg-blue-600/90 text-white shadow-lg backdrop-blur-sm transform group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-current" />
            </div>
          </div>
        </div>

        {/* Grouped Siblings Image Gallery */}
        {groupMovies.length > 1 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>グループ動画一覧 ({groupMovies.length}本)</span>
              </span>
              <span className="text-[11px] text-slate-400">番号順表示・クリックで再生</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {groupMovies.map((gMovie) => {
                const gImgSrc = formatMediaUrl(gMovie.summary_image_path);
                const isCurrent = gMovie.id === movie.id;
                const numLabel = extractNumber(gMovie, settings);

                return (
                  <div
                    key={gMovie.id}
                    onClick={() => openMoviePlayer(gMovie.file_path)}
                    className={`relative aspect-video rounded-xl overflow-hidden bg-slate-950 border cursor-pointer group transition-all ${
                      isCurrent
                        ? 'border-blue-500 ring-2 ring-blue-500/50'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                    title={`${gMovie.title || gMovie.file_name} - クリックで再生`}
                  >
                    {gImgSrc ? (
                      <img
                        src={gImgSrc}
                        alt={gMovie.title || 'Group item'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900">
                        <Film className="w-6 h-6 opacity-40" />
                      </div>
                    )}

                    <div className="absolute top-1 left-1 bg-slate-950/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-blue-300 border border-blue-500/30">
                      #{numLabel}
                    </div>

                    {isCurrent && (
                      <div className="absolute top-1 right-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        表示中
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-current" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rating Header */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-sm font-semibold text-slate-200">この動画の評価</span>
          <RatingStars
            rating={movie.rating}
            onChange={(newRating) => updateMovieRating(movie.id, newRating)}
            size="lg"
          />
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* File Path */}
          <div className="md:col-span-2 space-y-1">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> 参照ファイルパス
            </span>
            <p className="text-sm font-mono bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-slate-300 break-all">
              {movie.file_path}
            </p>
          </div>

          {/* Category (genre) */}
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <Shapes className="w-3.5 h-3.5" /> カテゴリ
            </span>
            <p className="text-sm font-medium text-slate-200">{movie.genre || '-'}</p>
          </div>

          {/* Cast */}
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 主演
            </span>
            <p className="text-sm font-medium text-slate-200">
              {movie.cast || '-'}
              {movie.cast_kana ? <span className="text-xs text-slate-400 font-normal ml-2">({movie.cast_kana})</span> : null}
            </p>
          </div>

          {/* Release Year & Date */}
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> 公開年月日
            </span>
            <p className="text-sm font-medium text-slate-200">
              {formatReleaseDate(movie.release_year, movie.release_date)}
            </p>
          </div>

          {/* Custom Fields */}
          {settings?.custom_field_1_name && (
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">{settings.custom_field_1_name}</span>
              <p className="text-sm font-medium text-slate-200">{movie.custom_field_1 || '-'}</p>
            </div>
          )}

          {settings?.custom_field_2_name && (
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">{settings.custom_field_2_name}</span>
              <p className="text-sm font-medium text-slate-200">{movie.custom_field_2 || '-'}</p>
            </div>
          )}

          {settings?.custom_field_3_name && (
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium">{settings.custom_field_3_name}</span>
              <p className="text-sm font-medium text-slate-200">{movie.custom_field_3 || '-'}</p>
            </div>
          )}

          {/* Tags */}
          {movie.tags && (
            <div className="md:col-span-2 space-y-1.5">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Tags className="w-3.5 h-3.5" /> タグ
              </span>
              <div className="flex flex-wrap gap-1.5">
                {getSplitValues(movie.tags).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/15 text-blue-300 border border-blue-500/30 text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comment */}
          <div className="md:col-span-2 space-y-1">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> コメント
            </span>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 min-h-[80px]">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                {movie.comment || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MovieDetailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12 text-slate-400">読み込み中...</div>}>
      <MovieDetailContent />
    </Suspense>
  );
}
