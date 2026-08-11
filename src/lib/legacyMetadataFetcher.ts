import { Movie } from './types';
import { extractMetadataFromUrl } from './metadataExtractor';
import { formatMediaUrl } from './utils';

/**
 * 【後日機能削除予定】
 * 登録済み動画データの詳細画面表示時に、メタデータ（duration, width, height, frame_rate, file_size）の有無を確認し、
 * 不足している場合は自動取得して DB と State を更新します。
 */
export async function ensureLegacyMovieMetadata(
  movie: Movie,
  onUpdate: (updatedMovie: Movie) => void
): Promise<void> {
  if (!movie || !movie.file_path) return;

  const hasDuration = movie.duration != null && movie.duration > 0;
  const hasResolution = movie.width != null && movie.height != null && movie.width > 0 && movie.height > 0;
  const hasFrameRate = movie.frame_rate != null && movie.frame_rate > 0;
  const hasFileSize = movie.file_size != null && movie.file_size > 0;

  if (hasDuration && hasResolution && hasFrameRate && hasFileSize) {
    return;
  }

  try {
    let fileSize = movie.file_size ?? null;
    let duration = movie.duration ?? null;
    let width = movie.width ?? null;
    let height = movie.height ?? null;
    let frameRate = movie.frame_rate ?? null;

    // 1. Electron IPC 経由でネイティブ解析 & ファイルサイズ取得
    if (window.api?.extractMetadata) {
      const nativeMeta = await window.api.extractMetadata(movie.file_path);
      if (nativeMeta) {
        if (fileSize == null) fileSize = nativeMeta.file_size;
        if (duration == null) duration = nativeMeta.duration;
        if (width == null) width = nativeMeta.width;
        if (height == null) height = nativeMeta.height;
        if (frameRate == null) frameRate = nativeMeta.frame_rate;
      }
    }

    // 2. ブラウザ経由 (HTML5 Video Element) フォールバック取得
    if (duration == null || width == null || height == null) {
      const mediaUrl = formatMediaUrl(movie.file_path, false);
      if (mediaUrl) {
        const browserMeta = await extractMetadataFromUrl(mediaUrl);
        if (duration == null && browserMeta.duration) duration = browserMeta.duration;
        if (width == null && browserMeta.width) width = browserMeta.width;
        if (height == null && browserMeta.height) height = browserMeta.height;
      }
    }

    // 差分があるかチェック
    const isChanged =
      fileSize !== movie.file_size ||
      duration !== movie.duration ||
      width !== movie.width ||
      height !== movie.height ||
      frameRate !== movie.frame_rate;

    if (isChanged && window.api?.updateMovie) {
      const updated = await window.api.updateMovie({
        id: movie.id,
        file_size: fileSize,
        duration: duration,
        width: width,
        height: height,
        frame_rate: frameRate,
      });
      onUpdate(updated);
    }
  } catch (err) {
    console.error('Failed to backfill legacy movie metadata:', err);
  }
}
