import enquirer from 'enquirer'
import { ConfigFile, LOCAL_DIR } from './constants'
import { commaSeperatedArray } from './generics'

type Choice = {
  message: string
  name: string
}

enum TextKeyKeys {
  file = 'file',
}

/**
 * Prompts the user which project they would like to extract keys from the given choices
 */
export const projectSelect = async (choices: Choice[]) => {
  const promise = enquirer.prompt<Record<TextKeyKeys, string>>({
    type: 'select',
    name: TextKeyKeys.file,
    message: 'What project would you like to use?',
    choices,
    required: true,
  })

  promise.catch(() => process.exit())

  return promise
}

/**
 * Prompts the user for data required for the figma api and other to make the tool functional.
 * Uses the given existing config for default values
 */
export const figmaConfig = async (config: ConfigFile | null, quick = false) => {
  enum ConfigKeys {
    configLocation = 'configLocation',
    FIGMA_TOKEN = 'FIGMA_TOKEN',
    PROJECT_ID = 'PROJECT_ID',
    variants = 'variants',
    excludeKeys = 'excludeKeys',
    confirm = 'confirm',
  }

  type PromptType = Parameters<typeof enquirer.prompt>[0]

  const prompts: PromptType = [
    {
      type: 'input',
      name: ConfigKeys.FIGMA_TOKEN,
      message: 'Provide your figma api token',
      initial: config?.FIGMA_TOKEN ?? '',
      required: true,
      validate: () => true, // Its a required prompt, but the input is optional
    },
    {
      type: 'input',
      name: ConfigKeys.PROJECT_ID,
      message:
        // eslint-disable-next-line max-len
        'Provide your project id\'s, comma seperated.\n  You can find it by going into figma => click on your team in the sidebar => click your project and copy the id from the url.\n  Look for "figma.com/files/project/<project-id>".\n ',
      initial: config?.PROJECT_ID,
      required: true,
      validate: () => true, // Its a required prompt, but the input is optional
    },
    {
      type: 'input',
      name: ConfigKeys.variants,
      message: 'Do you have any style variants? (leave bank if none)',
      format: value => commaSeperatedArray(value).join(','),
      initial: config?.variants?.join(','),
    },
    {
      type: 'input',
      name: ConfigKeys.excludeKeys,
      message: 'Do you want to exclude any specific strings/textkeys? (leave bank if none)',
      format: value => commaSeperatedArray(value).join(','),
      initial: config?.excludeKeys?.join(','),
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: `The configuration file will be saved at '${LOCAL_DIR}'`,
      initial: true,
      required: true,
    },
  ]

  const quickPrompts = prompts.filter((prompt: any) => prompt.required)

  const promise = enquirer.prompt<Record<ConfigKeys, string>>(quick ? quickPrompts : prompts)

  promise.catch(() => process.exit())
  promise.then(({ confirm }) => !confirm && process.exit())

  const data = await promise

  return { ...data, [ConfigKeys.configLocation]: LOCAL_DIR }
}

enum ConfigFigmaFilesKeys {
  files = 'files',
}

/**
 * Prompts the user which figma files of the ones given that they want to use
 */
export const configFigmaFiles = (choices: Choice[], initial?: number[]) => {
  const promise = enquirer.prompt<Record<ConfigFigmaFilesKeys, string[]>>({
    type: 'multiselect',
    name: ConfigFigmaFilesKeys.files,
    message: 'Which files do you want to include? (press spacebar to select)',
    choices,
    initial: initial as any, // array of numbers is actually valid, but the ts says it can only be a single number
  })

  promise.catch(() => process.exit())

  return promise
}
