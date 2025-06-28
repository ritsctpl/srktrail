import { useRef, useEffect } from 'react'

export interface SignaturePadProps {
  disabled?: boolean
  value?: string
  onChange: (dataUrl: string) => void
}

export default function SignaturePad({ disabled, value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
  }, [])

  const handleStart = (e: React.MouseEvent) => {
    if (disabled) return
    drawing.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
  }

  const handleMove = (e: React.MouseEvent) => {
    if (!drawing.current || disabled) return
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    ctx.stroke()
  }

  const handleEnd = () => {
    if (disabled) return
    drawing.current = false
    const canvas = canvasRef.current!
    onChange(canvas.toDataURL())
  }

  return (
    <div className="border rounded">
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="w-full h-36"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      />
      {value && !drawing.current && (
        <img src={value} alt="signature" className="mt-1 max-h-24" />
      )}
    </div>
  )
}
