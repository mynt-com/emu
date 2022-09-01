import fs from 'fs'

const texts = JSON.parse(fs.readFileSync('ci/output/texts.json', 'utf-8'))

describe('Test the emu text data output', () => {
  const allKeys = Object.keys(texts)

  it('can parse and ignore all valid textkeys', () => {
    expect(allKeys).toStrictEqual(['loginButton', 'logoutButton'])

    allKeys.forEach(key => {
      const { variantDesktop, variantMobile } = texts[key]?.variants ?? {}

      expect([variantDesktop, variantMobile].some(variant => variant === undefined)).toEqual(false)
      expect(variantDesktop).not.toStrictEqual(variantMobile)
    })
  })
})
