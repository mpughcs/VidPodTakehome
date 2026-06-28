"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"

import { useAdsTimeline } from "@/context/AdsTimelineContext"
import { adsToMap } from "@/lib/ads-db"
import {
  clearMarkerAdSelectionsBeforeContentTime,
  clearServedMarkersBeforeContentTime,
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
  const lastSeekRef = useRef(seekTime)
  const playingRef = useRef(playing)

  const adsById = useMemo(() => adsToMap(ads), [ads])
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

  const pauseAll = useCallback(() => {
    episodeRef.current?.pause()
    adRef.current?.pause()
  }, [])

  const playVideo = useCallback(
    (video: HTMLVideoElement | null) => {
      if (!video) return
      void video.play().catch(() => {
        onPlayingChange(false)
      })
    },
    [onPlayingChange]
  )

  const showEpisode = useCallback(
    (episodeTime: number, shouldPlay: boolean) => {
      const episode = episodeRef.current
      const ad = adRef.current
      if (!episode) return

      phaseRef.current = "episode"
      activeMarkerIdRef.current = null
      adOffsetRef.current = 0

      ad?.pause()
      if (ad) ad.style.visibility = "hidden"
      episode.style.visibility = "visible"
      setIsAdPlaying(false)

      const clamped = Math.min(
        Math.max(0, episodeTime),
        Math.max(
          episode.duration || episodeDurationSeconds,
          episodeDurationSeconds
        )
      )
      if (Math.abs(episode.currentTime - clamped) > 0.05) {
        episode.currentTime = clamped
      }
      lastEpisodeTimeRef.current = clamped

      if (shouldPlay) {
        playVideo(episode)
      } else {
        episode.pause()
      }

      setCurrentTime(clamped)
    },
    [episodeDurationSeconds, playVideo, setCurrentTime, setIsAdPlaying]
  )

  const resumeAfterAd = useCallback(
    (marker: AdMarker, shouldPlay: boolean) => {
      servedMarkerIdsRef.current.add(marker.id)
      showEpisode(marker.startSeconds, shouldPlay)
    },
    [showEpisode]
  )

  const showAd = useCallback(
    (marker: AdMarker, adOffset: number, shouldPlay: boolean) => {
      const episode = episodeRef.current
      const adVideo = adRef.current
      if (!episode || !adVideo) return

      const ad = resolveAdForMarker(marker, adsById, adResolveOptionsRef.current)
      phaseRef.current = "ad"
      activeMarkerIdRef.current = marker.id
      adOffsetRef.current = adOffset

      episode.pause()
      episode.style.visibility = "hidden"

      if (!ad?.src) {
        resumeAfterAd(marker, shouldPlay)
        return
      }

      adVideo.style.visibility = "visible"
      setIsAdPlaying(true)
      if (adVideo.src !== ad.src) {
        adVideo.src = ad.src
      }

      const slotDuration = getAdSlotDuration(marker)
      const clampedOffset = Math.min(Math.max(0, adOffset), slotDuration)
      if (Math.abs(adVideo.currentTime - clampedOffset) > 0.05) {
        adVideo.currentTime = clampedOffset
      }

      if (shouldPlay) {
        playVideo(adVideo)
      } else {
        adVideo.pause()
      }

      setCurrentTime(getDisplayContentTime("ad", 0, marker, clampedOffset))
    },
    [adsById, playVideo, resumeAfterAd, setCurrentTime, setIsAdPlaying]
  )

  const applySeek = useCallback(
    (contentTime: number, shouldPlay: boolean) => {
      clearServedMarkersBeforeContentTime(
        contentTime,
        servedMarkerIdsRef.current,
        playbackMarkers
      )
      clearMarkerAdSelectionsBeforeContentTime(
        contentTime,
        markerAdSelectionRef.current,
        playbackMarkers
      )

      const resolved = resolvePlaybackAtContentTime(
        contentTime,
        playbackMarkers,
        adsById,
        adResolveOptionsRef.current
      )

      if (resolved.kind === "ad") {
        showAd(resolved.marker, resolved.adOffset, shouldPlay)
        return
      }

      showEpisode(resolved.episodeTime, shouldPlay)
    },
    [playbackMarkers, adsById, showAd, showEpisode]
  )

  useEffect(() => {
    if (lastSeekRef.current === seekTime) return
    lastSeekRef.current = seekTime
    applySeek(seekTime, playingRef.current)
  }, [seekTime, applySeek])

  useEffect(() => {
    if (!playing) {
      pauseAll()
      return
    }

    if (phaseRef.current === "episode") {
      playVideo(episodeRef.current)
      return
    }

    playVideo(adRef.current)
  }, [playing, pauseAll, playVideo])

  useEffect(() => {
    const episode = episodeRef.current
    if (!episode) return

    function onEpisodeTimeUpdate() {
      if (phaseRef.current !== "episode" || !playingRef.current) return

      const previousTime = lastEpisodeTimeRef.current
      const episodeTime = episode!.currentTime
      lastEpisodeTimeRef.current = episodeTime

      setCurrentTime(episodeTime)

      for (const marker of [...playbackMarkersRef.current].sort(
        (a, b) => a.startSeconds - b.startSeconds
      )) {
        if (servedMarkerIdsRef.current.has(marker.id)) continue
        if (
          previousTime < marker.startSeconds &&
          episodeTime >= marker.startSeconds - 0.05
        ) {
          const ad = resolveAdForMarker(marker, adsById, adResolveOptionsRef.current)
          if (!ad?.src) break
          showAd(marker, 0, true)
          break
        }
      }
    }

    episode.addEventListener("timeupdate", onEpisodeTimeUpdate)
    return () => episode.removeEventListener("timeupdate", onEpisodeTimeUpdate)
  }, [playbackMarkers, adsById, setCurrentTime, showAd])

  useEffect(() => {
    const adVideo = adRef.current
    if (!adVideo) return

    function onAdTimeUpdate() {
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
        resumeAfterAd(marker, playingRef.current)
      }
    }

    function onAdEnded() {
      const marker = playbackMarkersRef.current.find(
        (item) => item.id === activeMarkerIdRef.current
      )
      if (!marker) return
      resumeAfterAd(marker, playingRef.current)
    }

    adVideo.addEventListener("timeupdate", onAdTimeUpdate)
    adVideo.addEventListener("ended", onAdEnded)
    return () => {
      adVideo.removeEventListener("timeupdate", onAdTimeUpdate)
      adVideo.removeEventListener("ended", onAdEnded)
    }
  }, [resumeAfterAd, setCurrentTime])

  useEffect(() => {
    if (skipAdNonce === 0) return
    if (phaseRef.current !== "ad") return
    const marker = resolveActiveMarker()
    if (!marker) return
    resumeAfterAd(marker, playingRef.current)
  }, [skipAdNonce, resolveActiveMarker, resumeAfterAd])

  useEffect(() => {
    applySeek(seekTime, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial mount only
  }, [episodeSrc])

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
      />
    </div>
  )
}
