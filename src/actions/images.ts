import ora from 'ora'
import { Node } from 'figma-api'
import { GetFileResult } from 'figma-api/lib/api-types.js'
import chalk from 'chalk'
import { readConfig } from '../helpers/configHelper'
import { ImageKey, Warning } from '../helpers/constants'
import { mergeVariants, stringArrayToRegexArray } from '../helpers/textHelper'
import {
  downloadImagesWithProgress,
  DownloadOptions,
  getImageOutputDir,
  getUrlsForImages,
  groupImagesByTypeAndScale,
  handleImagesLogging,
  handleMissingProject,
  handleProgress,
  parseImageNode,
  reduceDesktopVariants as getLargestVariants,
  writeImageKeys,
} from '../helpers/imageHelper'
import {
  commaSeperatedArray,
  figmaDocumentParser,
  handleFigmaFileProjectId,
  parseFlags,
  recursiveMkdir,
  verifyEmuVersion,
} from '../helpers/generics'
import { Figma } from '../abtractions/figma'
import { ENV } from '../helpers/env'
import { Config } from '../abtractions/config'
import { Cache } from '../abtractions/cache'

type Flags = {
  outDir?: string
  verbose?: boolean
  cache?: boolean
  optimize: boolean
  quality: number
  storeSvg?: boolean
  tsx?: boolean
  merge?: boolean
  native?: boolean
  jsonRef?: boolean
  log?: boolean
  fileId?: string
  variants?: string
  exclude?: string
  excludeChildren?: string
}

const image = async (incomingProject?: string, rawFlags?: Flags): Promise<void> => {
  const flags = parseFlags(rawFlags)
  const project = incomingProject || flags.fileId

  await verifyEmuVersion(flags.skipVersionValidation)
  const { config: configFile, path: configPath } = await readConfig(flags.config)

  const cache = new Cache()
  const config = new Config({ config: configFile, path: configPath, projectIds: flags.projectIds, allowNoConfig: !!flags.fileId })
  const figma = new Figma({ token: config.file.FIGMA_TOKEN || process.env[ENV.EMU_FIGMA_TOKEN] })

  const parsedOutputDir = getImageOutputDir(flags.outDir)
  const configFigmaFile = config.figmaFile(project, { noError: !!flags.fileId })

  const fileId = configFigmaFile?.url ?? flags.fileId

  if (!project || !fileId) return handleMissingProject(figma, config.file, image, { ...flags, skipVersionValidation: true })

  const { variants: configVariants, excludeKeys: configExcludeKeys } = config.file

  const excludeStrings = commaSeperatedArray(flags.exclude ?? '') || configExcludeKeys
  const excludeChildrenStrings = commaSeperatedArray(flags.excludeChildren ?? '')

  const excludeTextKeys = stringArrayToRegexArray(excludeStrings)
  const excludeChildrenTextKeys = stringArrayToRegexArray(excludeChildrenStrings)

  const variants = commaSeperatedArray(flags.variants ?? '') || configVariants

  const spinner = ora('Fetching page data, this may take a while...').start()

  const fileCache = flags.cache && (await cache.get([cache.keys.FIGMA_FILE, project]))
  const file: GetFileResult = fileCache ?? (await figma.file(fileId))

  const figmaFile = handleFigmaFileProjectId(configFigmaFile, {
    projectId: flags.fileId,
    pages: file.document.children.map(node => node.name),
  })

  if (!fileCache) cache.set(file, [cache.keys.FIGMA_FILE, project])

  spinner.succeed()

  const warnings: Warning[] = []

  // This picks out and parses each image node in the Figma data structure
  const images = figmaDocumentParser<ImageKey, Node<'FRAME'>>({
    document: file.document,
    figmaFile,
    project,
    variants,
    mergeWarnings: newWarnings => newWarnings.forEach(warning => warnings.push(warning)),
    nodeParser: parseImageNode,
    variantMerger: mergeVariants,
    shouldSkipNode: node => !node?.exportSettings?.length,
    excludeTextKeys,
    excludeChildrenTextKeys,
    outDir: parsedOutputDir,
  })

  const [largestVariants, variantWarnings] = getLargestVariants(images, variants)

  await handleImagesLogging({ log: flags.log, warnings, variantWarnings, project, figmaFile })

  if (Object.keys(largestVariants).length === 0) {
    console.error(chalk.red('0 images have been parsed from figma'))

    return process.exit(1)
  }

  // This mapping is a formatting required by the figma API
  const groupedImagesByKey = groupImagesByTypeAndScale(largestVariants)
  const groupedImagesByArray: ImageKey[][] = Object.keys(groupedImagesByKey).map(key => groupedImagesByKey[key])

  const imageCache = flags.cache && (await cache.get([cache.keys.FIGMA_IMAGES, project]))

  const urlSpinner = ora('Fetching image URLs from figma...').start()
  const imageURLs: Record<string, string> = imageCache ?? (await getUrlsForImages(figma, figmaFile, groupedImagesByArray))

  if (flags.cache) cache.set(imageURLs, [cache.keys.FIGMA_IMAGES, project])

  urlSpinner.succeed()

  await recursiveMkdir(parsedOutputDir)

  const options = { quality: flags.quality, optimize: flags.optimize, tsx: flags.tsx, native: flags.native } as DownloadOptions
  const { progress, downloadPromises } = downloadImagesWithProgress(largestVariants, imageURLs, options)

  await handleProgress({ promise: downloadPromises, progress }, (value, total, spinner) => {
    // eslint-disable-next-line no-param-reassign
    spinner.text = `Downloading images from aws... (${value}/${total})`
  })

  if (flags.jsonRef) {
    const imagekeyPath = await writeImageKeys(parsedOutputDir, largestVariants, flags.merge)

    ora(`Written image keys to '${imagekeyPath}'`).succeed()
  }

  ora('Done').succeed()
}

export default image
