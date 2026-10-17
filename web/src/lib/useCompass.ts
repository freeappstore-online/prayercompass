import { useEffect, useRef, useState } from 'react'
import { readHeading, screenHeading, type HeadingData } from './heading'

type State = 'idle' | 'requesting' | 'waiting' | 'live' | 'denied' | 'unsupported' | 'missing'
export function useCompass(enabled: boolean) {
  const [state, setState] = useState<State>('idle')
  const [reading, setReading] = useState<{ heading: number; lowAccuracy: boolean } | null>(null)
  const cleanup = useRef<(() => void) | null>(null)
  const generation = useRef(0)
  useEffect(() => () => { generation.current++; cleanup.current?.() }, [enabled])
  const start = async () => {
    const attempt = ++generation.current
    cleanup.current?.()
    setReading(null)
    const api = window.DeviceOrientationEvent as (typeof DeviceOrientationEvent & {
      requestPermission?: (absolute?: boolean) => Promise<string>
    }) | undefined
    if (!enabled || !window.isSecureContext || !api) { setState('unsupported'); return }
    setState('requesting')
    try {
      // Called synchronously from the button gesture, before the first await.
      const permission = api.requestPermission ? await api.requestPermission(true) : 'granted'
      if (attempt !== generation.current) return
      if (permission !== 'granted') { setState('denied'); return }
    } catch {
      if (attempt === generation.current) setState('denied')
      return
    }
    setState('waiting')
    let last: ReturnType<typeof readHeading> = null
    let timer: ReturnType<typeof setTimeout>
    const expire = () => { last = null; setReading(null); setState('missing') }
    const arm = () => { clearTimeout(timer); timer = setTimeout(expire, 5000) }
    const publish = () => {
      if (!last) return
      const angle = window.screen.orientation?.angle ?? (window as Window & { orientation?: number }).orientation ?? 0
      setReading({ ...last, heading: screenHeading(last.heading, angle) })
      setState('live')
    }
    const receive = (event: Event) => {
      const next = readHeading(event as DeviceOrientationEvent & HeadingData)
      // Ignore relative-only events when an absolute stream is also available.
      if (!next) return
      last = next
      publish()
      arm()
    }
    const hide = () => { if (document.hidden) expire() }
    window.addEventListener('deviceorientationabsolute', receive)
    window.addEventListener('deviceorientation', receive)
    window.screen.orientation?.addEventListener('change', publish)
    window.addEventListener('orientationchange', publish)
    document.addEventListener('visibilitychange', hide)
    arm()
    cleanup.current = () => {
      clearTimeout(timer)
      window.removeEventListener('deviceorientationabsolute', receive)
      window.removeEventListener('deviceorientation', receive)
      window.screen.orientation?.removeEventListener('change', publish)
      window.removeEventListener('orientationchange', publish)
      document.removeEventListener('visibilitychange', hide)
    }
  }
  return { state, reading, start }
}
