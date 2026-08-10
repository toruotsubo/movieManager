import { app, BrowserWindow, ipcMain, shell, protocol } from 'electron';
import path from 'path';
import fs from 'fs';
import {
  initDatabase,
  getAppSettings,
  saveAppSettings,
  getAllMovies,
  getMovieById,
  getMovieByFilePath,
  addMovie,
  updateMovie,
  deleteMovie,
  updateMovieRating,
  getKeyItemGroups,
  updateKeyItemRating,
  updateKeyItemDetails,
  resetAllData,
} from './db';

// Register scheme privileges before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Movie Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }
}

// Setup custom protocol for local media files using native File Protocol binding
function registerMediaProtocol() {
  protocol.registerFileProtocol('media', (request, callback) => {
    try {
      // 1. Remove media:// or media://local/ prefix
      let rawUrl = request.url.replace(/^media:\/\/(local\/)?/, '');

      // 2. Strip query parameters (e.g. ?v=1785825095548) and hash
      let cleanUrl = rawUrl.split('?')[0].split('#')[0];

      // 3. Decode URI components
      let decodedPath = decodeURIComponent(cleanUrl);

      // 4. Handle Windows drive letter paths e.g. /F:/path/to/file or F:/path/to/file -> F:/path/to/file
      if (process.platform === 'win32') {
        if (/^\/[a-zA-Z]:/.test(decodedPath)) {
          decodedPath = decodedPath.slice(1);
        }
      }

      const normalizedPath = path.normalize(decodedPath);
      callback({ path: normalizedPath });
    } catch (error) {
      console.error('Failed to handle media file protocol:', error);
      callback({ error: -6 }); // NET_ERROR FILE_NOT_FOUND
    }
  });
}

app.whenReady().then(() => {
  registerMediaProtocol();
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('settings:get', async () => getAppSettings());
ipcMain.handle('settings:save', async (_, input) => saveAppSettings(input));

ipcMain.handle('movies:getAll', async () => getAllMovies());
ipcMain.handle('movies:getById', async (_, id: number) => getMovieById(id));
ipcMain.handle('movies:getByPath', async (_, filePath: string) => getMovieByFilePath(filePath));
ipcMain.handle('movies:add', async (_, movie) => addMovie(movie));
ipcMain.handle('movies:update', async (_, movie) => updateMovie(movie));
ipcMain.handle('movies:delete', async (_, id: number) => deleteMovie(id));
ipcMain.handle('movies:updateRating', async (_, { id, rating }: { id: number; rating: number }) =>
  updateMovieRating(id, rating)
);

ipcMain.handle('keyItems:getAll', async () => getKeyItemGroups());
ipcMain.handle('keyItems:updateRating', async (_, { key_signature, rating }: { key_signature: string; rating: number }) =>
  updateKeyItemRating(key_signature, rating)
);
ipcMain.handle('keyItems:updateDetails', async (_, input) =>
  updateKeyItemDetails(input)
);

ipcMain.handle('app:resetData', async () => resetAllData());

// Open OS default movie player
ipcMain.handle('app:openMoviePlayer', async (_, filePath: string) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '指定された動画ファイルが存在しません。' };
    }
    const errorMsg = await shell.openPath(filePath);
    if (errorMsg) {
      return { success: false, error: errorMsg };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || '動画プレイヤーの起動に失敗しました。' };
  }
});

// Save Summary Image (720x405 screenshot)
ipcMain.handle('app:saveSummaryImage', async (_, base64Data: string) => {
  try {
    const userDataPath = app.getPath('userData');
    const thumbDir = path.join(userDataPath, 'thumbnails');
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }

    const filename = `thumb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
    const fullPath = path.join(thumbDir, filename);

    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(fullPath, buffer);

    return fullPath;
  } catch (err: any) {
    console.error('Failed to save summary image:', err);
    throw new Error('サマリー画像の保存に失敗しました。');
  }
});
