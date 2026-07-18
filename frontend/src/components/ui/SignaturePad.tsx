import React, { forwardRef, useImperativeHandle, useRef } from 'react'

export interface SignaturePadHandle {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: () => string
}

interface Props {
  width?: number
  height?: number
}

/**
 * Pad de signature manuscrite (souris ou tactile) via l'API Pointer Events.
 * Le tracé est dessiné sur un canvas ; toDataURL() renvoie un PNG transparent
 * (fond non rempli) prêt à être composité sur un autre visuel.
 */
const SignaturePad = forwardRef<SignaturePadHandle, Props>(({ width = 400, height = 160 }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasDrawn = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      hasDrawn.current = false
    },
    isEmpty: () => !hasDrawn.current,
    toDataURL: () => canvasRef.current?.toDataURL('image/png') ?? '',
  }))

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    canvasRef.current?.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = getPos(e)
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !last.current) return
    const pos = getPos(e)
    ctx.strokeStyle = '#1f2937'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    last.current = pos
    hasDrawn.current = true
  }

  const end = () => {
    drawing.current = false
    last.current = null
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerLeave={end}
      onPointerCancel={end}
      className="w-full bg-white border border-gray-300 rounded-lg cursor-crosshair"
      style={{ height, touchAction: 'none' }}
    />
  )
})

SignaturePad.displayName = 'SignaturePad'

export default SignaturePad
