export type LivePlayerProjectData = {
  version: 1
  input: {
    properties: {
      width: number
      height: number
    }
    tracks: LivePlayerTrack[]
  }
}

export type LivePlayerTrack = {
  id: string
  type: "video" | "element"
  name: string
  elements: Array<LivePlayerVideoElement | LivePlayerTextElement>
}

export type LivePlayerTextElement = {
  id: string
  type: "text"
  s: number
  e: number
  props: {
    text: string
    fontSize?: number
    fill?: string
    textAlign?: "center" | "left" | "right"
  }
}

export type LivePlayerVideoFrame = {
  size: [number, number]
  layout: boolean
  clip: string
}

export type LivePlayerVideoElement = {
  id: string
  type: "video"
  s: number
  e: number
  objectFit?: "contain" | "cover" | "fill"
  frame?: LivePlayerVideoFrame
  props: {
    src: string
    time?: number
    play?: boolean
    decoder?: "slow" | "web" | "ffmpeg"
    volume?: number
    playbackRate?: number
  }
}
