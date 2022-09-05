import chalk from 'chalk'
import cp from 'child_process'
import { program } from 'commander'
import { Node, NodeTypes } from 'figma-api'
import { GetFileResult, GetProjectFilesResult, ProjectFile } from 'figma-api/lib/api-types.js'
import { promises as fsAsync } from 'fs'
import ora from 'ora'
import path from 'path'
import semver from 'semver'
import util from 'util'
import dotenv from 'dotenv'
import { Figma } from '../abtractions/figma'
import { ProgramFlags } from '../cli'
import { FigmaFile, Warning } from './constants'
import { ENV } from './env'
import * as prompts from './prompts'
import { createWarning, findDuplicateWarnings } from './textHelper'

const exec = util.promisify(cp.exec)

export const setVerboseEnv = (verbose?: boolean) => {
  if (verbose === true) process.env[ENV.EMU_VERBOSE] = 'true'
}

export const isVerboseEnv = () => process.env[ENV.EMU_VERBOSE] === 'true'

const setSkipVersionValidation = (skip?: boolean) => {
  if (skip === true) process.env[ENV.EMU_SKIP_VERSION_VALIDATION] = 'true'
}

const isSkipVersionValidation = () => process.env[ENV.EMU_SKIP_VERSION_VALIDATION] === 'true'

export const isProductionEnv = () => process.env[ENV.EMU_ENVIRONMENT] === 'production'

type RecursiveReducer = (prev: any, next: any) => Record<string, any>
type ShouldParseNode = (child: Node) => boolean

type RecursiveReduceChildrenOptions = {
  child: any
  test?: ShouldParseNode
  reducer: RecursiveReducer
  initial?: any
  skipNodeChildren?: ShouldParseNode
}

// This basically does a reduce on all of the children nodes in the figma tree
// The recurse function must return an object, hence the type above
export const recursiveReduceChildren = ({ child, test, reducer, initial, skipNodeChildren }: RecursiveReduceChildrenOptions) => {
  const recurseChildren = (subject: any, data: any[] = []) => {
    if (skipNodeChildren && skipNodeChildren(subject)) return data

    subject?.children?.forEach((next: any) => {
      // This parent linking is a lazy solution that works. An easily searchable data structure would be a better solution
      // eslint-disable-next-line no-param-reassign
      next.parent = subject

      // eslint-disable-next-line no-param-reassign
      data = recurseChildren(next, data)
    })

    if (!test) return [...data, subject]

    return test(subject) ? [...data, subject] : data
  }

  return recurseChildren(child).reduce(reducer, initial)
}

export const findNearestLinkableParent = (node: Node) => {
  // There is lacking documentation for what elements can be linked to, these are found by trail and error
  const componentsThatCanBeLinkedTo: (keyof NodeTypes)[] = ['FRAME']

  const recurse = (node: Node): Node | null => {
    if (componentsThatCanBeLinkedTo.includes(node.type)) return node

    // this parent prop comes from the recursiveReduceChildren method
    const nodeWithParent = node as any

    if (!nodeWithParent.parent) return null

    return recurse(nodeWithParent.parent)
  }

  return recurse(node)
}

// Pass data between each loop when parsing nodes, you can pass anything here
type DefaultContextData = {
  /* add default values here */
} & Record<string, any>

export type NodeParserContext = {
  variant?: string
  outDir?: string
  page?: string
  excludeTextKeys?: (string | RegExp)[]
  contextData: DefaultContextData
  mergeWarnings?: (warnings: Warning[]) => void
  figmaFile: FigmaFile
}

type figmaDocumentParserProps<NodeType extends Record<string, unknown>, FigmaNode extends Node> = {
  figmaFile: FigmaFile
  variants: string[]
  document: GetFileResult['document']
  project: string
  shouldSkipNode?: (node: FigmaNode, page?: string) => boolean
  nodeParser: (node: FigmaNode, prevNodes: Record<string, any>, context: NodeParserContext) => Record<string, any>
  variantMerger: (
    nextVariantNode: [string, NodeType],
    prevVariantNode: Record<string, NodeType>,
    oldVariantNode: Record<string, NodeType>,
  ) => Record<string, NodeType>
  mergeWarnings?: (warnings: Warning[]) => void
  excludeTextKeys?: (string | RegExp)[]
  excludeChildrenTextKeys?: (string | RegExp)[]
  outDir?: string
  textKeyFormat?: RegExp
}

export const commaSeperatedArray = (value = '', delimiter: string | RegExp = /,|\s/) =>
  value
    .split(delimiter)
    .map(v => v.trim())
    .filter(v => v !== '')

