#!/usr/bin/env node
/* eslint-disable import/first */
import { ENV } from './helpers/env'

process.env[ENV.EMU_ENVIRONMENT] = process.env[ENV.EMU_ENVIRONMENT] || 'production'

import 'core-js/proposals/string-replace-all.js' // polyfill for string.prototype.replaceAll
import cli from './cli'
import { wrapLogging } from './helpers/generics'

/**
 * This method clears the line and sets the cursor to 0 when logging with ORA spinners.
 * It prevents the normal errors and logs appearing at the end of a line
 */
wrapLogging()

cli.parse()
