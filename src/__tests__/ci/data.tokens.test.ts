import fs from 'fs'
import path from 'path'

const tokensPath = 'ci/output/tokens'

const tokens: Record<string, string> = fs
  .readdirSync(tokensPath)
  .reduce((tokens, file) => ({ ...tokens, [file.slice(0, -3)]: path.join(tokensPath, file) }), {})

describe('Test the emu tokens data output', () => {
  const allTokens = Object.keys(tokens)

  it('parsed all tokens and wrote the files', () => {
    expect(allTokens).toStrictEqual(['Colors', 'Constants', 'Shadows', 'Spacings', 'Typography'])
  })

  it('parsed Color tokens correctly', async () => {
    const { default: Colors } = await import(path.resolve(tokens.Colors))

    expect(Colors).toStrictEqual({
      mainRed: 'rgb(255, 0, 0)',
      mainBlue: 'rgb(5, 0, 255)',
      subGreen: 'rgb(128, 255, 148)',
      subPink: 'rgb(255, 128, 242)',
    })
  })

  it('parsed Constants tokens correctly', async () => {
    const { default: Constants } = await import(path.resolve(tokens.Constants))

    expect(Constants).toStrictEqual({
      euDateFormatt: 'YYYY-MM-DD',
      usDateFormatt: 'MM-DD-YYYY',
    })
  })

  it('parsed Shadows tokens correctly', async () => {
    const { default: Shadows } = await import(path.resolve(tokens.Shadows))

    expect(Shadows).toStrictEqual({
      hoverMedium: '0px 8px 25px rgb(201, 201, 202)',
      hoverSmall: '0px 8px 8px rgb(201, 201, 202)',
      focusPrimary: '0px 8px 25px rgb(201, 201, 202)',
      focusSecondary: '0px 8px 15px rgb(201, 201, 202)',
    })
  })

  it('parsed Spacings tokens correctly', async () => {
    const { default: Spacings } = await import(path.resolve(tokens.Spacings))

    expect(Spacings).toStrictEqual({
      massive: 20,
      large: 16,
      medium: 12,
      small: 8,
      tiny: 4,
    })
  })

  it('parsed Typography tokens correctly', async () => {
    const { default: Typography } = await import(path.resolve(tokens.Typography))

    expect(Typography).toStrictEqual({
      paragraphSmall: {
        fontFamily: 'Inter',
        fontSize: '12px',
        fontWeight: 400,
        lineHeight: '14.1px',
      },
      paragraphLarge: {
        fontFamily: 'Inter',
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: '18.8px',
      },
      titleSmall: {
        fontFamily: 'Inter',
        fontSize: '24px',
        fontWeight: 700,
        lineHeight: '28.1px',
      },
      titleLarge: {
        fontFamily: 'Inter',
        fontSize: '32px',
        fontWeight: 700,
        lineHeight: '37.5px',
      },
    })
  })
})
