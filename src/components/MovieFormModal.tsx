'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Movie, AppSettings, DEFAULT_FIELD_ORDER } from '../lib/types';
import { formatMediaUrl } from '../lib/utils';
import { RatingStars } from './RatingStars';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Camera,
  Save,
  Film,
  X,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

interface MovieFormModalProps {
  isOpen: boolean;
  movie: Partial<Movie> | null;
  settings: AppSettings | null;
  onSave: (movieData: Partial<Movie>) => void;
  onDelete?: (id: number) => Promise<void>;
  onClose: () => void;
}

export const MovieFormModal: React.FC<MovieFormModalProps> = ({
  isOpen,
  movie,
  settings,
  onSave,
  onDelete,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [cast, setCast] = useState('');
  const [castKana, setCastKana] = useState('');
  const [releaseYear, setReleaseYear] = useState<number | ''>('');
  const [releaseDate, setReleaseDate] = useState('');
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState('');
  const [custom1, setCustom1] = useState('');
  const [custom2, setCustom2] = useState('');
  const [custom3, setCustom3] = useState('');
  const [isGrouped, setIsGrouped] = useState(false);
  const loadedMovieKeyRef = useRef<string | number | null>(null);

  // Video / Summary Image State
  const [summaryImagePath, setSummaryImagePath] = useState<string | null>(null);
  const [capturedTime, setCapturedTime] = useState<number | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [frameRate, setFrameRate] = useState<number | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !movie) {
      loadedMovieKeyRef.current = null;
      return;
    }

    const currentKey = movie.id || movie.file_path || null;
    if (loadedMovieKeyRef.current !== currentKey) {
      loadedMovieKeyRef.current = currentKey;
      setTitle(movie.title || movie.file_name || '');
      setGenre(movie.genre || '');
      setCast(movie.cast || '');
      setCastKana(movie.cast_kana || '');
      setReleaseYear(movie.release_year || '');
      setReleaseDate(movie.release_date || '');
      setRating(movie.rating || 3);
      setComment(movie.comment || '');
      setTags(movie.tags || '');
      setCustom1(movie.custom_field_1 || '');
      setCustom2(movie.custom_field_2 || '');
      setCustom3(movie.custom_field_3 || '');
      setIsGrouped(Boolean(movie.is_grouped));
      setSummaryImagePath(movie.summary_image_path || null);
      setCapturedTime(movie.captured_time !== undefined ? movie.captured_time : null);
      setIsPlayingVideo(false);
      setIsPlaying(false);
      setVideoError(null);
      setCurrentTime(0);
      setDuration(movie.duration || 0);
      setWidth(movie.width || null);
      setHeight(movie.height || null);
      setFrameRate(movie.frame_rate || null);
      setFileSize(movie.file_size || null);

      // 自動メタデータ抽出 (新規および不足動画)
      if (movie.file_path && window.api?.extractMetadata) {
        window.api.extractMetadata(movie.file_path).then((meta) => {
          if (meta) {
            if (meta.file_size) setFileSize(meta.file_size);
            if (meta.duration && !movie.duration) setDuration(meta.duration);
            if (meta.width) setWidth(meta.width);
            if (meta.height) setHeight(meta.height);
            if (meta.frame_rate) setFrameRate(meta.frame_rate);
          }
        }).catch((err) => console.warn('Failed to extract metadata in modal:', err));
      }
    }
  }, [isOpen, movie]);

  const getKeyFieldsLabel = () => {
    const keyFields = settings?.key_fields || ['genre'];
    const labels: string[] = [];
    for (const kf of keyFields) {
      if (kf === 'title') labels.push('タイトル');
      else if (kf === 'genre') labels.push('カテゴリ');
      else if (kf === 'cast') labels.push('主演');
      else if (kf === 'release_year') labels.push('公開年');
      else if (kf === 'release_date') labels.push('公開月日');
      else if (kf === 'rating') labels.push('評価');
      else if (kf === 'custom_field_1') labels.push(settings?.custom_field_1_name || 'ユーザー定義項目1');
      else if (kf === 'custom_field_2') labels.push(settings?.custom_field_2_name || 'ユーザー定義項目2');
      else if (kf === 'custom_field_3') labels.push(settings?.custom_field_3_name || 'ユーザー定義項目3');
      else labels.push('キー項目');
    }
    return labels.join(' / ');
  };

  const handleToggleGrouping = () => {
    setIsGrouped((prev) => !prev);
  };

  if (!isOpen || !movie) return null;

  const videoSrc = formatMediaUrl(movie.file_path, false);
  const imageSrc = formatMediaUrl(summaryImagePath);

  // Video Player Controls
  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (err: any) {
        console.error('Failed to play video:', err);
        setVideoError('動画の再生に失敗しました。ファイル形式または参照パスをご確認ください。');
        setIsPlaying(false);
      }
    }
  };

  const seekTo = (targetTime: number) => {
    if (!videoRef.current) return;
    const validTime = Math.max(0, Math.min(duration || videoRef.current.duration || 0, targetTime));
    videoRef.current.currentTime = validTime;
    setCurrentTime(validTime);
  };

  const seekBy = (seconds: number) => {
    if (!videoRef.current) return;
    seekTo(videoRef.current.currentTime + seconds);
  };

  const stepFrame = (frames: number) => {
    if (!videoRef.current) return;
    const fps = 30;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    seekTo(videoRef.current.currentTime + frames / fps);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  // Capture screenshot (720px x 405px)
  const captureFrame = async (): Promise<string | null> => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = 720;
    canvas.height = 405;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    try {
      ctx.drawImage(video, 0, 0, 720, 405);
      const dataUrl = canvas.toDataURL('image/png');

      if (window.api?.saveSummaryImage) {
        const savedPath = await window.api.saveSummaryImage(dataUrl);
        setSummaryImagePath(savedPath);
        return savedPath;
      }
      setSummaryImagePath(dataUrl);
      return dataUrl;
    } catch (err) {
      console.error('Failed to capture frame:', err);
      return null;
    }
  };

  const handleSave = async () => {
    setIsCapturing(true);
    let finalImagePath = summaryImagePath;
    let finalCapturedTime = capturedTime;

    if (isPlayingVideo && videoRef.current) {
      finalCapturedTime = videoRef.current.currentTime;
      const captured = await captureFrame();
      if (captured) finalImagePath = captured;
    }

    let formattedReleaseDate = releaseDate.trim().replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
    if (/^\d{4}$/.test(formattedReleaseDate)) {
      formattedReleaseDate = `${formattedReleaseDate.slice(0, 2)}-${formattedReleaseDate.slice(2, 4)}`;
    }

    onSave({
      ...movie,
      title: title.trim() || movie.file_name || '無題',
      genre: genre.trim() || null,
      cast: cast.trim() || null,
      cast_kana: castKana.trim() || null,
      release_year: releaseYear !== '' ? Number(releaseYear) : null,
      release_date: formattedReleaseDate || null,
      rating,
      comment: comment.trim() || null,
      tags: tags.trim() || null,
      custom_field_1: custom1.trim() || null,
      custom_field_2: custom2.trim() || null,
      custom_field_3: custom3.trim() || null,
      summary_image_path: finalImagePath,
      captured_time: finalCapturedTime !== undefined ? finalCapturedTime : null,
      duration: duration || movie.duration || null,
      width: width || movie.width || null,
      height: height || movie.height || null,
      frame_rate: frameRate || movie.frame_rate || null,
      file_size: fileSize || movie.file_size || null,
      is_grouped: isGrouped,
    });
    setIsCapturing(false);
    onClose();
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleDelete = async () => {
    if (!movie?.id) return;
    if (confirm('この動画を削除してもよろしいですか？')) {
      // グループ化がONになっている場合、まずグループ化をOFFにする
      if (isGrouped || movie.is_grouped || movie.parent_movie_id) {
        await onSave({
          ...movie,
          is_grouped: false,
          parent_movie_id: null,
        });
      }
      if (onDelete) {
        await onDelete(movie.id);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Hidden Canvas for Capturing */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="glass-card w-full max-w-4xl rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">{movie?.id ? '動画データ編集' : '新規動画追加'}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Summary Image & Player Section */}
          <div className="space-y-2">
            <div className="relative w-full aspect-video max-w-[720px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
              {!isPlayingVideo ? (
                <button
                  type="button"
                  onClick={() => setIsPlayingVideo(true)}
                  className="w-full h-full relative flex items-center justify-center group focus:outline-none"
                >
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt="Summary Preview"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                      <Film className="w-12 h-12 mb-2 opacity-50" />
                      <span className="text-sm">サマリー画像なし（クリックで動画再生）</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-600/90 text-white font-medium shadow-lg backdrop-blur-sm">
                      <Play className="w-5 h-5 fill-current" />
                      <span>動画を再生してキャプチャ</span>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="w-full h-full flex flex-col relative bg-black">
                  {videoError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-slate-300 text-center space-y-3">
                      <AlertTriangle className="w-10 h-10 text-amber-400" />
                      <p className="text-sm text-slate-200">{videoError}</p>
                      <button
                        onClick={() => setIsPlayingVideo(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white"
                      >
                        プレビューに戻る
                      </button>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      src={videoSrc}
                      preload="auto"
                      playsInline
                      className="w-full h-full object-contain"
                      onTimeUpdate={() => {
                        if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                      }}
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          const vidDuration = videoRef.current.duration;
                          setDuration(vidDuration);
                          if (videoRef.current.videoWidth) setWidth(videoRef.current.videoWidth);
                          if (videoRef.current.videoHeight) setHeight(videoRef.current.videoHeight);

                          // 初回/未記録時は50%位置、記録あり時は記録位置にシーク
                          let targetTime = 0;
                          if (capturedTime !== null && capturedTime !== undefined && !isNaN(capturedTime) && capturedTime >= 0) {
                            targetTime = Math.min(vidDuration, Math.max(0, capturedTime));
                          } else if (vidDuration && !isNaN(vidDuration) && vidDuration > 0) {
                            targetTime = vidDuration * 0.5;
                          }

                          if (targetTime > 0) {
                            videoRef.current.currentTime = targetTime;
                            setCurrentTime(targetTime);
                          }
                        }
                      }}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLVideoElement;
                        const errorDetails = target.error
                          ? `Code: ${target.error.code}, Message: ${target.error.message}`
                          : 'Unknown video error';
                        setVideoError(`動画ソースのロードに失敗しました (${errorDetails})。参照パス: ${movie.file_path}`);
                      }}
                      onEnded={() => setIsPlaying(false)}
                    />
                  )}
                </div>
              )}

              {/* Player Controls Bar (When playing video) */}
              {isPlayingVideo && !videoError && (
                <div className="absolute bottom-0 inset-x-0 z-20 p-2.5 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent flex flex-col gap-1.5 backdrop-blur-xs">
                  {/* Seek Bar Slider */}
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <span className="font-mono text-[11px] text-slate-300 shrink-0">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      value={currentTime}
                      onChange={handleSliderChange}
                      className="w-full h-1.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-blue-500 transition-all"
                    />
                    <span className="text-[11px] font-mono text-slate-300 shrink-0 text-right">
                      {formatTime(duration)}
                    </span>
                  </div>

                  {/* Buttons & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Play/Pause */}
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                        title={isPlaying ? '一時停止' : '再生'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>

                      {/* -5s Rewind */}
                      <button
                        type="button"
                        onClick={() => seekBy(-5)}
                        className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs flex items-center gap-1 transition-colors"
                        title="5秒巻き戻し"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-[10px] font-mono">-5s</span>
                      </button>

                      {/* +5s Forward */}
                      <button
                        type="button"
                        onClick={() => seekBy(5)}
                        className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs flex items-center gap-1 transition-colors"
                        title="5秒早送り"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-[10px] font-mono">+5s</span>
                      </button>

                      {/* Separator */}
                      <div className="w-px h-4 bg-slate-700/60 mx-1" />

                      {/* Step Frame Back (-1 frame) */}
                      <button
                        type="button"
                        onClick={() => stepFrame(-1)}
                        className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs flex items-center gap-1 transition-colors"
                        title="コマ送り（1フレーム戻る）"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[10px] font-medium">コマ戻し</span>
                      </button>

                      {/* Step Frame Forward (+1 frame) */}
                      <button
                        type="button"
                        onClick={() => stepFrame(1)}
                        className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs flex items-center gap-1 transition-colors"
                        title="コマ送り（1フレーム進む）"
                      >
                        <span className="text-[10px] font-medium">コマ送り</span>
                        <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                    </div>

                    {/* Frame Counter Indicator */}
                    <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
                      {Math.floor(currentTime * 30)} f
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">タイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="動画のタイトル"
                className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Rating (Moved under Title) */}
            <div className="md:col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-sm text-slate-300 font-medium">評価 (5段階)</span>
              <RatingStars rating={rating} onChange={setRating} size="lg" />
            </div>

            {/* Dynamic Field Ordering */}
            {(() => {
              const order = settings?.field_order || DEFAULT_FIELD_ORDER;

              return order.map((fieldId) => {
                if (fieldId === 'title' || fieldId === 'rating') return null;

                if (fieldId === 'genre') {
                  return (
                    <div key="genre">
                      <label className="text-xs text-slate-400 mb-1 block">カテゴリ</label>
                      <input
                        type="text"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        placeholder="例: アクション, ドキュメンタリー"
                        className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                }

                if (fieldId === 'cast') {
                  return (
                    <React.Fragment key="cast">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">主演</label>
                        <input
                          type="text"
                          value={cast}
                          onChange={(e) => setCast(e.target.value)}
                          placeholder="例: 山田太郎, 鈴木花子"
                          className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">主演（ふりがな）</label>
                        <input
                          type="text"
                          value={castKana}
                          onChange={(e) => setCastKana(e.target.value)}
                          placeholder="例: やまだたろう, すずきはなこ"
                          className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </React.Fragment>
                  );
                }

                if (fieldId === 'release_year') {
                  return (
                    <div key="release_year">
                      <label className="text-xs text-slate-400 mb-1 block">公開年 (西暦)</label>
                      <input
                        type="number"
                        value={releaseYear}
                        onChange={(e) => setReleaseYear(e.target.value ? Number(e.target.value) : '')}
                        placeholder="例: 2024"
                        className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                }

                if (fieldId === 'release_date') {
                  return (
                    <div key="release_date">
                      <label className="text-xs text-slate-400 mb-1 block">公開月日 (MM-DD)</label>
                      <input
                        type="text"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        placeholder="例: 08-15"
                        className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                }

                if (fieldId.startsWith('custom_field_')) {
                  const num = fieldId.replace('custom_field_', '');
                  const customName = (settings as any)?.[`custom_field_${num}_name`];
                  if (!customName) return null;

                  const val = num === '1' ? custom1 : num === '2' ? custom2 : custom3;
                  const setVal = num === '1' ? setCustom1 : num === '2' ? setCustom2 : setCustom3;

                  return (
                    <div key={fieldId}>
                      <label className="text-xs text-slate-400 mb-1 block">{customName}</label>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                }

                return null;
              });
            })()}

            {/* Comment */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">コメント</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="動画に関するメモやコメント"
                className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Tags (Moved under Comment) */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">タグ</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="例: 4K, お気に入り, 名作 (カンマ区切り)"
                className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Grouping Option (Moved under Tag) */}
            <div className="md:col-span-2 flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-slate-200 block">グループ化</span>
                <span className="text-xs text-slate-400 block">
                  同一タイトル・カテゴリ・{getKeyFieldsLabel()}・公開年月日の動画をグループ化
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleGrouping}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isGrouped
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
              >
                {isGrouped ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/60 bg-slate-900/60">
          <div>
            {movie?.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/40 bg-red-600/10 text-red-400 hover:bg-red-600/20 text-sm font-medium transition-colors"
                title="動画を削除"
              >
                <Trash2 className="w-4 h-4" />
                <span>削除</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              キャンセル
            </button>

            <button
              type="button"
              disabled={isCapturing}
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isCapturing ? '保存中...' : '保存'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
