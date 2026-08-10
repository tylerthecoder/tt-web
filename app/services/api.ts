import { Config } from '@/utils/config';

export const SERVER_URL = Config.apiUrl;

export type CurrentSong = {
  state: 'PLAYING' | 'NOT_PLAYING';
  name: string;
  artistName: string;
  imageUrl: string;
};

const isCurrentSong = (value: unknown): value is CurrentSong => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const song = value as Record<string, unknown>;
  return (
    (song.state === 'PLAYING' || song.state === 'NOT_PLAYING') &&
    typeof song.name === 'string' &&
    typeof song.artistName === 'string' &&
    typeof song.imageUrl === 'string' &&
    song.imageUrl.length > 0
  );
};

export type SearchTrack = {
  trackName: string;
  imgUrl: string;
  artist: string;
  id: string;
};

class ApiClass {
  async getCurrentSong(): Promise<CurrentSong | null> {
    try {
      const res = await fetch(`${SERVER_URL}/me/listening-to`);
      if (!res.ok) {
        return null;
      }

      const data: unknown = await res.json();
      return isCurrentSong(data) ? data : null;
    } catch {
      return null;
    }
  }

  async getLights(): Promise<any[]> {
    const res = await fetch(`${SERVER_URL}/lights`);
    return res.json();
  }

  async searchTracks(query: string): Promise<SearchTrack[]> {
    const res = await fetch(`${SERVER_URL}/vibage/search?q=${query}`);
    return res.json();
  }
}

const API = new ApiClass();
export default API;
