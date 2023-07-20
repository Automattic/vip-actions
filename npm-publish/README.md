# Publish to npm

This action will publish a GitHub repository to npm using GitHub Actions and is designed to work in tandem with the [npm-prepare-release](../npm-prepare-release/README.md) action. It is compatible with GitHub's Branch Protection.

The `npm-prepare-release` action is meant to be called first and will create a pull request. The `npm-publish` action is meant to be called automatically once the pull request is merged. It will publish to npm after running light validation (verify the pull request contains only certain changes, running `npm test`, and more), publish to npm, create a new GitHub release and add a tag. Finally, it will create a pull request to upgrade to the next develop version, which is assigned to the original caller of `npm-prepare-release` to review and merge.

## Inputs

* `NPM_TOKEN`: (required) the npm token used to publish the package.
* `GH_TOKEN`: (required) the GitHub access token to use. It is recommended to use the standard GitHub Actions access token (used in example).
* `node-version`: (optional) the Node.js version to use for the Action.

## Using the action

1. Add a GitHub Actions secret (Settings > Secrets > Actions) called `NPM_TOKEN` which is an automation token for the npmjs.com user you'll use to publish to npm.
2. If you require any form of clean + build steps to be run prior to publishing, do so via an npm script called `prepare`. The publish script triggers `npm run prepare --if-present` as part of the install and test step. Here's an example snippet from `package.json` (note: it assumes you have `rimraf` installed as a `devDep`):

```
"scripts": {
  ...
  "prepare": "npm run clean && npm run build",
  "clean": "rimraf dist",
  "build": "babel src -o dist",
  ...
},
```

3. Add the following to a `.yml` file in `.github/workflows` in the main branch of the GitHub repository you want to publish to npm:

```yaml
---
name: Publish to npm (if applicable)
on:
  pull_request:
    types: [closed]

jobs:
  publish:
    name: Publish to npm
    runs-on: ubuntu-latest
    if: contains( github.event.pull_request.labels.*.name, '[ Type ] NPM version update' ) && startsWith( github.head_ref, 'release/') && github.event.pull_request.merged == true
    steps:
      - uses: Automattic/vip-actions/npm-publish@trunk
        with:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

4. Go to Actions > npm publish > Run workflow.
5. Enjoy!

# Inspired by

The initial code was inspired by https://help.github.com/actions/language-and-framework-guides/publishing-nodejs-packages
