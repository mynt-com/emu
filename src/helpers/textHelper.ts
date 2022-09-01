import path from 'path'
import { promises as fsAsync } from 'fs'
import { Color, Node, TypeStyle } from 'figma-api'
import ora from 'ora'
import chalk from 'chalk'
import { findNearestLinkableParent, isVerboseEnv, NodeParserContext, tryParseJSON } from './generics'
import { ConfigFile, FigmaFile, TextKey, TEXTKEY_FILE_NAME, Warning, WARNING_LOG_NAME } from './constants'

export const roundDecimals = (value: number, decimalPlaces = 1) => Math.round(value * 10 ** decimalPlaces) / 10 ** decimalPlaces

const toRGBValue = (val: number) => Math.round(val * 255)

export const getRGBString = ({ r, g, b, a }: Color) => `rgba(${toRGBValue(r)}, ${toRGBValue(g)}, ${toRGBValue(b)}, ${roundDecimals(a, 2)})`

/**
 * This method merges in the alpha channel as if it was behind a white background to an adjusted rgb color without the alpha channel
 */
export const getRGBStringAlphaMerged = ({ r, g, b, a }: Color) => {
  const alphaOffset = 1 - a
  const mergedAlphaOffset = alphaOffset * 255

  const red = Math.round(toRGBValue(r) * a + mergedAlphaOffset)
  const green = Math.round(toRGBValue(g) * a + mergedAlphaOffset)
  const blue = Math.round(toRGBValue(b) * a + mergedAlphaOffset)

  return `rgb(${red}, ${green}, ${blue})`
}

export const parseStyle = (style: TypeStyle) => ({
  fontFamily: style?.fontFamily,
  fontSize: style?.fontSize ? `${style.fontSize}px` : undefined,
  fontWeight: style?.fontWeight,
  letterSpacing: style?.letterSpacing ? `${roundDecimals(style.letterSpacing)}px` : undefined,
  lineHeight: style?.lineHeightPx ? `${roundDecimals(style.lineHeightPx)}px` : undefined,
  textDecoration: style?.textDecoration,
})

export const parseTextNode = (
  node: Node,
  prev: Record<string, TextKey>,
  { variant, page, excludeTextKeys }: NodeParserContext,
): Record<string, any> => {
  const isTextNode = node.type === 'TEXT'
  const shouldBeExcluded = !!excludeTextKeys?.some(exclude => {
    if (exclude instanceof RegExp) {
      return exclude.test(node.name)
    }

    return exclude === node.name
  })

  if (!isTextNode || shouldBeExcluded) {
    return prev
  }

  const textNode = node as Node<'TEXT'>
  const parentFrame = findNearestLinkableParent(textNode)

  // This split comes from old emu, guessing there is a common special new line char from figma
  const characters = textNode.characters.split('\u2028').join('\n')
  const colorObject = textNode?.fills?.[0]?.color

  if (characters === '') return prev

  const name = textNode.name.split('\u2028').join('\n')
  const style = parseStyle(textNode.style)
  const color = colorObject && getRGBString(colorObject)
  const opacity = typeof textNode.opacity === 'number' ? roundDecimals(textNode.opacity, 2) : textNode.opacity

  const allStyles = {
    ...style,
    color,
    opacity,
  }

  const newNode = {
    debug: {
      id: parentFrame?.id,
      page,
    },
    name,
    characters,
  }

  if (variant) {
    const variants = {
      ...prev?.variants,
      [variant]: {
        style: allStyles,
      },
    }

    return {
      ...prev,
      [name]: {
        ...newNode,
        variants,
      },
    }
  }

  return {
    ...prev,
    [name]: {
      ...newNode,
      style: allStyles,
    } as unknown as TextKey,
  }
}

export const mergeVariants = <NodeType extends Record<string, any>>(
  [key, value]: [string, NodeType],
  prev: Record<string, NodeType>,
  prevVariantNodes: Record<string, NodeType>,
): Record<string, NodeType> => {
  const variants = {
    ...value.variants,
    ...(prevVariantNodes[key]?.variants ?? {}),
  }

  const merged = {
    [key]: {
      ...value,
      variants,
    },
  }

  return {
    ...prev,
    ...merged,
  }
}

export const formatFileName = (name: string, format?: string) => {
  let formattedName = name

  if (!format) return formattedName
  if (name.endsWith('.json')) formattedName = name.slice(0, -5)

  return format.replace('[name]', formattedName)
}

export const getFileOutputPath = (outDir?: string, config?: ConfigFile, fileFormat?: string): string => {
  const endsWithFilename = outDir && path.extname(outDir) === '.json'
  const unformattedFileName = endsWithFilename ? path.basename(outDir) : TEXTKEY_FILE_NAME
  const fileName = formatFileName(unformattedFileName, fileFormat)
  const outPath = path.join(process.cwd(), fileName)

  if (endsWithFilename && outDir) {
    if (path.isAbsolute(outDir)) {
      return formatFileName(outDir, fileFormat)
    }

    // We split the filename for the outdir, format it, then join it back togheter
    const formattedOutDir = path.join(path.dirname(outDir), formatFileName(path.basename(outDir), fileFormat))

    return path.join(process.cwd(), formattedOutDir)
  }

  if (outDir) {
    if (path.isAbsolute(outDir)) {
      return path.join(outDir, fileName)
    }

    return path.join(process.cwd(), outDir, fileName)
  }

  return outPath
}

