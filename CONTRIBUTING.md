# Contributing

If you have an idea or wish to add a new feature that many users can benefit from you are free to create a pull request. Please keep in mind that breaking changes unless they are a major benefit to either mynt or users in general will most likely be put on hold.

When creaing a pull request, make sure that you have done the following (this will be run once you push).
1. Ran the unit tests locally and they are passing (`yarn test`)
2. The code linting passed (`yarn lint`)

Once the pull request has been made, check to see if CircleCI gives the PR a pass.
If not, run the `test-emu-process.sh` script inside the CI folder and run `yarn test-ci` to see if any of the parsing and processing is incorrect.
The scripts require you to have a figma token as an exported env variable with the name `EMU_FIGMA_TOKEN`.

If your contributions adds any new processing or needs changes in [the default figma files](README.md#extra), let us know and change the tests accordingly.

# Folder structure
Any new commands to emu is added in the `src/cli.ts` file with its options and flags. The action function is stored in the `src/actions` with the same name as the command. Try keep any larger related sections of code inside a helper. These helpers are stored in the `src/helpers` folder. Any OOP applicable helpers/objects should be stored in the `src/abstractions` folder.

## Notes

### Forks
If you want to create a subprocess to do some parsing or processing. You can use the fork helper method to spawn a script inside the forks folder. Make sure that the name argument you pass to the fork method is a file name inside the forks folder. Your fork should export two types and be passed into the fork method as it is a generic. A data type which is the data the fork file expects from the fork method that you pass it. And a results/output type, which is used to give the resulting promise a proper type.