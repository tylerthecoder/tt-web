import { Config } from '@/utils/config';

export const SERVER_URL = Config.apiUrl;

export type CurrentSong = {
  state: string;
  name: string;
  artistName: string;
  imageUrl: string;
};

class ApiClass {
  async getCurrentSong(): Promise<CurrentSong> {
    const res = await fetch(`${SERVER_URL}/me/listening-to`);
    const data = await res.json();
    return data;
  }
}

const API = new ApiClass();
export default API;
