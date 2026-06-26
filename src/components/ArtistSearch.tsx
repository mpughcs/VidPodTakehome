"use client"

import { useState, useCallback, useRef, useEffect } from "react"

/** Artist shape returned by Spotify search (used in onSelect) */
export interface SpotifyArtist {
  id: string
  name: string
  imageUrl: string | null
  url: string | null
}

interface ArtistSearchProps {
  onSelect?: (artist: SpotifyArtist) => void
  placeholder?: string
  className?: string
  limit?: number
  id?: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debouncedValue
}

async function searchArtists(
  query: string,
  limit: number
): Promise<SpotifyArtist[]> {
  if (!query.trim()) return []
  const params = new URLSearchParams({ q: query.trim(), limit: String(limit) })
  const res = await fetch(`/api/spotify/search-artists?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? "Search failed")
  }
  const data = await res.json()
  return data.artists ?? []
}

export function ArtistSearch({
  onSelect,
  placeholder = "Search for an artist...",
  className = "",
  limit = 8,
  id,
}: ArtistSearchProps) {
  const [query, setQuery] = useState("")
  const [artists, setArtists] = useState<SpotifyArtist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setArtists([])
      setLoading(false)
      setOpen(false)
      return
    }
    setError(null)
    setLoading(true)
    setOpen(true)
    setFocusedIndex(-1)
    searchArtists(debouncedQuery, limit)
      .then((list) => {
        setArtists(list)
      })
      .catch(() => {
        setError("Could not load suggestions")
        setArtists([])
      })
      .finally(() => setLoading(false))
  }, [debouncedQuery, limit])

  const handleSelect = useCallback(
    (artist: SpotifyArtist) => {
      setQuery(artist.name)
      setOpen(false)
      setArtists([])
      setFocusedIndex(-1)
      onSelect?.(artist)
    },
    [onSelect]
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open || focusedIndex < 0) return
    const el = listRef.current?.children[focusedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest" })
  }, [focusedIndex, open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || artists.length === 0) {
      if (e.key === "Escape") setOpen(false)
      return
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setFocusedIndex((i) => (i < artists.length - 1 ? i + 1 : i))
        break
      case "ArrowUp":
        e.preventDefault()
        setFocusedIndex((i) => (i > 0 ? i - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (focusedIndex >= 0 && artists[focusedIndex]) {
          handleSelect(artists[focusedIndex])
        }
        break
      case "Escape":
        setOpen(false)
        setFocusedIndex(-1)
        break
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full max-w-md ${className}`}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => (artists.length > 0 || loading || error) && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="artist-suggestions"
          aria-activedescendant={
            focusedIndex >= 0 ? `artist-suggestion-${focusedIndex}` : undefined
          }
          className="block w-full appearance-none rounded-xl border border-border bg-surface-raised py-3 pl-4 pr-10 text-text-primary placeholder-text-muted focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 sm:text-sm"
        />
        {loading && (
          <div
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden
          >
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      {open && (artists.length > 0 || error || (loading && !artists.length)) && (
        <ul
          id="artist-suggestions"
          ref={listRef}
          role="listbox"
          className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {error && (
            <li className="px-4 py-3 text-sm text-text-muted" role="option">
              {error}
            </li>
          )}
          {!error &&
            artists.map((artist, i) => {
              const isFocused = i === focusedIndex
              return (
                <li
                  key={artist.id}
                  id={`artist-suggestion-${i}`}
                  role="option"
                  aria-selected={isFocused}
                  onMouseEnter={() => setFocusedIndex(i)}
                  onClick={() => handleSelect(artist)}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    isFocused ? "bg-surface-raised text-text-primary" : "text-text-secondary hover:bg-surface-raised"
                  }`}
                >
                  {artist.imageUrl ? (
                    <img
                      src={artist.imageUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover bg-surface-overlay"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-full bg-surface-overlay flex items-center justify-center text-text-muted text-xs font-medium">
                      {artist.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate font-medium">{artist.name}</span>
                </li>
              )
            })}
        </ul>
      )}
    </div>
  )
}
