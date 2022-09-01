import path from 'path'
import { getTokensOutputDir, parseKeyName, parseStyleNodes } from '../../helpers/tokensHelper'
import 'core-js/proposals/string-replace-all'

describe('tokens action tests', () => {
  it('can parse style nodes correctly', () => {
    const key = 'someNodeKey'
    const node = { styles: { [key]: { shouldExist: true } } }

    const styleNodes = parseStyleNodes(node as any) as any

    expect(Array.isArray(styleNodes)).toBe(true)
    expect(styleNodes[0].shouldExist).toBe(true)
    expect(styleNodes[0].nodeId).toBe(key)
  })

  it('can parse a node key name to camelCase', () => {
    const badName = 'not camel case'
    const goodName = 'notCamelCase'

    expect(parseKeyName(badName)).toEqual(goodName)
  })

  it('can get the correct tokens output dir', () => {
    const relativeWithName = 'test/mytokens.json'
    const relative = 'test/tokens'
    const abosluteWithName = '/root/myroottokens.json'
    const absolute = '/root/tokens'

    const cwd = process.cwd()

    const config: any = { defaults: { tokensOutputDirectory: '/default/output' } }

    const parsedRelativeWithName = path.relative(cwd, getTokensOutputDir(relativeWithName))
    const parsedRelative = path.relative(cwd, getTokensOutputDir(relative))
    const parsedAbosluteWithName = getTokensOutputDir(abosluteWithName)
    const parsedAboslute = getTokensOutputDir(absolute)
    const parsedWithDefault = getTokensOutputDir(undefined, config)
    const parsedWithNothing = path.relative(cwd, getTokensOutputDir())

    expect(parsedRelativeWithName).toEqual(path.dirname(relativeWithName))
    expect(parsedRelative).toEqual(relative)
    expect(parsedAbosluteWithName).toEqual(path.dirname(abosluteWithName))
    expect(parsedAboslute).toEqual(absolute)
    expect(parsedWithDefault).toEqual(config.defaults.tokensOutputDirectory)
    expect(parsedWithNothing).toEqual('tokens')
  })
})
