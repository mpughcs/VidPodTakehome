import { IPressItem } from "./Types";

interface GroundingSegment {
  text?: string;
}

interface GroundingSupport {
  segment?: GroundingSegment;
  groundingChunkIndices?: number[];
}

interface GroundingChunk {
  web?: { title?: string; uri?: string };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
}

function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

function formatPublication(domain: string): string {
  const name = domain.replace(/^www\./, "").split(".")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function extractHeadline(text: string): string {
  const boldMatch = text.match(/\*\*([^*]+)\*\*/);
  if (boldMatch) return boldMatch[1].replace(/:$/, "").trim();
  const plainMatch = text.match(/^([^:]+):/);
  return plainMatch ? plainMatch[1].trim() : "";
}

function extractDate(text: string): string {
  const match = text.match(
    /(?:published on|posted on|from|on)\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i
  );
  return match ? match[1] : "";
}

function extractQuote(text: string): string {
  const match = text.match(/"([^"]+)"/);
  return match ? match[1] : "";
}

export function parsePressItemsFromGrounding(
  groundingMetadata: GroundingMetadata | undefined
): IPressItem[] {
  const chunks = groundingMetadata?.groundingChunks ?? [];
  const supports = groundingMetadata?.groundingSupports ?? [];

  return chunks
    .map((chunk, chunkIndex): IPressItem | null => {
      const domain = chunk.web?.title ?? "";
      const uri = chunk.web?.uri ?? "";
      if (!domain || !uri) return null;

      const segmentText = supports
        .filter((s) => s.groundingChunkIndices?.includes(chunkIndex))
        .map((s) => s.segment?.text ?? "")
        .join(" ")
        .trim();

      const headline = extractHeadline(segmentText) || formatPublication(domain);

      return {
        headline,
        url: uri,
        date: extractDate(segmentText),
        publication: formatPublication(domain),
        publicationImageUrl: faviconUrl(domain),
        quote: extractQuote(segmentText) || null,
        source: domain,
        trendingUp: chunkIndex === 0,
      };
    })
    .filter((item): item is IPressItem => item !== null);
}
