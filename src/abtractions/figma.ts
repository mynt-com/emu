import chalk from 'chalk'
import { Api as FigmaApi } from 'figma-api'
import { GetProjectFilesResult } from 'figma-api/lib/api-types'
import { commaSeperatedArray } from '../helpers/generics'

type GetProjectFilesResultWithName = GetProjectFilesResult & { name: string }

type FigmaApiConstructor = {
  token?: string
}

export class Figma {
  private api: FigmaApi

  constructor({ token }: FigmaApiConstructor) {
    if (typeof token !== 'string' || token.length === 0) {
      console.error(chalk.red('token is invalid in the config or ENV'))
      process.exit(1)
    }

    this.api = new FigmaApi({ personalAccessToken: token })
  }

  projects(projectIds: string | string[]): Promise<GetProjectFilesResultWithName[]> {
    let ids = projectIds

    if (typeof ids === 'string') {
      ids = commaSeperatedArray(ids)
    }

    return Promise.all(
      ids.map(
        id =>
          this.api.getProjectFiles(id).catch(error => {
            console.error(chalk.red(error.message))
            process.exit(1)
          }) as Promise<GetProjectFilesResultWithName>,
      ),
    )
  }

  file(...args: Parameters<typeof this.api.getFile>) {
    return this.api.getFile(...args).catch(error => {
      console.error(chalk.red(error.message))
      process.exit(1)
    })
  }

  image(...args: Parameters<typeof this.api.getImage>) {
    return this.api.getImage(...args)
  }
}
