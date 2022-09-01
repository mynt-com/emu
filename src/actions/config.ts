import { promises as fs } from 'fs'
import ora from 'ora'
import chalk from 'chalk'
import {
  readConfig,
  copyConfig,
  createConfigObject,
  figmaFileNameKeyMap,
  getProjectPages,
  mergeConfigFiles,
  updateExistingPages,
} from '../helpers/configHelper'
import * as prompts from '../helpers/prompts'
import { ConfigFile } from '../helpers/constants'
import { commaSeperatedArray, getAllProjectFiles, parseFlags } from '../helpers/generics'
import { Figma } from '../abtractions/figma'
import { ENV } from '../helpers/env'
// https://github.com/eslint/eslint/blob/79b6340d6ced0ad62628de6e51dce18d50a5be9f/lib/init/config-initializer.js#L470

type ConfigTypes = 'defaults' | 'update-pages'

export type Flags = {
  copyGlobal?: boolean
  copyLocal?: boolean
  quick?: boolean
}

const configureFigma = async (existingConfig: ConfigFile | null, quick = false) => {
  const response = await prompts.figmaConfig(existingConfig, quick)

  if (!response.PROJECT_ID && !response.FIGMA_TOKEN) {
    ora(chalk.yellow(`No entries to write config, skipping`)).warn()

    return
  }

  if (!response.PROJECT_ID) {
    await fs.writeFile(response.configLocation, JSON.stringify({ FIGMA_TOKEN: response.FIGMA_TOKEN, PROJECT_ID: '' }, null, 2))
    ora(`Written config file to '${response.configLocation}'`).succeed()

    return
  }

  const spinner = ora('Fetching files from figma...').start()

  const figma = new Figma({ token: response.FIGMA_TOKEN || process.env[ENV.EMU_FIGMA_TOKEN] })
  const { files } = await getAllProjectFiles(figma, response.PROJECT_ID)

  const filteredFiles = files.filter(file => file.name !== 'Untitled')
  const choices = filteredFiles.map(file => ({ message: file.name, name: file.name }))

  spinner.stop()

  const defaultSelected = choices.reduce<number[]>((prev, choice, index) => {
    const configHasFile = existingConfig?.files?.some(file => file.name === choice.name)

    return configHasFile ? [...prev, index] : prev
  }, [])

  const filesResponse = await prompts.configFigmaFiles(choices, defaultSelected)
  const filesToInclude = filesResponse.files
    .filter(project => !existingConfig?.files?.some(configFile => configFile.name === project))
    .map(figmaFileNameKeyMap(filteredFiles))

  const fileSpinner = ora('Fetching page data, this may take a while... (0/0)').start()
  const fetchStatuses: Record<string, boolean> = {}

  const fileFetches = filesToInclude
    .filter(({ key }) => !!key)
    .map(file => {
      fetchStatuses[file.name] = false

      const promise = figma.file(file.key as string)
      promise.then(() => {
        fetchStatuses[file.name] = true
      })

      return promise
    })

  const interval = setInterval(() => {
    const total = Object.values(fetchStatuses).length
    const done = Object.values(fetchStatuses).filter(v => v === true).length

    fileSpinner.text = `Fetching page data, this may take a while... (${done}/${total})`
  }, 1000)

  const fetchedFiles = await Promise.all(fileFetches)

  clearInterval(interval)
  fileSpinner.stop()

  const filePages = getProjectPages(fetchedFiles)

  const initial = {
    files: [],
    excludeKeys: commaSeperatedArray(response.excludeKeys),
    FIGMA_TOKEN: response.FIGMA_TOKEN,
    variants: commaSeperatedArray(response.variants),
    PROJECT_ID: response.PROJECT_ID,
  }

  const newConfig = createConfigObject(filePages, filesToInclude, initial)
  const finalJSON = mergeConfigFiles(existingConfig, newConfig)

  await fs.writeFile(response.configLocation, JSON.stringify(finalJSON, null, 2))
  ora(`Written config file to '${response.configLocation}'`).succeed()
}

const config = async (type?: ConfigTypes, flags?: Flags) => {
  const { copyGlobal, copyLocal, config: configFilePath, quick } = parseFlags(flags)
  const { config: existingConfig, path } = await readConfig(configFilePath)

  if (copyGlobal || copyLocal) {
    return copyConfig({ copyGlobal, copyLocal })
  }

  if (type === 'update-pages') {
    if (existingConfig === null) {
      return console.error(chalk.red("Found no local or global config, please run 'emu config' first"))
    }

    return updateExistingPages(existingConfig, path)
  }

  return configureFigma(existingConfig, quick)
}

export default config
