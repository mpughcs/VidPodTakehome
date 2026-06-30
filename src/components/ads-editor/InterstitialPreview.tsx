"use client"

import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react"

import { useAdsTimeline } from "@/context/AdsTimelineContext"
import { adsToMap } from "@/lib/ads-db"
import {
  clearMarkerAdSelectionsBeforeContentTime,
  clearServedMarkersBeforeContentTime,
  episodeTimeToContentTime,
  getAdSlotDuration,
  getDisplayContentTime,
  resolveAdForMarker,
  resolvePlaybackAtContentTime,
  type MarkerAdSelection,
} from "@/lib/interstitial-playback"
import type { AdMarker } from "@/types/ad-marker"

type InterstitialPreviewProps = {
  episodeSrc: string
  playing: boolean
  onPlayingChange: (playing: boolean) => void
}

type Phase = "episode" | "ad"

function playAfterSeek(
  video: HTMLVideoElement,
  token: number,
  playbackTokenRef: RefObject<number>,
  playingRef: RefObject<boolean>,
  onFailure: () => void,
  onPending: (abort: () => void) => void
) {
  const start = () => {
    if (token !== playbackTokenRef.current || !playingRef.current) return

    void video
      .play()
      .then(() => {
        if (token !== playbackTokenRef.current || !playingRef.current) {
          video.pause()
        }
      })
      .catch((error) => {
        if (token !== playbackTokenRef.current) return
        if (error instanceof Error && error.name === "AbortError") return
        onFailure()
      })
  }

  let seekedHandler: (() => void) | null = null
  const abort = () => {
    if (seekedHandler) {
      video.removeEventListener("seeked", seekedHandler)
      seekedHandler = null
    }
  }
  onPending(abort)

  if (video.seeking) {
    seekedHandler = start
    video.addEventListener("seeked", seekedHandler, { once: true })
    return
  }

  start()
}

