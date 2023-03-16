import { Paint, PaintType, Vector } from 'figma-api'
import { roundColorValue, roundNumber, calculateDegree2Point, createLinearGradientString } from '../../helpers/colorHelper'

describe('roundColorValue', () => {
  test('returns a value within the given scale', () => {
    expect(roundColorValue(0.5, 255)).toBe(128)
  })

  test('returns a value rounded to two decimal places if scale is less than or equal to 1', () => {
    expect(roundColorValue(0.5, 1)).toBe(0.5)
  })

  test('throws an error if the scale value is greater than 255', () => {
    expect(() => roundColorValue(0.5, 256)).toThrow('Error while rounding color value: Scale value must be equal to or less than 255!')
  })

  test('returns 0 if the quantity is less than the minimum value', () => {
    expect(roundColorValue(-1, 255)).toBe(0)
  })
})

describe('roundNumber', () => {
  test('returns a number rounded to the specified decimal places', () => {
    expect(roundNumber(1.234567, 3)).toBe(1.235)
  })

  test('returns a number rounded to 6 decimal places by default', () => {
    expect(roundNumber(1.234567)).toBe(1.234567)
  })
})

describe('calculateDegree2Point', () => {
  test('returns the correct degree between two points', () => {
    const point1: Vector = { x: 0, y: 0 }
    const point2: Vector = { x: 1, y: 1 }

    expect(calculateDegree2Point(point1, point2)).toBe(135)
  })

  test('throws an error if either point is missing', () => {
    const point1: Vector = { x: 0, y: 0 }
    const point2 = null as unknown as Vector

    expect(() => calculateDegree2Point(point1, point2)).toThrow('Missing point1 and/or point2 in calculateDegree2Point!')
  })
})

describe('createLinearGradientString', () => {
  test('returns a linear gradient string', () => {
    const fills: Paint = {
      type: PaintType.GRADIENT_LINEAR,
      gradientHandlePositions: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      gradientStops: [
        { color: { r: 1, g: 0, b: 0, a: 1 }, position: 0 },
        { color: { r: 0, g: 1, b: 0, a: 1 }, position: 50 },
        { color: { r: 0, g: 0, b: 1, a: 1 }, position: 100 },
      ],
    }

    expect(createLinearGradientString(fills)).toBe(
      'linear-gradient(135deg, rgba(255, 0, 0, 1) 0%, rgba(0, 255, 0, 1) 100%, rgba(0, 0, 255, 1) 100%)',
    )
  })

  test('throws an error if fills is missing', () => {
    expect(() => createLinearGradientString(null as unknown as Paint)).toThrow(
      'Missing fills and gradientHandlePositions in createLinearGradientString!',
    )
  })

  test('throws an error if gradientStops is missing', () => {
    const fills: Paint = {
      type: PaintType.GRADIENT_LINEAR,
      gradientHandlePositions: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
    }

    expect(() => createLinearGradientString(fills)).toThrow()
  })
})
