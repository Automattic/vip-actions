# Publish prerelease to npm

This action will publish a prerelease version of the package to npm with the specified distribution tag.

## Inputs

* `NPM_TOKEN`: (required) the npm token used to publish the package.
* `GH_TOKEN`: (optional) the GitHub access token to use (default: `${{ github.token }}`).
* `node-version`: (optional) the Node.js version to use for the Action.
* `NPM_TAG`: (optional) NPM [distribution tag](https://docs.npmjs.com/adding-dist-tags-to-packages) (default: `next`).
* `PROVENANCE`: (optional) set to `true` to generate provenance statement for the published package. Requires the `id-token: write` permission.

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

3. Add the following to a `npm-publish-prerelease.yml` file in `.github/workflows` in the main branch of the GitHub repository you want to publish to npm:

```yaml
name: 'Publish prerelease to npm'
on:
  workflow_dispatch:
    inputs:
      npm-tag:
        description: 'Package distribution tag'
        required: true
        default: 'next'
      provenance:
        description: 'Generate package provenance statement'
        required: true
        type: boolean
        default: true
jobs:
  publish:
    name: Publish prerelease to npm
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: Automattic/vip-actions/npm-publish-prerelease@master
        with:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_TAG: ${{ inputs.npm-tag }}
          PROVENANCE: ${{ inputs.provenance }}
```

4. Ensure that tokens can be used to publish the relevant npm package and that the particular token used has permissions to do so.
