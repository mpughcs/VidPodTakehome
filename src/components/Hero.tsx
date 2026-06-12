"use client"

import { useEffect, useState } from "react"
import { Container } from "@/components/Container"
import { IoIosTrendingUp } from "react-icons/io";
import { IoIosTrendingDown } from "react-icons/io";
import { SpotifyEmbedWidget } from "@/components/SpotifyEmbedWidget"
import { ArtistSearch, SpotifyArtist } from "@/components/ArtistSearch"
import {
  GroundedSearchResults,
  type ArtistSearchResult,
} from "@/components/GroundedSearchResults"
import { getFirebaseFunctions } from "@/lib/firebase"
import { httpsCallable } from "firebase/functions"

const demoArticles = [
  {
    title: 'Sunday Mourners, "A-Rhythm Absolute"',
    publication: "Bandcamp Daily",
    publication_image: "https://f4.bcbits.com/img/a1887096367_16.jpg",
    date: "Jan 20, 2026",
    trendingUp: true,
    quote: "It's a great time to be an indie band making anything that sounds post-punk.",
    url: "https://daily.bandcamp.com/album-of-the-day/sunday-mourners-a-rhythm-absolute-review",
  },
  {
    title: "Albums Of The Week: Sunday Mourners | A-Rhythm Absolute",
    publication: "Tinnitist",
    publication_image: "https://tinnitist.com/wp-content/uploads/2026/01/Sunday-Mourners-A-Rhythm-Absolute.jpg",
    date: "Jan 15, 2026",
    trendingUp: false,
    quote: "Sunday Mourners are here and it is OK. It is OK to feel good about indie music again.",
    url: "https://tinnitist.com/2026/01/15/albums-of-the-we ek-sunday-mourners-a-rhythm-absolute/",
  },
  {
    title: "Sunday Mourners' debut album establishes fresh voice in indie rock",
    publication: "The Tulane Hullabaloo",
    publication_image: "https://tulanehullabaloo.com/wp-content/uploads/2026/01/sunday-mourners-a-rhythm-absolute-review.jpg",
    date: "Jan 25, 2026",
    trendingUp: true,
    quote: "A new Los Angeles band has joined this wave, carving out their own path.",
    url: "https://tulanehullabaloo.com/72670/arcade/sunday-mourners-debut-album-establishes-fresh-voice-in-indie-rock/",
  },
  {
    title: "Sunday Mourners – A-Rhythm Absolute",
    publication: "Add To Wantlist",
    publication_image: "https://addtowantlist.com/wp-content/uploads/2026/01/sunday-mourners-a-rhythm-absolute-review.jpg",
    date: "Jan 21, 2026",
    trendingUp: false,
    quote: "It's wonderful to see L.A.'s Sunday Mourners arrive fully formed on their first full-length.",
    url: "https://addtowantlist.com/index.php/2026/01/21/album-review-sunday-mourners-a-rhythm-absolute/",
  },
]

export interface WidgetArticle {
  title: string
  publication: string
  publication_image: string
  date: string
  trendingUp?: boolean
  quote?: string
  url: string
}