export const stripDebugInfoFromTextKeys = (textKeys: Record<string, any>) =>
  Object.entries(textKeys).reduce((prev, [key, value]) => {
    const { debug: _debug, ...rest } = value

    return { ...prev, [key]: rest }
  }, {})

type CreateWarningArgs<NodeType> = {
  node: NodeType
  figmaFile: FigmaFile
  description?: string
  page?: string
  urls?: { link: string; page: string }[]
}

export const createWarning = <T extends Record<string, any>>({
  node,
  figmaFile,
  description,
  page,
  urls,
}: CreateWarningArgs<T>): Warning => {
  const nodeWithDebug = node as T & { debug: Record<string, string> }
  const id = nodeWithDebug?.debug?.id || node.id

  return {
    key: node.name,
    urls: urls || [
      {
        link: `https://www.figma.com/file/${figmaFile.url}/${figmaFile.name}?node-id=${encodeURIComponent(id)}`,
        page: page || 'unknown',
      },
    ],
    description,
  }
}

type FindDuplicateWarningsProps<NodeType extends Record<string, any>> = {
  newTextKeys: Record<string, NodeType>
  oldTextKeys: Record<string, NodeType>
  figmaFile: FigmaFile
  variant?: string
  page?: string
}

export const findDuplicateWarnings = <NodeType extends Record<string, any>>({
  newTextKeys,
  oldTextKeys,
  figmaFile,
  variant,
  page,
}: FindDuplicateWarningsProps<NodeType>) => {
  const newKeys = Object.entries(newTextKeys)
  const oldKeys = Object.entries(oldTextKeys)

  return newKeys.reduce<Warning[]>((prev, [key, node]) => {
    const foundDuplicates = oldKeys.filter(([oldKey, oldNode]) => {
      const isSameKey: boolean = oldKey === key

      if (variant) {
        return Object.keys(node.variants).some(variant => Object.keys(oldNode.variants).includes(variant))
      }

      // If one of the nodes doenst have characters (i.e images) just check the key
      if ([oldNode.characters, node.characters].some(chars => typeof chars === 'undefined')) {
        return isSameKey
      }

      return isSameKey && oldNode.characters !== node.characters
    })

    if (foundDuplicates.length > 0) {
      const urls = [[key, node], ...foundDuplicates].map(([, duplicateNode]) => {
        const nodeWithDebug = duplicateNode as NodeType & { debug: Record<string, string> }

        return {
          link: `https://www.figma.com/file/${figmaFile.url}/${figmaFile.name}?node-id=${encodeURIComponent(nodeWithDebug.debug.id)}`,
          page: page || 'unknown',
        }
      })

      return [
        ...prev,
        createWarning({
          node: { ...node, key },
          figmaFile,
          page: node?.debug.page,
          urls,
          description: `found duplicate textkeys in ${urls?.length} pages`,
        }),
      ]
    }

    return prev
  }, [])
}

export const writeWarningsLog = async (warnings: Warning[], logName = '') => {
  const name = logName.length ? `${logName}.` : logName

  const logPath = path.join(process.cwd(), name + WARNING_LOG_NAME)

  const log = warnings.reduce(
    (text, { key, urls, description = '' }) =>
      `${text}Key: ${key}\n${description}\n${urls.map(({ link, page }) => `${link} (${page})`).join('\n')}\n\n`,
    '',
  )

  await fsAsync.writeFile(logPath, log, 'utf-8')

  return { logPath }
}

/**
 * Returns a key-value pair of the textkey and its characters
 */
export const getTextKeyCharacters = (textkeys: Record<string, TextKey>) =>
  Object.keys(textkeys).reduce<Record<string, string>>((acc, key) => ({ ...acc, [key]: textkeys[key].characters }), {})

export const mergeTextkeys = async (filepath: string, textkeys: Record<string, TextKey>) => {
  const existingKeys = tryParseJSON<Record<string, TextKey>>(await fsAsync.readFile(filepath).catch(() => null))

  if (existingKeys === null) return textkeys

  return {
    ...existingKeys,
    ...textkeys,
  }
}

type PrintWarningsOptions = { log?: boolean; project: string }

export const printWarnings = async (warnings: Warning[], { log, project }: PrintWarningsOptions) => {
  if (isVerboseEnv()) warnings.forEach(warning => console.log(chalk.yellow(`Found duplicate textkey '${warning.key}'`)))
  if (warnings.length > 0) console.log(chalk.yellow(`Found a total of ${warnings.length} warnings`))

  if (!log) return

  if (warnings.length <= 0) return console.log(chalk.yellow('Attempted to write a log file, but there are no warnings'))

  const { logPath } = await writeWarningsLog(warnings, project)

  ora(chalk.yellow(`Written warnings log to '${logPath}'`)).succeed()
}

export const stringArrayToRegexArray = (strings: string[]) => strings.map(string => new RegExp(string))

export const parseTextkeyFormatter = (format?: string): RegExp | undefined => {
  if (!format) return

  return new RegExp(format)
}
