import { Config } from "../app/config";

export const SERVER_URL = Config.apiUrl;

export type CurrentSong = {
  state: string;
  name: string;
  artistName: string;
  imageUrl: string;
};

export type Creation = {
  name: string;
  description: string;
  link: string;
  type: string;
  img: string;
};

export type SearchTrack = {
  trackName: string;
  imgUrl: string;
  artist: string;
  id: string;
};

class ApiClass {
  async getCurrentSong(): Promise<CurrentSong> {
    const res = await fetch(`${SERVER_URL}/me/listening-to`);
    const data = await res.json();
    return data;
  }

  async getCreations(): Promise<Creation[]> {
    const res = await fetch(`${SERVER_URL}/me/creations`);
    const data = await res.json();
    return data;
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