export const figmaDocumentParser = <NodeType extends Record<string, unknown>, FigmaNode extends Node>({
  figmaFile,
  variants,
  document,
  project,
  nodeParser,
  variantMerger,
  shouldSkipNode,
  excludeTextKeys,
  excludeChildrenTextKeys,
  mergeWarnings,
  outDir,
  textKeyFormat,
}: figmaDocumentParserProps<NodeType, FigmaNode>) => {
  const contextData: DefaultContextData = {
    /* add any default values here */
  }

  return figmaFile.pages.reduce<Record<string, NodeType>>((prevPageNodes: Record<string, NodeType>, page: string) => {
    const child = document.children.find(child => child.name === page) as Node<'FRAME'> | undefined

    if (child === undefined) {
      console.error(chalk.red(`unable to find the '${page}' page in the downloaded figma file (in ${project} project)`))
      return process.exit(1)
    }

    const reducer = (variant?: string) => (prev: Record<string, NodeType>, node: FigmaNode) =>
      nodeParser(node, prev, { outDir, page, excludeTextKeys, contextData, variant, mergeWarnings, figmaFile })

    const test = (node: Node<keyof NodeTypes>) => {
      // In this method, true = good node meaning we dont skip it. false = bad node meaning we skip it
      const excludeIsValid = typeof excludeTextKeys !== 'undefined' && excludeTextKeys.length > 0

      const exclude = !!excludeTextKeys?.some(exclude => {
        if (exclude instanceof RegExp) {
          return exclude.test(node.name)
        }

        return exclude === node.name
      })

      const skip = !!shouldSkipNode?.(node as FigmaNode, page)

      // If there is a formatting regex, add it to warnings if we're not skipping or excluding it
      if (textKeyFormat instanceof RegExp && !skip && !exclude) {
        if (!textKeyFormat.test(node.name)) {
          mergeWarnings?.([
            createWarning({
              node,
              figmaFile,
              page,
              description: `textkey '${node.name}' did not conform to regex ${textKeyFormat.toString()}`,
            }),
          ])
          return false
        }
      }

      // If both are passed, check both conditions, otherwise check them individually
      if (shouldSkipNode && excludeIsValid) return !exclude || !skip

      if (excludeIsValid) return !exclude

      if (shouldSkipNode) return !skip

      return true
    }

    const skipNodeChildren = (node: Node<keyof NodeTypes>) =>
      !!excludeChildrenTextKeys?.some(exclude => {
        if (exclude instanceof RegExp) return exclude.test(node.name)

        return node.name === exclude
      })

    // Filter and parse the figma nodes into the nodes we want
    const traverse = (child: Node, variant?: string): Record<string, NodeType> =>
      recursiveReduceChildren({
        child,
        reducer: reducer(variant),
        skipNodeChildren,
        test,
        initial: {},
      })

    if (!variants?.length) return { ...prevPageNodes, ...traverse(child) }

    const pageVariant = variants.reduce((prevVariantNodes: Record<string, NodeType>, variant: string) => {
      const variantRoot = child?.children.find(child => child.name === variant)

      if (!variantRoot) {
        if (isVerboseEnv()) console.log(chalk.yellow(`unable to find variant '${variant}' in ${page}`))
        return prevVariantNodes
      }

      const parsedVariantNodes = traverse(variantRoot, variant)

      // Merge the prev variant with the next one
      const mergedVariantNodes: any = Object.entries(parsedVariantNodes).reduce(
        (prev, next) => variantMerger(next, prev, prevVariantNodes),
        {},
      )

      mergeWarnings?.(
        findDuplicateWarnings<NodeType>({
          newTextKeys: parsedVariantNodes,
          oldTextKeys: prevVariantNodes,
          figmaFile,
          page,
          variant,
        }),
      )

      // Merge the prev variant with the next variant
      return {
        ...prevVariantNodes,
        ...mergedVariantNodes,
      }
    }, {})

    // Check for any warnings
    mergeWarnings?.(
      findDuplicateWarnings<NodeType>({
        newTextKeys: pageVariant,
        oldTextKeys: prevPageNodes,
        figmaFile,
        page,
      }),
    )

    // Merge the previous page with its variants with the current one and its variants
    return { ...prevPageNodes, ...pageVariant }
  }, {})
}

const reduceAllProjectFiles = (projects: GetProjectFilesResult[]) =>
  projects.reduce<ProjectFile[]>((acc, next) => [...acc, ...next.files], [])

export const getAllProjectFiles = async (figma: Figma, ids: string) => {
  const projects = await figma.projects(ids)

  return { files: reduceAllProjectFiles(projects) }
}

export const tryParseJSON = <T>(data: unknown): T | null => {
  try {
    return JSON.parse(data as string)
  } catch {
    return null
  }
}

