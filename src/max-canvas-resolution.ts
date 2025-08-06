const THRESHOLD = 65536

type CanvasMaxResolution = {
  maxWidth: number
  maxHeight: number
  maxSquare: number
  maxArea: number
}

let result: CanvasMaxResolution | null = null

// https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas#maximum_canvas_size
export function getMaxCanvasResolution(): CanvasMaxResolution {
  if (result) {
    return result
  }

  const samplePixel = getSamplePixelFromCanvasOfSize(1, 1)

  // Find max width (with height = 1)
  const maxWidth = binarySearchMax(
    (width) => canSupport(samplePixel, width, 1),
    1,
    THRESHOLD,
  )

  // Find max height (with width = 1)
  const maxHeight = binarySearchMax(
    (height) => canSupport(samplePixel, 1, height),
    1,
    THRESHOLD,
  )

  // Find max square dimension
  const maxSquare = binarySearchMax(
    (size) => canSupport(samplePixel, size, size),
    1,
    Math.min(maxWidth, maxHeight),
  )

  const maxArea = maxSquare * maxSquare

  return (result = {
    maxWidth,
    maxHeight,
    maxSquare,
    maxArea,
  })
}

export function fitsMaxRenderableResolution(
  width: number,
  height: number,
): boolean {
  const max = getMaxCanvasResolution()
  const resolution = width * height

  return (
    max.maxArea >= resolution &&
    max.maxWidth >= width &&
    max.maxHeight >= height
  )
}

function canSupport(
  pixelData: Uint8ClampedArray,
  width: number,
  height: number,
): boolean {
  try {
    const imageData = getSamplePixelFromCanvasOfSize(width, height)

    // Check if the pixel was actually drawn (red color)
    if (imageData[0] === 0) {
      return false
    }

    return (
      pixelData[0] === imageData[0] &&
      pixelData[1] === imageData[1] &&
      pixelData[2] === imageData[2] &&
      pixelData[3] === imageData[3]
    )
  } catch {
    return false
  }
}

function binarySearchMax(
  testFn: (size: number) => boolean,
  min = 1,
  max = 65536,
) {
  let left = min
  let right = max
  let result = min

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)

    if (testFn(mid)) {
      result = mid
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  return result
}

function getSamplePixelFromCanvasOfSize(
  width: number,
  height: number,
): Uint8ClampedArray {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')

  if (!ctx) return new Uint8ClampedArray([0, 0, 0, 0])

  // Try to draw something and read it back
  try {
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, 1, 1)
  } catch {
    return new Uint8ClampedArray([0, 0, 0, 0])
  }

  const imageData = ctx.getImageData(0, 0, 1, 1)

  // Release canvas elements (Safari memory usage fix)
  // See: https://stackoverflow.com/questions/52532614/total-canvas-memory-use-exceeds-the-maximum-limit-safari-12
  canvas.width = 0
  canvas.height = 0

  return imageData.data
}