// Style E: Horizontal Cards / Grid
// Best for: Wide layouts, press pages, portfolio sites
export function WidgetStyleE({
  articles,
  heading = "Recent",
}: {
  articles: WidgetArticle[]
  heading?: string
}) {
  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{heading}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {articles.slice(0, 4).map((article, i) => (
          <a
            key={article.url || i}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-3 max-w-52 rounded-lg border border-border hover:border-border-strong hover:shadow-sm transition-all bg-surface ${i === 0 ? " drop-shadow-lg " : ""}`}
          >
            <div className="flex flex-col items-start justify-start text-left ">
              <img
                src={article.publication_image}
                alt=""
                className="w-20 h-20 rounded object-cover bg-surface-overlay"
              />
              <div className="flex items-center justify-start gap-1 my-1">
                <p className="text-[10px] font-medium text-brand uppercase tracking-wide">
                  {article.publication}
                </p>
                {article.trendingUp && (
                  <IoIosTrendingUp className="w-3.5 h-3.5 text-success" />
                )}
              </div>
              <h4 className="text-sm font-medium text-text-primary mt-1 line-clamp-2 leading-snug">
                {article.title}
              </h4>
              {article.date && (
                <p className="text-[10px] text-text-muted mt-2">{article.date}</p>
              )}
              {article.quote && (
                <p className="text-xs text-text-tertiary mt-1 italic line-clamp-1">
                  &ldquo;{article.quote}&rdquo;
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

// Style A: Card List (Clean, Spotify-like)
// Best for: Artist websites, EPKs, sidebar widgets
function WidgetStyleA() {
  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle bg-surface-raised">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-text-primary text-sm">Sunday Mourners</h3>
            <p className="text-xs text-text-tertiary">Press Coverage</p>
          </div>
          <div className="text-[10px] text-text-muted">clippings</div>
        </div>
      </div>
      <div className="divide-y divide-border-subtle max-h-72 overflow-y-auto">
        {demoArticles.slice(0, 4).map((article, i) => (
          <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 px-4 py-3 hover:bg-surface-raised transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-xs font-medium text-brand">{article.publication}</p>
                {article.trendingUp ? (
                  <IoIosTrendingUp className="w-3.5 h-3.5 text-success" />
                ) : (
                  <IoIosTrendingDown className="w-3.5 h-3.5 text-text-muted" />
                )}
              </div>
              <h4 className="text-sm font-medium text-text-primary leading-snug line-clamp-2">{article.title}</h4>
              <p className="text-xs text-text-tertiary mt-1 italic line-clamp-1">
                &ldquo;{article.quote}&rdquo;
              </p>
            </div>
            <span className="text-[10px] text-text-muted whitespace-nowrap">{article.date}</span>
          </a>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-border-subtle bg-surface-raised text-center">
        <p className="text-[10px] text-text-muted">Powered by <span className="font-medium">Clippings</span></p>
      </div>
    </div>
  )
}



// Demo showcase component with tabs
const widgetStyles = [
  { id: "grid", name: "Grid Cards", description: "For press pages", component: () => <WidgetStyleE articles={demoArticles} /> },
  { id: "spotify-embed", name: "Spotify Embed", description: "Clean modular embed", component: SpotifyEmbedWidget },
]

// Browser mockup component
function BrowserMockup({ children, url = "sundaymourners.com" }: { children: React.ReactNode, url?: string }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-border-subtle bg-surface px-4 py-2.5">
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/70"></div>
        </div>
        {/* URL bar */}
        <div className="mx-2 flex flex-1 justify-center">
          <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-border-subtle bg-surface-overlay px-3 py-1.5 text-xs text-text-tertiary">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="truncate">{url}</span>
          </div>
        </div>
        <div className="h-4 w-4" aria-hidden="true" />
      </div>
      {/* Browser content */}
      <div className="bg-surface">{children}</div>
    </div>
  )
}

// Unified fake artist website - consistent layout for all widget styles
function FakeArtistSite({
  children,
  widgetPosition = "sidebar",
  widgetTheme = "light",
}: {
  children: React.ReactNode
  widgetPosition?: "sidebar" | "main"
  widgetTheme?: "light" | "dark"
}) {
  const widgetThemeClassName = widgetTheme === "dark" ? "dark" : ""
  return (
    <div className="h-[520px] flex flex-col">
      <div className="relative h-28 overflow-hidden bg-[url('/images/band.png')] bg-cover bg-center">
        {/* <img src="/images/band.png" alt="Sunday Mourners" className="object-cover w-full h-full" /> */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative flex h-full items-end justify-between px-6 pb-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-white">
              Sunday Mourners
            </h2>
            <p className="mt-0.5 text-[11px] text-white/70">
              Los Angeles, CA · Post-Punk / Art Rock
            </p>
          </div>
          <div className="hidden shrink-0 items-center gap-3 text-[11px] font-medium text-white/80 sm:flex">
            <span className="opacity-90">Music</span>
            <span className="opacity-90">Shows</span>
            <span className="opacity-90">Press</span>
          </div>
        </div>
      </div>

      {/* Artist content area - fills remaining space */}
      <div className="flex-1 overflow-hidden p-6">
        {widgetPosition === "sidebar" ? (
          <div className="grid h-full grid-cols-[1fr_320px] gap-6">
            {/* Main page content (understated mock copy) */}
            <div className="min-w-0">

              <h3 className="mt-2 text-sm font-semibold leading-snug text-text-primary">
                If your work is getting press, you should know!
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-text-tertiary">
                Clippings finds and catalogs your press coverage, so you can stay on top of your brand's visibility.
              </p>

              <div className="mt-4 space-y-2 text-xs text-text-secondary  pl-4 text-left ">
                <div className="flex items-start gap-2">
                  <p className="text-text-muted">1.</p>
                  <p className="leading-snug">Register your brand</p>
                </div>
                <div className="flex items-start gap-2">
                  <p className="text-text-muted">2.</p>
                  <p className="leading-snug">Clippings automatically <span className="font-bold">finds</span>, <span className="font-bold text-primary">catalogs</span>, and <span className="font-bold text-primary">notifies</span> you of new press</p>
                </div>
                <div className="flex items-start gap-2">
                  <p className="text-text-muted">3.</p>
                  <p className="leading-snug text-left">Embed in your site, host a static press page, or share with your team</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border-subtle bg-surface-overlay p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                    Install
                  </p>
                  <span className="text-[10px] text-text-muted">demo</span>
                </div>
                <div className="mt-3 rounded-xl bg-surface px-3 py-2 font-mono text-[10px] text-text-tertiary">
                  {`<script src="https://clippings.app/widget.js"></script>`}
                  <br />
                  {`<div data-widget="press" data-style="list"></div>`}
                </div>
                {/* subtle “mock” skeleton bars */}
                <div className="mt-4 space-y-2">
                  <div className="h-2 w-5/6 rounded bg-surface/80" />
                  <div className="h-2 w-2/3 rounded bg-surface/80" />
                  <div className="h-2 w-3/4 rounded bg-surface/80" />
                </div>
              </div>
            </div>

            {/* Widget slot (what we’re showcasing) */}
            <aside className="h-full overflow-hidden rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm dark:border-text-invert/10 dark:bg-surface-invert dark:text-text-invert">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  Widget
                </p>
                <span className="text-[10px] text-text-muted">clippings</span>
              </div>
              <div className="flex h-[calc(100%-28px)] items-start justify-center overflow-hidden">
                <div className={widgetThemeClassName}>{children}</div>
              </div>
            </aside>
          </div>
        ) : (
          /* Full width widget layout */
          <div className="h-full flex flex-col">
            <p className="text-[10px] uppercase tracking-widest text-text-muted mb-3 font-medium shrink-0">Press Coverage</p>
            <div className="flex-1 overflow-hidden rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm dark:border-text-invert/10 dark:bg-surface-invert dark:text-text-invert">
              <div className="flex h-full items-start justify-center overflow-auto">
                <div className={widgetThemeClassName}>{children}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ClippingsWidgetDemo() {
  const [activeStyle, setActiveStyle] = useState("grid")
  const [widgetTheme, setWidgetTheme] = useState<"light" | "dark">("light")
  const ActiveComponent = widgetStyles.find(s => s.id === activeStyle)?.component || WidgetStyleA

  // Determine widget position based on style
  const widgetPosition: "sidebar" | "main" = "sidebar"

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* If/when we add a right-side picker, we can reintroduce a 2-col grid. */}
      <div className="grid items-start gap-6">
        <div className="mx-auto w-full">
          <BrowserMockup url="sundaymourners.com/press">
            <FakeArtistSite widgetPosition={widgetPosition} widgetTheme={widgetTheme}>
              <ActiveComponent />
            </FakeArtistSite>
          </BrowserMockup>
        </div>
      </div>
      {/* Embed code preview */}
      {/* <div className="mt-6 p-4 bg-surface-invert rounded-lg text-left">
        <p className="text-xs text-text-muted mb-2">Embed code</p>
        <code className="text-xs text-success font-mono">
          {`<div id="clippings" data-artist="sunday-mourners" data-style="${activeStyle}"></div>`}
          <br />
          {`<script src="https://clippings.app/widget.js"></script>`}
        </code>
      </div> */}
    </div>
  )
}



export function Hero() {
  const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null)
  const [searchResult, setSearchResult] = useState<ArtistSearchResult | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedArtist) return

    setSearchLoading(true)
    setSearchError(null)
    setSearchResult(null)

    const functions = getFirebaseFunctions()
    const receiveSelectedArtist = httpsCallable(functions, "receiveSelectedArtist")
    receiveSelectedArtist({
      artistId: selectedArtist.id,
      artistName: selectedArtist.name,
    })
      .then((result) => {
        setSearchResult(result.data as ArtistSearchResult)
      })
      .catch((err) => {
        console.error("receiveSelectedArtist error:", err)
        setSearchError("Could not fetch press coverage. Try again.")
      })
      .finally(() => setSearchLoading(false))
  }, [selectedArtist])

  return (
    <Container className="pt-20 pb-16 text-center lg:pt-20">
      <h1 className="mx-auto max-w-4xl font-young text-5xl font-medium tracking-tight text-text-primary sm:text-7xl">
        All your press, <br />{" "}
        <span className="relative whitespace-nowrap text-brand">
          <svg
            aria-hidden="true"
            viewBox="0 0 418 42"
            className="absolute top-2/3 left-0 h-[0.58em] w-full fill-yellow-400"
            preserveAspectRatio="none"
          >

            <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
          </svg>
          <span className="relative">one place</span>
        </span>{" "}

      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-text-secondary">
        Clippings finds and displays your media coverage so you can stay on top of your brand's visibility.
      </p>

      <div className="mx-auto mt-8 flex flex-col items-center gap-2">
        <label htmlFor="artist-search" className="text-sm font-medium text-text-secondary">
          Find your artist
        </label>
        <ArtistSearch
          id="artist-search"
          placeholder="Search for an artist..."
          onSelect={setSelectedArtist}
          className="w-full"
        />
        {searchLoading && (
          <p className="text-sm text-text-muted">Searching press coverage…</p>
        )}
        {searchError && (
          <p className="text-sm text-destructive">{searchError}</p>
        )}
        {searchResult && <GroundedSearchResults result={searchResult} />}
      </div>

      {/* Widget Demo */}
      <div className="mt-5 flex ">

        <ClippingsWidgetDemo />
      </div>

   

    </Container>
  )
}