export function InterstitialPreview({
  episodeSrc,
  playing,
  onPlayingChange,
}: InterstitialPreviewProps) {
  const {
    playbackMarkers,
    ads,
    episodeDurationSeconds,
    seekTime,
    seekNonce,
    setCurrentTime,
    setIsAdPlaying,
    skipAdNonce,
  } = useAdsTimeline()

  const episodeRef = useRef<HTMLVideoElement>(null)
  const adRef = useRef<HTMLVideoElement>(null)
  const phaseRef = useRef<Phase>("episode")
  const activeMarkerIdRef = useRef<string | null>(null)
  const adOffsetRef = useRef(0)
  const lastEpisodeTimeRef = useRef(0)
  const servedMarkerIdsRef = useRef(new Set<string>())
  const markerAdSelectionRef = useRef<MarkerAdSelection>(new Map())
  const lastSeekRef = useRef({ time: seekTime, nonce: seekNonce })
  const prevEpisodeSrcRef = useRef(episodeSrc)
  const playingRef = useRef(playing)
  const playbackTokenRef = useRef(0)
  const isSeekingRef = useRef(false)
  const pendingPlaybackAbortRef = useRef<(() => void) | null>(null)

  const adsById = useMemo(() => adsToMap(ads), [ads])
  const adsByIdRef = useRef(adsById)
  adsByIdRef.current = adsById
  const adResolveOptions = useMemo(
    () => ({
      allAds: ads,
      selection: markerAdSelectionRef.current,
    }),
    [ads]
  )
  const adResolveOptionsRef = useRef(adResolveOptions)
  adResolveOptionsRef.current = adResolveOptions
  const playbackMarkersRef = useRef(playbackMarkers)
  playbackMarkersRef.current = playbackMarkers

  const resolveActiveMarker = useCallback((): AdMarker | null => {
    const markerId = activeMarkerIdRef.current
    if (!markerId) return null
    return playbackMarkers.find((marker) => marker.id === markerId) ?? null
  }, [playbackMarkers])

  playingRef.current = playing

  const cancelPendingPlayback = useCallback(() => {
    playbackTokenRef.current += 1
    pendingPlaybackAbortRef.current?.()
    pendingPlaybackAbortRef.current = null
  }, [])

  const pauseAll = useCallback(() => {
    episodeRef.current?.pause()
    adRef.current?.pause()
  }, [])

  const onPlayFailure = useCallback(() => {
    onPlayingChange(false)
  }, [onPlayingChange])

  const playActiveVideo = useCallback(() => {
    const token = playbackTokenRef.current
    const registerPending = (abort: () => void) => {
      pendingPlaybackAbortRef.current?.()
      pendingPlaybackAbortRef.current = abort
    }

    if (phaseRef.current === "episode") {
      const episode = episodeRef.current
      if (episode) {
        playAfterSeek(
          episode,
          token,
          playbackTokenRef,
          playingRef,
          onPlayFailure,
          registerPending
        )
      }
      return
    }

    const ad = adRef.current
    if (ad) {
      playAfterSeek(
        ad,
        token,
        playbackTokenRef,
        playingRef,
        onPlayFailure,
        registerPending
      )
    }
  }, [onPlayFailure])

  const resumeIfPlaying = useCallback(() => {
    if (!playingRef.current) return
    playActiveVideo()
  }, [playActiveVideo])

  const showEpisode = useCallback(
    (episodeTime: number, contentTime?: number) => {
      const episode = episodeRef.current
      const ad = adRef.current
      if (!episode) return null

      phaseRef.current = "episode"
      activeMarkerIdRef.current = null
      adOffsetRef.current = 0

      pauseAll()
      if (ad) {
        ad.muted = true
        ad.style.visibility = "hidden"
      }
      episode.style.visibility = "visible"
      setIsAdPlaying(false)

      const clamped = Math.min(
        Math.max(0, episodeTime),
        Math.max(
          episode.duration || episodeDurationSeconds,
          episodeDurationSeconds
        )
      )
      const didSeek = Math.abs(episode.currentTime - clamped) > 0.05
      if (didSeek) {
        isSeekingRef.current = true
        episode.currentTime = clamped
      }
      lastEpisodeTimeRef.current = clamped
      episode.pause()

      const displayTime =
        contentTime ??
        episodeTimeToContentTime(
          clamped,
          playbackMarkersRef.current,
          servedMarkerIdsRef.current
        )
      setCurrentTime(displayTime)
      return didSeek ? episode : null
    },
    [episodeDurationSeconds, pauseAll, setCurrentTime, setIsAdPlaying]
  )

  const resumeAfterAdRef = useRef<(marker: AdMarker) => void>(() => {})

  const showAd = useCallback(
    (marker: AdMarker, adOffset: number) => {
      const episode = episodeRef.current
      const adVideo = adRef.current
      if (!episode || !adVideo) return null

      const ad = resolveAdForMarker(marker, adsById, adResolveOptionsRef.current)
      phaseRef.current = "ad"
      activeMarkerIdRef.current = marker.id
      adOffsetRef.current = adOffset

      pauseAll()
      episode.style.visibility = "hidden"
      if (Math.abs(episode.currentTime - marker.startSeconds) > 0.05) {
        episode.currentTime = marker.startSeconds
      }
      lastEpisodeTimeRef.current = marker.startSeconds

      if (!ad?.src) {
        resumeAfterAdRef.current(marker)
        return null
      }

      adVideo.style.visibility = "visible"
      adVideo.muted = false
      setIsAdPlaying(true)
      if (adVideo.src !== ad.src) {
        adVideo.src = ad.src
      }

      const slotDuration = getAdSlotDuration(marker)
      const clampedOffset = Math.min(Math.max(0, adOffset), slotDuration)
      const didSeek = Math.abs(adVideo.currentTime - clampedOffset) > 0.05
      if (didSeek) {
        isSeekingRef.current = true
        adVideo.currentTime = clampedOffset
      }
      adVideo.pause()

      setCurrentTime(getDisplayContentTime("ad", 0, marker, clampedOffset))
      return didSeek ? adVideo : null
    },
    [adsById, pauseAll, setCurrentTime, setIsAdPlaying]
  )

  const showEpisodeRef = useRef(showEpisode)
  showEpisodeRef.current = showEpisode
  const showAdRef = useRef(showAd)
  showAdRef.current = showAd
  const cancelPendingPlaybackRef = useRef(cancelPendingPlayback)
  cancelPendingPlaybackRef.current = cancelPendingPlayback
  const pauseAllRef = useRef(pauseAll)
  pauseAllRef.current = pauseAll
  const resumeIfPlayingRef = useRef(resumeIfPlaying)
  resumeIfPlayingRef.current = resumeIfPlaying

  const resumeAfterSeek = useCallback((seekedVideo: HTMLVideoElement | null) => {
    if (!playingRef.current) {
      isSeekingRef.current = false
      return
    }

    if (seekedVideo) {
      seekedVideo.addEventListener(
        "seeked",
        () => {
          isSeekingRef.current = false
          resumeIfPlayingRef.current()
        },
        { once: true }
      )
      return
    }

    isSeekingRef.current = false
    resumeIfPlayingRef.current()
  }, [])

  const resumeAfterSeekRef = useRef(resumeAfterSeek)
  resumeAfterSeekRef.current = resumeAfterSeek

  const resumeAfterAd = useCallback(
    (marker: AdMarker) => {
      servedMarkerIdsRef.current.add(marker.id)
      cancelPendingPlayback()

      const contentTime = marker.endSeconds
      const resolved = resolvePlaybackAtContentTime(
        contentTime,
        playbackMarkersRef.current,
        adsByIdRef.current,
        {
          ...adResolveOptionsRef.current,
          servedMarkerIds: servedMarkerIdsRef.current,
        }
      )

      const seekedVideo =
        resolved.kind === "ad"
          ? showAdRef.current(resolved.marker, resolved.adOffset)
          : showEpisodeRef.current(resolved.episodeTime, contentTime)

      resumeAfterSeekRef.current(seekedVideo)
    },
    [cancelPendingPlayback]
  )
  resumeAfterAdRef.current = resumeAfterAd

  useEffect(() => {
    const last = lastSeekRef.current
    if (last.time === seekTime && last.nonce === seekNonce) return
    lastSeekRef.current = { time: seekTime, nonce: seekNonce }

    cancelPendingPlaybackRef.current()
    isSeekingRef.current = true
    pauseAllRef.current()

    clearServedMarkersBeforeContentTime(
      seekTime,
      servedMarkerIdsRef.current,
      playbackMarkersRef.current
    )
    clearMarkerAdSelectionsBeforeContentTime(
      seekTime,
      markerAdSelectionRef.current,
      playbackMarkersRef.current
    )

    const resolved = resolvePlaybackAtContentTime(
      seekTime,
      playbackMarkersRef.current,
      adsByIdRef.current,
      {
        ...adResolveOptionsRef.current,
        servedMarkerIds: servedMarkerIdsRef.current,
      }
    )

    const seekedVideo =
      resolved.kind === "ad"
        ? showAdRef.current(resolved.marker, resolved.adOffset)
        : showEpisodeRef.current(resolved.episodeTime, seekTime)

    resumeAfterSeekRef.current(seekedVideo)
  }, [seekTime, seekNonce])

  useEffect(() => {
    if (!playing) {
      cancelPendingPlaybackRef.current()
      pauseAllRef.current()
      return
    }

    resumeIfPlayingRef.current()
  }, [playing])

  useEffect(() => {
    const episode = episodeRef.current
    if (!episode) return

    function onEpisodeTimeUpdate() {
      if (isSeekingRef.current || episode!.seeking) return
      if (phaseRef.current !== "episode" || !playingRef.current) return

      const previousTime = lastEpisodeTimeRef.current
      const episodeTime = episode!.currentTime
      lastEpisodeTimeRef.current = episodeTime

      const markers = playbackMarkersRef.current
      const served = servedMarkerIdsRef.current
      const previousContent = episodeTimeToContentTime(previousTime, markers, served)
      const currentContent = episodeTimeToContentTime(episodeTime, markers, served)

      setCurrentTime(currentContent)

      for (const marker of [...markers].sort(
        (a, b) => a.startSeconds - b.startSeconds
      )) {
        if (served.has(marker.id)) continue
        if (
          previousContent < marker.startSeconds &&
          currentContent >= marker.startSeconds - 0.05
        ) {
          const ad = resolveAdForMarker(marker, adsById, adResolveOptionsRef.current)
          if (!ad?.src) break
          cancelPendingPlaybackRef.current()
          isSeekingRef.current = true
          pauseAllRef.current()
          const seekedVideo = showAdRef.current(marker, 0)
          resumeAfterSeekRef.current(seekedVideo)
          break
        }
      }
    }

    episode.addEventListener("timeupdate", onEpisodeTimeUpdate)
    return () => episode.removeEventListener("timeupdate", onEpisodeTimeUpdate)
  }, [adsById, setCurrentTime])

  useEffect(() => {
    const adVideo = adRef.current
    if (!adVideo) return

    function onAdTimeUpdate() {
      if (isSeekingRef.current || adVideo!.seeking) return
      if (phaseRef.current !== "ad") return

      const marker = playbackMarkersRef.current.find(
        (item) => item.id === activeMarkerIdRef.current
      )
      if (!marker) return

      const slotDuration = getAdSlotDuration(marker)
      const offset = adVideo!.currentTime

      adOffsetRef.current = offset
      setCurrentTime(getDisplayContentTime("ad", 0, marker, offset))

      if (offset >= slotDuration - 0.08) {
        resumeAfterAdRef.current(marker)
      }
    }

    function onAdEnded() {
      const marker = playbackMarkersRef.current.find(
        (item) => item.id === activeMarkerIdRef.current
      )
      if (!marker) return
      resumeAfterAdRef.current(marker)
    }

    adVideo.addEventListener("timeupdate", onAdTimeUpdate)
    adVideo.addEventListener("ended", onAdEnded)
    return () => {
      adVideo.removeEventListener("timeupdate", onAdTimeUpdate)
      adVideo.removeEventListener("ended", onAdEnded)
    }
  }, [setCurrentTime])

  useEffect(() => {
    if (skipAdNonce === 0) return
    if (phaseRef.current !== "ad") return
    const marker = resolveActiveMarker()
    if (!marker) return
    resumeAfterAdRef.current(marker)
  }, [skipAdNonce, resolveActiveMarker])

  useEffect(() => {
    if (prevEpisodeSrcRef.current === episodeSrc) return

    prevEpisodeSrcRef.current = episodeSrc
    lastSeekRef.current = { time: 0, nonce: -1 }
    cancelPendingPlaybackRef.current()
    isSeekingRef.current = true
    pauseAllRef.current()
    const seekedVideo = showEpisodeRef.current(0)
    resumeAfterSeekRef.current(seekedVideo)

    return () => {
      cancelPendingPlaybackRef.current()
      pauseAllRef.current()
    }
  }, [episodeSrc])

  useEffect(() => {
    return () => {
      cancelPendingPlaybackRef.current()
      pauseAllRef.current()
    }
  }, [])

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={episodeRef}
        src={episodeSrc}
        className="absolute inset-0 h-full w-full object-contain"
        playsInline
        preload="auto"
      />
      <video
        ref={adRef}
        className="absolute inset-0 h-full w-full object-contain"
        style={{ visibility: "hidden" }}
        playsInline
        preload="auto"
        muted
      />
    </div>
  )
}
