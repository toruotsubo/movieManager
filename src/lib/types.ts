export interface AppSettings {
  id: number;
  is_initialized: boolean;
  custom_field_1_name: string | null;
  custom_field_2_name: string | null;
  custom_field_3_name: string | null;
  key_fields: string[]; // JSON array stored in DB
}

export interface Movie {
  id: number;
  file_path: string;
  file_name: string;
  summary_image_path: string | null;
  title: string | null;
  genre: string | null;
  cast: string | null;
  release_year: number | null;
  release_date: string | null; // MM-DD
  rating: number; // 1 to 5
  comment: string | null;
  custom_field_1: string | null;
  custom_field_2: string | null;
  custom_field_3: string | null;
  duration: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface KeyItemGroup {
  key_signature: string; // JSON string e.g. {"genre":"Action","cast":"ActorA"}
  key_values: Record<string, string>; // e.g. { genre: "Action", cast: "ActorA" }
  summary_image_path: string | null;
  rating: number; // Key item rating (1-5)
  movie_count: number;
}

export interface CreateMovieInput {
  file_path: string;
  file_name: string;
  summary_image_path?: string | null;
  title?: string | null;
  genre?: string | null;
  cast?: string | null;
  release_year?: number | null;
  release_date?: string | null;
  rating?: number;
  comment?: string | null;
  custom_field_1?: string | null;
  custom_field_2?: string | null;
  custom_field_3?: string | null;
  duration?: number | null;
}

export interface UpdateMovieInput extends Partial<CreateMovieInput> {
  id: number;
}

// Available fields that can be chosen as key items (excluding 'comment')
export const ALL_BASE_FIELDS = [
  { id: 'title', label: 'タイトル' },
  { id: 'genre', label: 'カテゴリ' },
  { id: 'cast', label: '出演者' },
  { id: 'release_year', label: '公開年' },
  { id: 'release_date', label: '公開月日' },
  { id: 'rating', label: '評価' },
] as const;
