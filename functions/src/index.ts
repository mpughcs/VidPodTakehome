import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError, type CallableRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  IArtistSearchRequest,
  IArtistSearchResponse,
  IArtistSearchAIQuery,
  IGroundingSource,
} from "./Types";
import { getPressSearchModel } from "./firebaseClient";
import { parsePressItemsFromGrounding } from "./parsePressItems";

setGlobalOptions({ maxInstances: 10 });

export const receiveSelectedArtist = onCall(
  async (request: CallableRequest<IArtistSearchRequest>): Promise<IArtistSearchResponse> => {
    const artistSearchRequest = request.data;
    if (!artistSearchRequest || typeof artistSearchRequest !== "object") {
      throw new HttpsError("invalid-argument", "Missing or invalid artist payload");
    }
    if (!artistSearchRequest.artistId || !artistSearchRequest.artistName) {
      throw new HttpsError("invalid-argument", "Artist must include id and name");
    }
    logger.info("Selected artist received", { artistSearchRequest });

    const { artistId, artistName } = artistSearchRequest;
    const aiQuery = generateArtistSearchAIQuery(artistId, artistName);
    logger.info("Generated AI query", { aiQuery });

    const { text, renderedContent, sources, pressItems } = await queryPressItems(aiQuery);
    logger.info("Grounded search result", { sourceCount: sources.length, pressItems: pressItems.length });

    return {
      artistId,
      artistName,
      text,
      renderedContent,
      sources,
      numPressItems: pressItems.length,
      pressItems,
    };
  }
);

const generateArtistSearchAIQuery = (
  artistId: string,
  artistName: string
): IArtistSearchAIQuery => ({
  query: `Look up the press coverage for the artist, ${artistName} using google search, return a list `,
  context: `The artist id is ${artistId}. Return a list of press items in the following format:
  {
    title: string;
    url: string;
    date: string;
    source: string;
  }
  `,
});

async function queryPressItems(aiQuery: IArtistSearchAIQuery) {
  const model = getPressSearchModel();
  const result = await model.generateContent(aiQuery.query);
  const response = result.response;

  const text = response.text();
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  const renderedContent = groundingMetadata?.searchEntryPoint?.renderedContent ?? null;
  const pressItems = parsePressItemsFromGrounding(groundingMetadata);

  const sources: IGroundingSource[] = [];
  const groundingChunks = groundingMetadata?.groundingChunks ?? [];
  for (const chunk of groundingChunks) {
    const title = chunk.web?.title;
    const uri = chunk.web?.uri;
    if (title && uri) {
      sources.push({ title, uri });
    }
  }

  return { text, renderedContent, sources, pressItems };
}
