"use client"

import { WidgetStyleE, type WidgetArticle } from "@/components/Hero"

export interface GroundingSource {
  title: string
  uri: string
}

export interface PressItem {
  headline: string
  url: string
  date: string
  publication: string
  publicationImageUrl?: string | null
  quote?: string | null
  trendingUp?: boolean | null
}

export interface ArtistSearchResult {
  artistId: string
  artistName: string
  text: string
  renderedContent: string | null
  sources: GroundingSource[]
  numPressItems: number
  pressItems: PressItem[]
}

interface GroundedSearchResultsProps {
  result: ArtistSearchResult
}

function toWidgetArticles(items: PressItem[]): WidgetArticle[] {
  return items.map((item) => ({
    title: item.headline,
    publication: item.publication,
    publication_image:
      item.publicationImageUrl ??
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.publication)}&sz=128`,
    date: item.date,
    quote: item.quote ?? undefined,
    url: item.url,
    trendingUp: item.trendingUp ?? false,
  }))
}

export function GroundedSearchResults({ result }: GroundedSearchResultsProps) {
  const articles = toWidgetArticles(result.pressItems)

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl text-left">
      {result.renderedContent && (
        <div
          className="mb-4 overflow-x-auto rounded-xl border border-border bg-surface p-2"
          dangerouslySetInnerHTML={{ __html: result.renderedContent }}
        />
      )}

      {articles.length > 0 ? (
        <WidgetStyleE
          articles={articles}
          heading={`Press coverage for ${result.artistName}`}
        />
      ) : (
        result.text && (
          <div className="rounded-xl border border-border bg-surface-raised p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
              {result.text}
            </p>
          </div>
        )
      )}
    </div>
  )
}
