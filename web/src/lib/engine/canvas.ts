// A canvas 2D context: always available in practice, unless the canvas is already used for something else (WebGL).
export function context2d(c: HTMLCanvasElement): CanvasRenderingContext2D
export function context2d(c: OffscreenCanvas): OffscreenCanvasRenderingContext2D
export function context2d(
  c: HTMLCanvasElement | OffscreenCanvas,
): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  const ctx = (c as HTMLCanvasElement).getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponible')
  return ctx
}
