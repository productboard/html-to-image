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

  // Find max width (with height = 1)
  const maxWidth = binarySearchMax(
    (width) => canSupport(width, 1),
    1,
    THRESHOLD,
  )

  // Find max height (with width = 1)
  const maxHeight = binarySearchMax(
    (height) => canSupport(1, height),
    1,
    THRESHOLD,
  )

  // Find max square dimension
  const maxSquare = binarySearchMax(
    (size) => canSupport(size, size),
    1,
    Math.min(maxWidth, maxHeight),
  )

  // Try to find the absolute maximum area with brute force optimization
  let maxArea = 0

  // Test various width/height combinations near the limits
  for (
    let w = Math.floor(maxWidth * 0.8);
    w <= maxWidth;
    w += Math.floor(maxWidth * 0.02)
  ) {
    const maxH = binarySearchMax((h) => canSupport(w, h), 1, maxHeight)
    const area = w * maxH

    if (area > maxArea) {
      maxArea = area
    }
  }

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

function canSupport(width: number, height: number): boolean {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')

    if (!ctx) return false

    // Try to draw something and read it back
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, 1, 1)

    const imageData = ctx.getImageData(0, 0, 1, 1)
    const data = imageData.data

    // Check if the pixel was actually drawn (red color)
    return data[0] === 255 && data[1] === 0 && data[2] === 0 && data[3] === 255
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
