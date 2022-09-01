import chalk from 'chalk'
import { ConfigFile, FigmaFile } from '../helpers/constants'
import { isVerboseEnv } from '../helpers/generics'

type ConfigConstructor = {
  config: ConfigFile | null
  path: string
  projectIds?: string | string[]
  allowNoConfig?: boolean
}

export class Config {
  file: ConfigFile
  path: string

  constructor({ config, path, projectIds, allowNoConfig }: ConfigConstructor) {
    if (config === null && !allowNoConfig) {
      if (path) {
        console.error(chalk.red(`found no config file at '${path}'`))
        console.error(chalk.red(`please run 'emu config' or specify a config path with the '--config' flag`))
        process.exit(1)
      }

      console.error(chalk.red("found no local or global config, please run 'emu config' first"))
      process.exit(1)
    }

    this.file = config ?? ({} as ConfigFile)
    this.path = path

    if (projectIds) {
      const ids = Array.isArray(projectIds) ? projectIds.join(',') : projectIds

      this.file.PROJECT_ID = ids
    }

    if (!projectIds && !this.file.PROJECT_ID && !allowNoConfig) {
      console.error(chalk.red('missing project ids in config file or missing --project-ids flag or --file-id flag'))
      process.exit(1)
    }

    if (isVerboseEnv()) console.log(`(using config at '${path}')`)
  }

  figmaFile(name?: string): FigmaFile
  figmaFile(name?: string, options?: { noError: boolean }): FigmaFile | null
  figmaFile(name?: string, options?: { noError: boolean }) {
    const file = this.file?.files?.find(file => file.name.toLowerCase() === name?.toLowerCase())

    if (!file) {
      if (options?.noError) return null

      console.error(chalk.red(`unable to find the '${name}' project inside the config file`))
      return process.exit(1)
    }

    return file
  }
}
