import chalk from 'chalk'
import ora from 'ora'
import { GetFileResult } from 'figma-api/lib/api-types.js'
import { readConfig } from '../helpers/configHelper'
import { convertTokensToFiles, getTokensOutputDir, parseTokens, writeTokenFiles } from '../helpers/tokensHelper'
import { handleMissingFigmaFileArgument, parseFlags, recursiveMkdir, verifyEmuVersion } from '../helpers/generics'
import { ENV } from '../helpers/env'
import { Figma } from '../abtractions/figma'
import { Config } from '../abtractions/config'
import { Cache } from '../abtractions/cache'

type Flags = {
  cache?: boolean
  outDir?: string
  fileId?: string
  removePrefix?: boolean
}

const tokens = async (projectName: string, rawFlags: Flags) => {
  const flags = parseFlags(rawFlags)
  const project = projectName || flags.fileId
  await verifyEmuVersion(flags.skipVersionValidation)

  const { config: configFile, path: configPath } = await readConfig(flags.config)

  const cache = new Cache()
  const config = new Config({ config: configFile, path: configPath, projectIds: flags.projectIds, allowNoConfig: !!flags.fileId })
  const figma = new Figma({ token: config.file.FIGMA_TOKEN || process.env[ENV.EMU_FIGMA_TOKEN] })

  const projectIds = config.file.PROJECT_ID || flags.projectIds
  if (!project) return handleMissingFigmaFileArgument(figma, projectIds, tokens, { ...flags, skipVersionValidation: true })

  const configFigmaFile = config.figmaFile(project, { noError: !!flags.fileId })
  const fileId = configFigmaFile?.url ?? project

  const spinner = ora('Fetching page data, this may take a while...').start()

  const fileCache = flags.cache && (await cache.get([cache.keys.FIGMA_FILE, project]))
  const file: GetFileResult = fileCache ?? (await figma.file(fileId))

  if (!file) {
    spinner.fail()

    console.log(chalk.red(`Unable to find file from figma (${project})`))
    return process.exit(1)
  }

  if (!fileCache) await cache.set(file, [cache.keys.FIGMA_FILE, projectName])

  spinner.succeed()

  const dirPath = getTokensOutputDir(flags.outDir, config.file)

  const parsedTokens = parseTokens(file, { noPrefix: flags.removePrefix })
  const files = convertTokensToFiles(parsedTokens)

  const tokensSpinner = ora(`Writing tokens files to '${dirPath}'`)

  await recursiveMkdir(dirPath)
  await Promise.all(writeTokenFiles(files, dirPath))

  tokensSpinner.succeed()
}

export default tokens
