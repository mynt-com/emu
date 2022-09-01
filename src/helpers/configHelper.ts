import fs from 'fs/promises'
import ora from 'ora'
import chalk from 'chalk'
import { GetFileResult, ProjectFile } from 'figma-api/lib/api-types.js'
import path from 'path'
import os from 'os'
import { Figma } from '../abtractions/figma'
import { getAllProjectFiles, tryParseJSON } from './generics'
import { Flags } from '../actions/config'
import { ConfigFile, CONFIG_FILE_NAME, HOME_DIR, LOCAL_DIR } from './constants'

type FigmaPages = Record<string, string[]>

type FigmaPageNameURL = {
  name: string
  key?: string
}

type CreateConfigFunc = (filePages: FigmaPages, figmaPageURLs: FigmaPageNameURL[], initialObject: Record<string, unknown>) => any

export const createConfigObject: CreateConfigFunc = (filePages, figmaPageURLs, initialObject) =>
  Object.entries(filePages).reduce<any>(
    (prev, [name, pages]) => ({
      ...prev,
      files: [
        ...prev.files,
        {
          name,
          url: figmaPageURLs.find(file => file.name === name)?.key as string,
          pages,
        },
      ],
    }),
    initialObject,
  )

export const mergeConfigFiles = (existingConfig: ConfigFile | null, newConfig: Partial<ConfigFile>) => {
  const existingFiles = existingConfig?.files ?? []

  const filteredFiles = existingFiles?.filter(existingFile => !newConfig?.files?.some(file => file.name === existingFile.name))

  return {
    ...(existingConfig ?? {}),
    ...newConfig,
    files: [...(newConfig?.files ?? []), ...(filteredFiles ?? {})],
  }
}

const getPagesFromFigmaFile = (file: GetFileResult) =>
  file.document.children.reduce<string[]>((pages, document) => {
    if (document.type !== 'CANVAS') return pages

    return [...pages, document.name]
  }, [])

export const getProjectPages = (files: GetFileResult[]) =>
  files.reduce<Record<string, string[]>>((prev, next) => ({ ...prev, [next.name]: getPagesFromFigmaFile(next) }), {})

export const figmaFileNameKeyMap = (filteredFiles: ProjectFile[]) => (value: any) => ({
  name: value,
  key: filteredFiles.find(file => file.name === value)?.key as string,
})

export const copyConfig = async ({ copyGlobal }: Flags) => {
  const from = copyGlobal ? HOME_DIR : LOCAL_DIR
  const to = copyGlobal ? LOCAL_DIR : HOME_DIR

  try {
    await fs.copyFile(from, to)

    ora(`Copied config from '${from}' to '${to}'`).succeed()
  } catch {
    console.error(chalk.red(`Unable to copy config from '${from}', config doesn't exist`))
  }
}

export const updateExistingPages = async (config: ConfigFile, path: string) => {
  const figma = new Figma({ token: config.FIGMA_TOKEN })
  const { files } = await getAllProjectFiles(figma, config.PROJECT_ID)

  const fileSpinner = ora('Getting updated pages from figma, this may take a while... (0/0)').start()
  const fetchStatuses: Record<string, boolean> = {}

  const fileFetches = files.map(file => {
    fetchStatuses[file.name] = false

    const promise = figma.file(file.key)

    promise.then(() => {
      fetchStatuses[file.name] = true
    })

    return promise
  })

  const updateSpinner = () => {
    const total = Object.values(fetchStatuses).length
    const done = Object.values(fetchStatuses).filter(v => v === true).length

    fileSpinner.text = `Getting updated pages from figma, this may take a while... (${done}/${total})`
  }

  const interval = setInterval(updateSpinner, 50)

  const fetchedFiles = await Promise.all(fileFetches)

  updateSpinner()
  clearInterval(interval)
  fileSpinner.stop()

  const filePages = getProjectPages(fetchedFiles)

  const parsedFiles = Object.keys(filePages).map(key => {
    const url = files.find(row => row.name === key)?.key

    if (!url) {
      console.error(chalk.red(`could not find url for figma page '${key}'`))

      return process.exit(1)
    }

    return {
      name: key,
      url,
      pages: filePages[key],
    }
  })

  const newConfig: ConfigFile = {
    ...config,
    files: parsedFiles,
  }

  await fs.writeFile(path, JSON.stringify(newConfig, null, 2))

  ora(`Updated pages in config file at '${path}'`).succeed()
}

const tryReadFile = async (path: string) => {
  try {
    return await fs.readFile(path, 'utf-8')
  } catch {
    return null
  }
}

const localPath = path.join(process.cwd(), CONFIG_FILE_NAME)
const homePath = path.join(os.homedir(), CONFIG_FILE_NAME)

const getConfigFile = async () => {
  const localFile = await tryReadFile(localPath)

  if (localFile === null) {
    const homeConfig = await tryReadFile(homePath)

    return { path: homePath, config: homeConfig }
  }

  return { path: localPath, config: localFile }
}

export const readConfig = async (filePath?: string) => {
  if (!filePath) {
    const { config, path } = await getConfigFile()

    return { config: tryParseJSON<ConfigFile>(config), path }
  }

  return { config: tryParseJSON<ConfigFile>(await tryReadFile(filePath)), path: filePath }
}
