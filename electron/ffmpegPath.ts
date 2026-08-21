import path from 'path';
import fs from 'fs';
import { app } from 'electron';

/**
 * Returns the path to the bundled FFmpeg executable.
 * Handles both development mode and packaged Electron app (app.asar / app.asar.unpacked).
 */
export function getFFmpegPath(): string {
  try {
    let binaryPath: string | null = null;

    try {
      // Dynamic require so if module is missing or unpack path differs, it won't crash execution
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ffmpegStatic = require('ffmpeg-static');
      binaryPath = typeof ffmpegStatic === 'string' ? ffmpegStatic : (ffmpegStatic as any)?.default;
    } catch {
      // ffmpeg-static require failed
    }

    if (binaryPath) {
      // In packaged app, unpacked binaries reside in app.asar.unpacked
      if (app?.isPackaged) {
        binaryPath = binaryPath.replace('app.asar', 'app.asar.unpacked');
      }

      if (fs.existsSync(binaryPath)) {
        return binaryPath;
      }
    }

    // Fallback search in resources directory if unpacked path differs or require failed
    if (app?.isPackaged && process.resourcesPath) {
      const fallbackPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
      if (fs.existsSync(fallbackPath)) {
        return fallbackPath;
      }
    }
  } catch (err) {
    console.warn('Failed to resolve ffmpeg-static path:', err);
  }

  // System fallback if bundled binary is missing
  return 'ffmpeg';
}
