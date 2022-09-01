import path from 'path'
import os from 'os'

export const CONFIG_FILE_NAME = '.emu.config.json'
export const TEXTKEY_FILE_NAME = 'texts.json'
export const IMAGEKEY_FILE_NAME = 'images.json'

export const HOME_DIR = path.join(os.homedir(), CONFIG_FILE_NAME)
export const LOCAL_DIR = path.join(process.cwd(), CONFIG_FILE_NAME)

export type FigmaFile = {
  name: string
  url: string
  pages: string[]
}

export type ConfigFile = {
  files?: FigmaFile[]
  excludeKeys?: string[]
  FIGMA_TOKEN?: string
  variants?: string[]
  PROJECT_ID: string
}

export type ImageVariant = {
  width: number
  height: number
  id?: string
}

export type ImageKey = {
  name: string
  id: string
  format: string
  scale: number
  url: string
  variants?: Record<string, ImageVariant>
}

type TextVariant = {
  style: {
    fontFamilty: string
    fontSize: string
    fontWeight: number
    letterSpacing: string
    lineHeight: string
    color: string
  }
}

export type TextKey = {
  name: string
  characters: string
  variants: Record<string, TextVariant>
}

export type Warning = { key: string; urls: { link: string; page: string }[]; page?: string; description?: string }

export const CACHE_DIR_NAME = 'emu'
export const CACHE_MAP_NAME = 'emu-cache-map.json'
export const WARNING_LOG_NAME = 'emu-log.txt'
export const IMAGE_DIR_NAME = 'images'
export const TOKENS_DIR_NAME = 'tokens'
export const DEFAULT_IMAGE_QUALITY = 0.6
export const EMU_TOKEN_TYPE_LAYER_NAME = 'emu_token_type'
