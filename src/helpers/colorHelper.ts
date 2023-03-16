import { Vector, Paint } from 'figma-api'
import { GradientStop } from './constants'

const MIN_VALUE = 0.0
const MAX_VALUE = 1.0

export function roundColorValue(quantityParam = 0.0, scale = 255): number {
  if (scale < 0 || scale > 255) {
    throw Error('Error while rounding color value: Scale value must be equal to or less than 255!')
  }

  let quantity = quantityParam

  if (quantity < MIN_VALUE) {
    quantity = MIN_VALUE
  }

  if (quantity > MAX_VALUE) {
    quantity = MAX_VALUE
  }

  if (scale <= 1.0) {
    return parseFloat(quantity.toFixed(2))
  }

  return parseFloat((quantity * scale).toFixed(0))
}

export function roundNumber(num: number, decimals = 6): number {
  const number = num.toFixed(decimals)

  return parseFloat(number)
}

export function calculateDegree2Point(point1: Vector, point2: Vector): number {
  if (!point1 || !point2) {
    throw Error('Missing point1 and/or point2 in calculateDegree2Point!')
  }

  const angleDeg = ((Math.atan2(point2.y - point1.y, point2.x - point1.x) * 180) / Math.PI + 450) % 360

  return roundNumber(angleDeg, 2)
}

function calculateDegree(gradientHandlePositions: Vector[]) {
  return calculateDegree2Point(gradientHandlePositions[0], gradientHandlePositions[1])
}

export function createLinearGradientString(fills: Paint): string {
  if (!fills) {
    throw Error('Missing fills and gradientHandlePositions in createLinearGradientString!')
  }

  if (!fills.gradientHandlePositions) {
    throw Error('Missing fills and gradientHandlePositions in createLinearGradientString!')
  }

  let str = `linear-gradient(`

  const gradientStops = fills.gradientStops ? fills.gradientStops : null

  if (!gradientStops) {
    throw Error()
  }

  const degree = calculateDegree(fills.gradientHandlePositions as unknown as Vector[])

  if (degree) {
    str += `${degree}deg, `
  }

  gradientStops.forEach((fill: GradientStop, index: number) => {
    const R = roundColorValue(fill.color?.r, 255)
    const G = roundColorValue(fill.color?.g, 255)
    const B = roundColorValue(fill.color?.b, 255)
    // @ts-ignore TODO
    const A = roundColorValue(fill.opacity ? fill.opacity : fill.color?.a, 1)
    // @ts-ignore TODO
    const position = roundColorValue(parseFloat(fill.position ? fill.position : '0'), 100)

    if (index > 0) {
      str += ` `
    }

    str += `rgba(${R}, ${G}, ${B}, ${A}) ${position}%`

    if (index < gradientStops.length - 1) {
      str += `,`
    }

    if (index >= gradientStops.length - 1) {
      str += `)`
    }
  })

  return str
}

export function createRadialGradientString(fills: Paint): string {
  if (!fills) {
    throw Error('Missing fills and gradientHandlePositions in createRadialGradientString!')
  }

  if (!fills.gradientHandlePositions) {
    throw Error('Missing fills and gradientHandlePositions in createRadialGradientString!')
  }

  const position = (() => {
    const pos1 = fills.gradientHandlePositions[0]
    const pos2 = fills.gradientHandlePositions[1]
    const pos3 = fills.gradientHandlePositions[2]

    const start = (pos1.x * 100 - pos3.x * 100).toFixed(1)
    const end = (pos2.y * 100 - pos1.y * 100).toFixed(1)

    const x = (pos1.x * 100).toFixed(1)
    const y = (pos1.y * 100).toFixed(1)

    return `${start}% ${end}% at ${x}% ${y}%`
  })()

  let str = `radial-gradient(${position}, `

  const gradientStops = fills.gradientStops || null

  if (!gradientStops) {
    throw Error()
  }

  gradientStops.forEach((fill: GradientStop, index: number) => {
    const R = roundColorValue(fill.color?.r, 255)
    const G = roundColorValue(fill.color?.g, 255)
    const B = roundColorValue(fill.color?.b, 255)
    // @ts-ignore TODO
    const A = roundColorValue(fill.opacity ? fill.opacity : fill.color?.a, 1)
    // @ts-ignore TODO
    const position = roundColorValue(parseFloat(fill.position ? fill.position : '0'), 100)

    if (index > 0) {
      str += ` `
    }

    str += `rgba(${R}, ${G}, ${B}, ${A}) ${position}%`

    if (index < gradientStops.length - 1) {
      str += `,`
    }

    if (index >= gradientStops.length - 1) {
      str += `)`
    }
  })

  return str
}

export function createSolidColorString(fills: Paint): string {
  if (!fills) {
    throw Error('Missing fills in createSolidColorString!')
  }

  const R = roundColorValue(fills.color?.r, 255)
  const G = roundColorValue(fills.color?.g, 255)
  const B = roundColorValue(fills.color?.b, 255)
  const A = roundColorValue(fills.opacity ? fills.opacity : fills.color?.a, 1)

  return `rgba(${R}, ${G}, ${B}, ${A})`
}
