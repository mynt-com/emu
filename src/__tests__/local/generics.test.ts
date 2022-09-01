import { ENV } from '../../helpers/env'
import {
  commaSeperatedArray,
  isProductionEnv,
  isVerboseEnv,
  recursiveReduceChildren,
  setVerboseEnv,
  sortTextKeys,
} from '../../helpers/generics'
import { exampleFigmaObject, exampleFigmaObjectIds } from './data/textTestData'

describe('text action tests', () => {
  it('can seperate string into a comma seperated array', () => {
    const input = 'hey,im,some,data'
    const output = ['hey', 'im', 'some', 'data']

    expect(commaSeperatedArray(input)).toEqual(output)
  })

  it('can sort object keys', () => {
    const input = {
      D: 1,
      E: 2,
      B: 3,
      C: 4,
      A: 5,
    }

    const output = {
      A: 5,
      B: 3,
      C: 4,
      D: 1,
      E: 2,
    }

    expect(sortTextKeys(input)).toStrictEqual(output)
    expect(Object.keys(sortTextKeys(input))).toStrictEqual(Object.keys(output))
  })

  it('can set ENV variables, check verbose env and production env', () => {
    expect(process.env[ENV.EMU_VERBOSE]).not.toEqual('true')
    expect(isVerboseEnv()).toEqual(false)

    setVerboseEnv(true)

    expect(process.env[ENV.EMU_VERBOSE]).toEqual('true')
    expect(isVerboseEnv()).toEqual(true)

    expect(process.env[ENV.EMU_ENVIRONMENT]).not.toEqual('production')
    expect(isProductionEnv()).toEqual(false)

    process.env[ENV.EMU_ENVIRONMENT] = 'production'

    expect(process.env[ENV.EMU_ENVIRONMENT]).toEqual('production')
    expect(isProductionEnv()).toEqual(true)
  })

  it('can recursively loop through children nodes', () => {
    const reducer = (prev: any, next: any) => ({ ...prev, [next.id]: next.id })

    const figmaIds = recursiveReduceChildren({
      child: exampleFigmaObject,
      reducer,
      test: node => node.name !== 'hidden',
      initial: {},
    })

    // The node of the first root child and second last node of the second root child is the last id. These two should not be included
    const expectedResults = [...exampleFigmaObjectIds.slice(0, 1), ...exampleFigmaObjectIds.slice(2, -1)]

    // The last two ids should be hidden
    expect(Object.values(figmaIds).sort()).toStrictEqual(expectedResults)
  })

  it('can hide child nodes', () => {
    const reducer = (prev: any, next: any) => ({ ...prev, [next.id]: next.id })

    const figmaIds = recursiveReduceChildren({
      child: exampleFigmaObject,
      reducer,
      test: node => node.name !== 'hidden',
      skipNodeChildren: node => node.name === 'hidden',
      initial: {},
    })

    const expectedResulsts = [...exampleFigmaObjectIds.slice(0, 1), ...exampleFigmaObjectIds.slice(5, -2)]

    // The last two ids should be hidden
    expect(Object.values(figmaIds).sort()).toStrictEqual(expectedResulsts)
  })
})
