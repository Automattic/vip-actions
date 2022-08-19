# Publish to npm

This action makes it easy to publish to npm using GitHub Actions after running some light validation (e.g. `npm test`).

The initial code was inspired by https://help.github.com/actions/language-and-framework-guides/publishing-nodejs-packages

## Inputs

* `release_type`: the [npm version type (major|minor|patch)](https://docs.npmjs.com/cli/v8/commands/npm-version) we're releasing.
* `NPM_TOKEN`: the npm token used to publish the package.

## Example

The following set up the release flow to be manually triggered from the Actions section.

```yaml
name: npm publish
on:
  workflow_dispatch:
    inputs:
      # This is copied from npm-publish/action.yml
      release_type:
        description: 'The npm version type we are releasing.'
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
    steps:
      - uses: Automattic/vip-actions/npm-publish@v1
        with:
          release_type: ${{ inputs.release_type }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

The following triggers a release on every push to `trunk` (note: every release will be a patch update):

```yaml
name: npm publish
on:
  push:
    branches:
      - 'trunk'

jobs:
  publish:
    name: Publish to npm
    steps:
      - uses: Automattic/vip-actions/npm-publish@v1
        with:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```
