# Publish to npm

This action makes it easy to publish to npm using GitHub Actions after running some light validation (e.g. `npm test`).

The initial code was inspired by https://help.github.com/actions/language-and-framework-guides/publishing-nodejs-packages

## Usage Notes

- If you require any form of clean + build to be run prior to publishing, do so via an npm script called `prepare`. The action triggers `npm run prepare --if-present` as part of the install and test step.

## Inputs

* `NPM_TOKEN`: (required) the npm token used to publish the package.
* `npm-version-type`: (optional) the [npm version type (major|minor|patch)](https://docs.npmjs.com/cli/v8/commands/npm-version) we're publishing.
* `node-version`: (options) the Node.js version to use for the Action

## Example

The following sets up the publishing flow to be manually triggered from the Actions section:

```yaml
name: npm publish
on:
  workflow_dispatch:
    inputs:
      # This is copied from npm-publish/action.yml
      npm-version-type:
        description: 'The npm version type we are publishing.'
        required: true
        type: choice
        default: 'patch'
        options:
          - patch
          - minor
          - major

jobs:
  publish:
    name: Publish to npm
    runs-on: ubuntu-latest
    steps:
      - uses: Automattic/vip-actions/npm-publish
        with:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          npm-version-type: ${{ inputs.npm-version-type }}
```

The following triggers a publish on every push to `trunk` (note: every release will be a patch update since `npm-version-type` is not specified):

```yaml
name: npm publish
on:
  push:
    branches:
      - 'trunk'

jobs:
  publish:
    name: Publish to npm
    runs-on: ubuntu-latest
    steps:
      - uses: Automattic/vip-actions/npm-publish
        with:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```
