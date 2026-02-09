import { Track, AudioTrack } from '@/types/music';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

interface TrackWithAudio {
  audio_path?: string | null;
  alternate_audio_path?: string | null;
}

export const getAudioUrl = (track: TrackWithAudio): string | null => {
  if (!track) return null;

  const makeUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
    return `${SUPABASE_URL}/storage/v1/object/public/tracks/${encodedPath}`;
  };

  if (track.audio_path) return makeUrl(track.audio_path);
  if (track.alternate_audio_path) return makeUrl(track.alternate_audio_path);
  return null;
};

export const getStorageUrl = (path: string | null | undefined, bucket = 'tracks'): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodedPath}`;
};

export const convertTrackToAudioTrack = (track: Track): AudioTrack => {
  return {
    id: track.id,
    src: getAudioUrl(track) || '',
    name: track.title,
    artist: track.artist || 'Unknown Artist',
    artwork: getStorageUrl(track.cover_path) || '/placeholder.svg',
    duration: track.duration || 0,
    slug: track.slug || ''
  };
};

export const generateTrackUrl = (track: Track | AudioTrack): string => {
  if ('slug' in track && track.slug) {
    return `/tracks/${track.slug}`;
  }
  return `/tracks/${track.id}`;
};
