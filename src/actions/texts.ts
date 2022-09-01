import { promises as fsAsync } from 'fs'
import ora from 'ora'
import { GetFileResult } from 'figma-api/lib/api-types.js'
import chalk from 'chalk'
import { readConfig } from '../helpers/configHelper'
import {
  getFileOutputPath,
  getTextKeyCharacters,
  stripDebugInfoFromTextKeys,
  mergeTextkeys,
  printWarnings,
  stringArrayToRegexArray,
  parseTextkeyFormatter,
} from '../helpers/textHelper'
import { TextKey } from '../helpers/constants'
import {
  commaSeperatedArray,
  handleFigmaFileProjectId,
  handleMissingFigmaFileArgument,
  isVerboseEnv,
  parseFlags,
  recursiveMkdir,
  sortTextKeys,
  verifyEmuVersion,
} from '../helpers/generics'
import { Config } from '../abtractions/config'
import { Figma } from '../abtractions/figma'
import { ENV } from '../helpers/env'
import { Cache } from '../abtractions/cache'
import { fork } from '../workers/fork'
import { TextNodeWorkerData, TextNodeWorkerResult } from '../forks/textNodeParser'

type Flags = {
  outDir?: string
  verbose?: boolean
  cache?: boolean
  log?: boolean
  merge?: boolean
  fileNameFormat?: string
  variants?: string
  styles?: boolean
  exclude?: string
  excludeChildren?: string
  keyFormat?: string
  fileId?: string
}

const text = async (incomingProject?: string, rawFlags?: Flags): Promise<void> => {
  const flags = parseFlags(rawFlags)
  const project = incomingProject || flags.fileId
  await verifyEmuVersion(flags.skipVersionValidation)

  const { config: configFile, path: configPath } = await readConfig(flags.config)

  const cache = new Cache()
  const config = new Config({ config: configFile, path: configPath, projectIds: flags.projectIds, allowNoConfig: !!flags.fileId })
  const figma = new Figma({ token: config.file.FIGMA_TOKEN || process.env[ENV.EMU_FIGMA_TOKEN] })

  const textKeyFormat = parseTextkeyFormatter(flags.keyFormat)
  const projectIds = config.file.PROJECT_ID || flags.projectIds

  if (!project) return handleMissingFigmaFileArgument(figma, projectIds, text, rawFlags)

  const configFigmaFile = config.figmaFile(project, { noError: !!flags.fileId })
  const fileId = configFigmaFile?.url ?? project

  const { variants: configVariants, excludeKeys: configExcludeKeys } = config.file

  const spinner = ora('Fetching data from figma, this may take a while...').start()

  const fileCache = flags.cache && (await cache.get([cache.keys.FIGMA_FILE, project]))
  const file: GetFileResult = fileCache ?? (await figma.file(fileId))

  if (!fileCache) await cache.set(file, [cache.keys.FIGMA_FILE, project])

  const figmaFile = handleFigmaFileProjectId(configFigmaFile, {
    projectId: flags.fileId,
    pages: file.document.children.map(node => node.name),
  })

  spinner.succeed()

  const textKeysFilePath = getFileOutputPath(flags.outDir, config.file, flags.fileNameFormat)

  const excludeStrings = commaSeperatedArray(flags.exclude ?? '') || configExcludeKeys
  const excludeChildrenStrings = commaSeperatedArray(flags.excludeChildren ?? '')

  const variants = commaSeperatedArray(flags.variants ?? '') || configVariants

  const excludeTextKeys = stringArrayToRegexArray(excludeStrings)
  const excludeChildrenTextKeys = stringArrayToRegexArray(excludeChildrenStrings)

  const parserSpinner = ora('Looking for texts in figma data...').start()

  const { data } = fork<TextNodeWorkerData, TextNodeWorkerResult>('textNodeParser.ts', {
    document: file.document,
    figmaFile,
    project,
    variants,
    excludeTextKeys,
    excludeChildrenTextKeys,
    includeNodes: ['TEXT'],
    textKeyFormat,
  })

  const { textKeys: parsedTextKeys, warnings, error } = await data.catch(error => ({ error } as TextNodeWorkerResult))

  if (parsedTextKeys === undefined) {
    parserSpinner.fail()

    if (isVerboseEnv()) console.error(chalk.red('ERROR:', error?.message))
    return console.error(chalk.red('an unknown error occured when parsing figma data'))
  }

  // mergedTextKeys includes css styles from figma
  const formattedTextKeys: Record<string, TextKey> = stripDebugInfoFromTextKeys(parsedTextKeys)
  const mergedTextkeys = flags.merge ? await mergeTextkeys(textKeysFilePath, formattedTextKeys) : formattedTextKeys

  // normal key-value textkeys with the textkey and its characters
  const keyValueTextKeys = getTextKeyCharacters(mergedTextkeys)

  const textkeys = flags.styles ? mergedTextkeys : keyValueTextKeys
  const textKeyData = JSON.stringify(sortTextKeys(textkeys), null, 2)

  parserSpinner.succeed()

  await recursiveMkdir(textKeysFilePath)
  await fsAsync.writeFile(textKeysFilePath, textKeyData)

  await printWarnings(warnings, { project, log: flags.log })

  ora(`Written text keys to '${textKeysFilePath}'`).succeed()
}

export default text
