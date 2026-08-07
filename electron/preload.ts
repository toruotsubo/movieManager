import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { AppSettings, Movie, KeyItemGroup, CreateMovieInput, UpdateMovieInput, UpdateKeyItemInput } from '../src/lib/types';

export const api = {
  getPathForFile: (file: File): string => {
    try {
      return webUtils.getPathForFile(file);
    } catch (err) {
      console.warn('webUtils.getPathForFile failed, falling back to file.path:', err);
      return (file as any).path || '';
    }
  },

  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (input: any): Promise<AppSettings> => ipcRenderer.invoke('settings:save', input),

  getMovies: (): Promise<Movie[]> => ipcRenderer.invoke('movies:getAll'),
  getMovieById: (id: number): Promise<Movie | null> => ipcRenderer.invoke('movies:getById', id),
  getMovieByPath: (filePath: string): Promise<Movie | null> => ipcRenderer.invoke('movies:getByPath', filePath),
  addMovie: (movie: CreateMovieInput): Promise<Movie> => ipcRenderer.invoke('movies:add', movie),
  updateMovie: (movie: UpdateMovieInput): Promise<Movie> => ipcRenderer.invoke('movies:update', movie),
  deleteMovie: (id: number): Promise<boolean> => ipcRenderer.invoke('movies:delete', id),
  updateMovieRating: (id: number, rating: number): Promise<Movie> => ipcRenderer.invoke('movies:updateRating', { id, rating }),

  getKeyItemGroups: (): Promise<KeyItemGroup[]> => ipcRenderer.invoke('keyItems:getAll'),
  updateKeyItemRating: (key_signature: string, rating: number): Promise<void> =>
    ipcRenderer.invoke('keyItems:updateRating', { key_signature, rating }),
  updateKeyItemDetails: (input: UpdateKeyItemInput): Promise<void> =>
    ipcRenderer.invoke('keyItems:updateDetails', input),

  openMoviePlayer: (filePath: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('app:openMoviePlayer', filePath),

  saveSummaryImage: (base64Data: string): Promise<string> => ipcRenderer.invoke('app:saveSummaryImage', base64Data),
  resetData: (): Promise<AppSettings> => ipcRenderer.invoke('app:resetData'),
};

contextBridge.exposeInMainWorld('api', api);

export type ApiWindow = typeof window & {
  api: typeof api;
};
