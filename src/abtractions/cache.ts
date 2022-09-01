import path from 'path'
import os from 'os'
import fs from 'fs/promises'
import { CACHE_DIR_NAME, CACHE_MAP_NAME } from '../helpers/constants'
import { isProductionEnv, isVerboseEnv, recursiveMkdir } from '../helpers/generics'

const TMP_DIR = os.tmpdir()
const CACHE_DIR = path.join(TMP_DIR, CACHE_DIR_NAME)
const CACHE_FILE_PATH = path.join(CACHE_DIR, CACHE_MAP_NAME)

enum CacheKeys {
  FIGMA_FILE = 'FIGMA_FILE',
  FIGMA_IMAGES = 'FIGMA_IMAGES',
  FIGMA_PROJECTS = 'FIGMA_PROJECTS',
}

const readMapCache = async (): Promise<Record<string, any>> => {
  await recursiveMkdir(path.join(TMP_DIR, CACHE_DIR_NAME))

  try {
    return JSON.parse(await fs.readFile(CACHE_FILE_PATH, 'utf-8'))
  } catch {
    await fs.writeFile(CACHE_FILE_PATH, JSON.stringify({}), 'utf-8')

    return {}
  }
}

type Keys = (CacheKeys | string)[]

export class Cache {
  private map: Promise<Record<string, any>>
  keys = CacheKeys

  constructor() {
    this.map = readMapCache()
  }

  async get(keys: Keys) {
    if (isProductionEnv()) return false

    const cache = await this.map
    const key = keys.join('_')

    if (!cache[key]) {
      return
    }

    if (isVerboseEnv()) console.log(`(using cached files stored in '${path.join(os.tmpdir(), CACHE_DIR_NAME)}' )`)

    return JSON.parse(await fs.readFile(cache[key], 'utf-8'))
  }

  async set(data: Record<string, any>, keys: Keys) {
    if (isProductionEnv()) return false

    const cache = await this.map
    const key = keys.join('_')
    const filepath = path.join(CACHE_DIR, `${key}.json`)

    cache[key] = filepath

    await Promise.all([fs.writeFile(filepath, JSON.stringify(data), 'utf8'), fs.writeFile(CACHE_FILE_PATH, JSON.stringify(cache), 'utf8')])

    this.map = Promise.resolve(cache)
  }
}
