export interface IArtistSearchRequest {
  artistId: string;
  artistName: string;
}

export interface IArtistSearchAIQuery {
  query: string;
  context: string;
}

export interface IGroundingSource {
  title: string;
  uri: string;
}

export interface IPressItem {
  headline: string;
  url: string;
  date: string;
  publication: string;
  publicationImageUrl?: string | null;
  quote?: string | null;
  source?: string | null;
  meta?: string | null;
  trendingUp?: boolean | null;
}

export interface IArtistSearchResponse {
  artistId: string;
  artistName: string;
  text: string;
  renderedContent: string | null;
  sources: IGroundingSource[];
  numPressItems: number;
  pressItems: IPressItem[];
}

export interface IPressItemSearchAIQuery {
  query: string;
  context: string;
}
