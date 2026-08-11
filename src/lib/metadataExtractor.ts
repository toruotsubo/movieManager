/**
 * Video metadata extraction & formatting utilities
 */

export interface ExtractedMetadata {
  duration: number | null;
  width: number | null;
  height: number | null;
  frame_rate: number | null;
  file_size: number | null;
}

/**
 * Format duration (in seconds) to human readable HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds) || seconds <= 0) return '-';

  const totalSecs = Math.round(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (num: number) => String(num).padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Format video resolution width x height
 */
export function formatResolution(width: number | null | undefined, height: number | null | undefined): string {
  if (!width || !height || width <= 0 || height <= 0) return '-';
  return `${width} × ${height}`;
}

/**
 * Format frame rate (fps)
 */
export function formatFrameRate(fps: number | null | undefined): string {
  if (fps == null || isNaN(fps) || fps <= 0) return '-';
  const rounded = Math.round(fps * 100) / 100;
  return `${rounded} fps`;
}

/**
 * Format file size (in bytes) to B, KB, MB, GB
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || isNaN(bytes) || bytes <= 0) return '-';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIdx = 0;

  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024;
    unitIdx++;
  }

  const formatted = unitIdx === 0 ? size.toString() : size.toFixed(2);
  return `${formatted} ${units[unitIdx]}`;
}

/**
 * Extract video metadata using HTML5 Video element in Browser/Renderer.
 * Resolves duration, width, height.
 */
export function extractMetadataFromElement(videoEl: HTMLVideoElement): Partial<ExtractedMetadata> {
  const duration = videoEl.duration && !isNaN(videoEl.duration) ? videoEl.duration : null;
  const width = videoEl.videoWidth || null;
  const height = videoEl.videoHeight || null;

  return {
    duration,
    width,
    height,
  };
}

/**
 * Loads video element asynchronously and extracts duration, width, height.
 */
export function extractMetadataFromUrl(mediaUrl: string): Promise<Partial<ExtractedMetadata>> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({});
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    let resolved = false;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
      video.remove();
    };

    const finish = (result: Partial<ExtractedMetadata>) => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve(result);
      }
    };

    // Timeout after 5 seconds
    const timeoutId = setTimeout(() => {
      finish({});
    }, 5000);

    video.onloadedmetadata = () => {
      clearTimeout(timeoutId);
      const meta = extractMetadataFromElement(video);
      finish(meta);
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      finish({});
    };

    video.src = mediaUrl;
  });
}
