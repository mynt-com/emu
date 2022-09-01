# Emu

## Beta
This project is currently in beta (0.x.x) until first public release (1.x.x) many changes may occur.

### What is emu?
Emu is a heavily configurable CLI tool focused on extracting text content, css styling and images into JSON or typescript files from your figma project

### Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for technical details

# Quick Setup / Installation

_This will get you stared with texts, but emu do more than just texts. It can extract styling, images, tokens etc. You can always pass the `--help` flag to see what options each command has and what commands are avaliable. More information about each command is avaliable further down_

## Single file
1. Install emu via `yarn add @mynt/emu` or `npm i @mynt/emu`. [See this paragraph](#running-emu) for more info on how to run emu
2. Get a personal access token from figma. Head to your settings (user icon top right in figma) and create one there. [Figma Access Token Guide](https://www.figma.com/developers/api#access-tokens)
3. You can store the personal access token as an env variable named `EMU_FIGMA_TOKEN` or store it in a config by running `emu config --quick` and then enter your personal access token in the prompt. When prompted about project id, simply press enter to skip it
4. Run `emu texts` and pass the `--file-id` flag followed by the id of the figma file which you can find in the url of the file. This will extract textkeys from the file
5. You should get a texts.json file in your current directory, if all went well, you're ready to use emu with figma.

## Multiple project files
1. Install emu via `yarn add @mynt/emu` or `npm i @mynt/emu`. [See this paragraph](#running-emu) for more info on how to run emu
2. Get a personal access token from figma. Head to your settings (user icon top right in figma) and create one there. [Figma Access Token Guide](https://www.figma.com/developers/api#access-tokens)
3. Run `emu config --quick` and then enter your personal access token in the prompt _(or store it as an env variable **EMU_FIGMA_TOKEN**)_ and your project id. \
  If you dont have a project, you need to create one and place your files in there, [Figma Project Guide](https://help.figma.com/hc/en-us/articles/360038006494-Create-new-projects).
4. Run `emu texts` and select what file you want to extract textkeys from.
5. You should get a texts.json file in your current directory, if all went well, you're ready to use emu with figma.

# Running Emu
You can either install it globally with `yarn global add @mynt/emu` / `/npm i -g @mynt/emu` or preferably as a dev dependency. If you install emu in your project, you can run emu directly with yarn as `yarn emu`. With npm you need to add emu to your scripts such as `{ "scripts": { "emu": "emu" }`. Then you can run `npm run emu`
# Text
To extract text, or textkeys you can run the command `emu texts`. You will be prompted to select a file to extract them from. This will find all text layers and output a json file where the key is the layer name and the value is the text content. Additionally if you pass the `--styles` flag you can extract css values from this text layer. This allows you to hand over all text styling to figma. If you're ending up with an empty json file when you shouldnt, please make an issue with the textkey and content. Try making sure your textkey is camelCase and is using english letters only, even though this should not a requirement.

# Images
To extract images from figma you can run `emu images`. Select which page you would like to extract images from. It will **[only download images with an export](https://help.figma.com/hc/en-us/articles/360040028114-Guide-to-exports-in-Figma)** and ignore the rest. The images will be written to an images folder and a json file will be created adjacent to this folder with a reference and size of each image. If you have any variants, those will be included there aswell. You can change the output path of these images by passing a `-o | --output` flag. The images.json file will be written to that path and the images directory will be created adjascent to that file.

To have variant images for different sized platforms, you need to have any number of frames at the root of the project, these names must be uniue. In each frame you can have the same image which must have the same layer name. Each size and variant name will be stored in the images.json file. Note that emu will only download the largest image from all of your variants. If they have cut or sliced differently, that will not be downloaded/reflected, only the size or scale.

To find see detailed warnings or duplicates, you can pass the `--log` flag which will create a `emu-log.txt` textfile with links and detailed information about each warning or duplication.

If your image is not showing up in the downloads, make sure the image has an export. It is the most common cause of why the image is not being included.

# Tokens
The tokens command extracts tokens such as text formats, colors, spacings, strings from a project file.

The tokens expects a deterministic file stucture inside figma. Each page in figma needs to include a root frame frame which has the same name as the page. The page name will be the key in the resulting json. Inside this frame you may add text elements where the layer name will be the key and the value will be its text content.

Here is a basic example structure
```
Typography (page)
├─ emu_token_type (text)
├─ Typography (frame)
│  ├─ Heading 1 (text)
│  ├─ Paragraph (text)
Spacings (page)
├─ emu_token_type (text)
├─ Spacings (frame)
│  ├─ small (text)
│  ├─ large (text)

```

There are some special cases regarding colors, shadows and styles. For these you must include another textlayer adjacent to the root frame named **emu_token_type**. This will determine how emu will parse the node. You can set the textcontent of the emu_token_type node to "strings", "numbers", "colors", "shadows" or "styles". The default is strings.

### Strings & Numbers
These two simply returns the textcontent as a string or a number. If it fails to parse the number, it will return a string instead.

### Colors
For colors you are required to create a shape with a color style attached to it. The key will become the color style name and the value will be the style value. If opaque colors are used, these colors will be converted from rgba to rgb assuming the color has a white background. Any other elements in the page will be ignored.

### Shadows
Shadows is similar to colors, a shape is required to have an effect style where the effect name is the key and the effect styling will become the string value.

### Styles
For styles you must have textlayers where the name will become the key and the value will be a json object with the following properties: fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, textDecoration. This may be expanded on in the future.

# Style variants
Style variants are used to switch between two or more different styles on different scenarios. A common use case is desktop vs mobile design. To add support for style variants each figma page must have two frames at the root with a unique name. You need to then either pass these variants to the text command as a flag (--variants) or add it to the emu config via `emu config`.

Once that has been added and you run the text command, the output value structure will be a little different, the styles property will be replaced with a variants property which includes an object for each variant, where the key is the variant name, and the style is the style for that textkey inside each style variant frame.

# Filtering
If you wish to filter out certain layers you can pass two flags on the `texts` and `images` commands. `--exclude` allows you to pass a comma seperated list of names or RegEx to ignore, not that the children of these layers will still be included. If you wish to use frames as a filter for all its children, you can use the `--exclude-children` flag to ignore that element and all of its children.
# Maintenance
When using the `.emu.config.json` configuration file, it needs to be maintained to reflect what is live on figma. The files entry in the configuration file act as a cache of what pages exist on figma. When a designer adds new pages in a figma file you need to run `emu config update-pages` to refetch the figma data and update the emu configuration file "cache" and allow emu to fetch data from these new pages.
# Configuration
To start using emu you need to first configure it. You need to run `emu config` to create the initial `.emu.config.json` configuration file. This file is used to store API keys, figma pages etc. If you wish to store the API keys as an environment variable instead see [Environment Variables](#environment-variables), when prompted about the key, simply hit enter to skip it.

You can skip the non-essential options by passing -q or --quick such as `emu config --quick`.

When prompted about the project ID's, unfortunately the Figma API does not support fetching the project ID's or any other oauth flow. The user must get them from the url inside their web app and then paste it here in the configuration flow so that EMU knows the ID's of each project. See the short clip below on where to find that. Make sure you enter each project you want to fetch textkeys from, otherwise emu will not be able to find the correct figma files.

Emu looks at the current directory for a `.emu.config.json` file, if you have one stored elsewhere, you can pass a `-c | --config` flag to specify a path to the config file.

# Public files
If you wish to load and parse public figma files where you dont have access to the project id, you can pass the `--file-id` flag followed by the figma file id wich you can find in the url of the figma file. See [Extra](#extra) for our public emu test files.

# Environment variables
There are currently 3 environment variables in use. See the `env.ts` file if any are missing here.

```
EMU_VERBOSE = "true" | "false"                  enables verbose logging
EMU_FIGMA_TOKEN = "0abc123"                     figma access token
EMU_SKIP_VERSION_VALIDATION = "true" | "false"  skip the emu version validation
```

# Extra
There are three public example figma files that are created by mynt that you can test this tool on. Each file is made for each corresponding command \
Images: https://www.figma.com/file/ULg4EvbGvC0UdfDIx7Zwlc/Images \
Tokens: https://www.figma.com/file/8ITmOL7FYZ3Oeb9j6JJ0Bp/Tokens \
Texts: https://www.figma.com/file/7sKzrKY7s4LTYjUbbcEWI7/Texts