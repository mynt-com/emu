import fs from 'fs'
import path from 'path'

const imagesPath = 'ci/output/images'

const imagesJson = JSON.parse(fs.readFileSync('ci/output/images.json', 'utf-8'))

const images: Record<string, string> = fs
  .readdirSync(imagesPath)
  .reduce((tokens, file) => ({ ...tokens, [file.slice(0, -4)]: path.join(imagesPath, file) }), {})

describe('Test the emu tokens data output', () => {
  const allImageKeys = Object.keys(images)
  const jsonImageKeys = Object.keys(imagesJson)

  it('parsed all tokens and wrote the files', () => {
    expect(allImageKeys).toStrictEqual(['unsplashBridge', 'unsplashFlowers', 'unsplashForest', 'unsplashRocks', 'unsplashValley'])
  })

  it('parsed all the json file correctly', () => {
    expect(jsonImageKeys.sort()).toStrictEqual(allImageKeys.sort())
  })

  it('json file url should equal the image path', () => {
    allImageKeys.forEach(key => {
      const imagePath = images[key]

      expect(imagePath).toEqual(imagesJson[key].url)
    })
  })

  it('image variants are correct', () => {
    const onlyMobile = ['unsplashForest', 'unsplashValley']
    const onlyDesktop = ['unsplashFlowers', 'unsplashRocks']
    const both = ['unsplashBridge']

    onlyDesktop.forEach(key => {
      expect(typeof imagesJson[key].variants?.variantDesktop).toStrictEqual('object')
      expect(Object.keys(imagesJson[key].variants)).toHaveLength(1)
    })

    onlyMobile.forEach(key => {
      expect(typeof imagesJson[key].variants?.variantMobile).toStrictEqual('object')
      expect(Object.keys(imagesJson[key].variants)).toHaveLength(1)
    })

    both.forEach(key => {
      expect(typeof imagesJson[key].variants?.variantMobile).toStrictEqual('object')
      expect(typeof imagesJson[key].variants?.variantDesktop).toStrictEqual('object')
      expect(Object.keys(imagesJson[key].variants)).toHaveLength(2)

      expect(imagesJson[key].variants?.variantMobile).not.toStrictEqual(imagesJson[key].variants?.variantDesktop)
    })
  })

  it('parsed the correct name and format', () => {
    allImageKeys.forEach(key => {
      expect(imagesJson[key].name).toEqual(key)
      expect(images[key].endsWith(imagesJson[key].format)).toBe(true)
    })
  })
})
