import { GetFileResult } from 'figma-api/lib/api-types'
import { workerData, parentPort } from 'worker_threads'
import { FigmaFile, TextKey, Warning } from '../helpers/constants'
import { figmaDocumentParser } from '../helpers/generics'
import { mergeVariants, parseTextNode } from '../helpers/textHelper'

export type TextNodeWorkerData = {
  figmaFile: FigmaFile
  variants: string[]
  document: GetFileResult['document']
  project: string
  excludeTextKeys?: (string | RegExp)[]
  excludeChildrenTextKeys?: (string | RegExp)[]
  outDir?: string
  textKeyFormat?: RegExp
  includeNodes?: string[]
}

export type TextNodeWorkerResult = {
  textKeys?: Record<string, Record<string, TextKey>>
  warnings: Warning[]
  error?: any
}

const { includeNodes, ...parserArgs } = workerData as TextNodeWorkerData

const warnings: Warning[] = []

const shouldSkipNode = (node: any) => {
  if (!includeNodes) return false

  return !includeNodes.includes(node.type)
}

const textKeys = figmaDocumentParser({
  ...parserArgs,
  mergeWarnings: (newWarnings: Warning[]) => newWarnings.forEach(warning => warnings.push(warning)),
  nodeParser: parseTextNode,
  shouldSkipNode,
  variantMerger: mergeVariants,
})

parentPort?.postMessage({
  textKeys,
  warnings,
})
