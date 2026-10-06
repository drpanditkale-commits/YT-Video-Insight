
export interface VideoMetadata {
  title: string;
  channel?: string;
  description: string;
  summary: string;
  subtitles: string;
  thumbnail: string;
  videoUrl: string;
  sources: { title: string; uri: string }[];
}

export interface AppState {
  loading: boolean;
  error: string | null;
  data: VideoMetadata | null;
}
