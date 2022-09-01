import { program as cli } from 'commander'
import text from './actions/texts'
import config from './actions/config'
import image from './actions/images'
import { DEFAULT_IMAGE_QUALITY, WARNING_LOG_NAME } from './helpers/constants'
import tokens from './actions/tokens'
import packageJSON from '../package.json'
import { isProductionEnv } from './helpers/generics'

export type ProgramFlags = {
  config?: string
  skipVersionValidation?: boolean
  projectIds?: string
  env?: string
}

cli
  .option('-c, --config <path>', 'provide a specific emu config path')
  .option('--skip-version-validation', 'skips the emu version validation')
  .option('--project-ids <ids>', 'override figma project ids')
  .option('--env <dot-env-path>', 'provide a path to a .env file')

const Texts = cli
  .command('texts')
  .argument('[project]', "name of the project, eg 'gazelle' or 'backoffice'")
  .option('-o, --out-dir <path>', 'output directory of the textkey json file')
  .option('-s, --styles', 'adds the css style of the textkey, replacing the text with an object with the characters and styling')
  .option('-V, --variants <variants>', 'will append any variant styles, (requires the --styles flag)')
  .option('-e, --exclude <textkeys>', 'exclude any of these comma seperated textkeys, you may pass a RegExp')
  .option('-ec, --exclude-children <textkeys>', 'exclude the children any of these comma seperated textkeys, you may pass a RegExp')
  .option('--fid, --file-id <id>', 'pass a file id to process, this is used when you want to fetch a public figma file')
  .option('--key-format <RegExp>', 'will only include textkeys that match this js RegExp, pass --log to see which keys that are excluded')
  .option('--merge', 'merges the textkeys with any existing ones instead of replacing them')
  .option('-v, --verbose', 'verbose logging')
  .option('--log', `will write a log file named '${WARNING_LOG_NAME}' with links to the duplicate textkey components in figma`)
  .description('downloads texts and creates a textkey file json file')
  .action(text)

const Images = cli
  .command('images')
  .argument('[project]', "name of the project, eg 'gazelle' or 'backoffice'")
  .option('--native', 'convert the svg -> tsx components into react-native components')
  .option('-o, --outDir <path>', 'output directory')
  .option('--no-optimize', 'skips the png/jpg optimization')
  .option('--tsx', 'convert the svg files into tsx components')
  .option('-e, --exclude <imageKeys>', 'exclude any of these comma seperated imageKeys, you may pass a RegExp')
  .option('-ec, --exclude-children <imageKeys>', 'exclude the children any of these comma seperated imageKeys, you may pass a RegExp')
  .option('--fid, --file-id <id>', 'pass a file id to process, this is used when you want to fetch a public figma file')
  .option('--merge', 'merge in any new images and image keys instead of removing all of them (only with --json-ref)')
  .option('--json-ref', 'outputs a json file that references each images and its intended size from figma including variants')
  .option('-V, --variants <variants>', 'will append any variant images and their sizes (requires the --json-ref flag)')
  .option(
    '-q, --quality <value>',
    'quality of the image optimization, (between 0.0-1.0)',
    value => parseFloat(value),
    DEFAULT_IMAGE_QUALITY,
  )
  .option('-v, --verbose', 'verbose logging')
  .option('--log', `will write a log file named '${WARNING_LOG_NAME}' with links to the duplicate image key components in figma`)
  .description('downloads exported images from figma')
  .action(image)

cli
  .command('config')
  .argument('[update-pages]', 'update the pages in each figma project or change emu default values')
  .option('-q, --quick', 'only show the required prompts')
  .option('--copy-global', 'copies the global config in the users home directory to the current local directory')
  .option('--copy-local', 'copies the local config to the users home directory')
  .description('config for emu')
  .action(config)

const Tokens = cli
  .command('tokens')
  .argument('[file]', 'name of the figma file that tokens should be extracted from')
  .option('-o, --outDir <path>', 'output directory of the tokens')
  .option('--fid, --file-id <id>', 'pass a file id to process, this is used when you want to fetch a public figma file')
  .description('downloads the tokens from figma into typescript files')
  .action(tokens)

if (!isProductionEnv()) {
  ;[Texts, Images, Tokens].map(cmd => cmd.option('--cache', 'use cached files if they exist'))
}

cli.version(packageJSON.version)

export default cli