export const parseFlags = <T extends Record<string, any> | undefined>(actionFlags: T): T & ProgramFlags => {
  const flags = { ...program.opts<ProgramFlags>(), ...actionFlags }

  setVerboseEnv(flags?.verbose)
  setSkipVersionValidation(flags.skipVersionValidation)
  dotenv.config({ path: flags.env })

  return flags
}

const getLatestRemoteVersion = async () => {
  const version = await exec('git ls-remote --tags --sort=-refname git@github.com:mynt-com/emu.git').catch(({ stderr }) => ({
    stderr,
    stdout: null,
  }))

  if (version.stderr || version.stdout === null) {
    return version
  }

  const allVersions = version.stdout.match(/\d+\.\d+\.\d+/g) ?? []
  const [latest] = allVersions.sort((a, b) => semver.compare(b, a))

  return latest
}

const getEmuVersion = async (): Promise<Record<string, any>> => {
  const localPackage = JSON.parse(await fsAsync.readFile('./package.json', 'utf-8').catch(() => '{}'))

  if (localPackage?.name !== 'emu') {
    return JSON.parse(await fsAsync.readFile(path.join('node_modules', 'emu', 'package.json'), 'utf8').catch(() => '{}'))
  }

  return localPackage
}

export const verifyEmuVersion = async (skip = false) => {
  if (isSkipVersionValidation() || skip) return

  const latest = await getLatestRemoteVersion()
  const { version } = await getEmuVersion()

  // need to find a better way to get the stderr
  if (typeof latest !== 'string' || typeof version !== 'string') {
    console.warn(chalk.yellow('unable to read emu version, you may be running an old version'))

    if (typeof latest !== 'string' && latest?.stderr) {
      console.error(latest.stderr)
    }

    return
  }

  const [latestMajor, latestMinor, latestPatch] = latest.split('.').map(v => parseInt(v, 10))
  const [currentMajor, currentMinor, currentPatch] = version.split('.').map(v => parseInt(v, 10))

  const isOldMajor = latestMajor > currentMajor
  const isOldMinor = latestMinor > currentMinor
  const isOldPatch = latestPatch > currentPatch

  if (isOldMajor || isOldMinor || isOldPatch) {
    return console.warn(chalk.red(chalk.yellow(`A newer version of Emu is avaliable (current: '${version}', latest: '${latest}')`)))
  }
}

export const recursiveMkdir = (outDir = '') => {
  if (outDir === '') return

  const hasFileEnding = path.extname(outDir) === '.json'
  const pathWithoutFile = path.dirname(outDir)

  const dirPath = hasFileEnding ? pathWithoutFile : outDir

  return fsAsync.mkdir(dirPath, { recursive: true })
}

export const sortTextKeys = (keys: Record<string, any>) =>
  Object.keys(keys)
    .sort((a, b) => a.localeCompare(b))
    .reduce((prev, key) => ({ ...prev, [key]: keys[key] }), {})

/**
 * This method clears the line and sets the cursor to 0 when logging with ORA spinners.
 * It prevents the normal errors and logs appearing at the end of a line
 */
export const wrapLogging = () => {
  const { log, error } = console

  const wrapper =
    (logger: Function) =>
    (...args: any[]) => {
      process.stdout.clearLine(0)
      process.stdout.cursorTo(0)

      logger(...args)
    }

  console.log = wrapper(log)
  console.error = wrapper(error)
}

export const handleMissingFigmaFileArgument = async <T extends Record<string, any> | undefined>(
  figma: Figma,
  ids: string | undefined,
  action: Function,
  flags?: T & ProgramFlags,
) => {
  if (!ids) {
    console.error(chalk.red('missing project argument or --project-ids flag'))
    return process.exit(1)
  }

  const spinner = ora('Fetching project files ...').start()
  const { files } = await getAllProjectFiles(figma, ids)

  spinner.succeed()

  const filteredFiles = files.filter(file => file.name !== 'Untitled')
  const choices = filteredFiles.map(file => ({ message: file.name, name: file.name }))

  const { file } = await prompts.projectSelect(choices)

  return action(file, flags)
}

type HandleFigmaFileProjectIdOptions = { projectId?: string; pages: string[] }

export const handleFigmaFileProjectId = (figmaFile?: FigmaFile | null, options?: HandleFigmaFileProjectIdOptions): FigmaFile => {
  if (figmaFile) return figmaFile

  if (!options?.projectId) {
    console.error(chalk.red('missing project argument or --project-id flag'))
    return process.exit(1)
  }

  return {
    name: options.projectId,
    url: options.projectId,
    pages: options.pages,
  }
}
