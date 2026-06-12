import { NextRequest, NextResponse } from "next/server"

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
const SPOTIFY_API_BASE = "https://api.spotify.com/v1"

async function getAccessToken(): Promise<string> {
  const clientId = (process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "").trim()
  const clientSecret = (
    process.env.SPOTIFY_CLIENT_SECRET ??
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET ??
    ""
  ).trim()

  if (!clientId || !clientSecret) {
    throw new Error("Spotify client ID or secret not configured")
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Spotify token failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data.access_token
}

export interface SpotifySearchArtist {
  id: string
  name: string
  imageUrl: string | null
  url: string | null
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")
  const rawLimit = Number(request.nextUrl.searchParams.get("limit")) || 8
  const limit = Math.min(10, Math.max(1, rawLimit))

  if (!q || !q.trim()) {
    return NextResponse.json({ artists: [] })
  }

  try {
    const token = await getAccessToken()
    const searchParams = new URLSearchParams({
      q: q.trim(),
      type: "artist",
      limit: String(limit),
    })
    const res = await fetch(
      `${SPOTIFY_API_BASE}/search?${searchParams}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: "Spotify search failed", details: text },
        { status: res.status }
      )
    }

    const data = await res.json()
    const items = data?.artists?.items ?? []

    const artists: SpotifySearchArtist[] = items.map((a: {
      id: string
      name: string
      images?: Array<{ url: string }>
      external_urls?: { spotify?: string }
    }) => {
      const img = Array.isArray(a.images) && a.images.length > 0
        ? a.images[0].url
        : null
      return {
        id: a.id,
        name: a.name,
        imageUrl: img ?? null,
        url: a.external_urls?.spotify ?? null,
      }
    })

    return NextResponse.json({ artists })
  } catch (err) {
    console.error("Spotify search-artists error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    )
  }
}
