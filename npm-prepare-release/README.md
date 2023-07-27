# Prepare publishing to npm

This action prepares a repository for publishing to npm and is designed to work in tandem with the [npm-publish](../npm-publish/README.md) action.

The `npm-prepare-release` action should be called first using manual dispatch. Once added to a repository and run, it will increase the npm package's version number in accordance with input from the caller (requested when dispatched). This is normally expected to be done from the main branch of the repository. It will then commit this change to the GitHub repository, and create a new pull request that is assigned to the caller of the action. The caller should review and merge the pull request once they feel their changes are ready.

Note that a custom release branch can be used instead of the main branch. This will have to be configured using a custom input value (see below). 

Usage of the two actions is compatible with [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) and requires only the standard GitHub Actions access token provided (with read-write permission). No GitHub bot account is needed.

## Inputs

* `GH_TOKEN`: (required) the GitHub access token to use. It is recommended to use the standard GitHub Actions access token (used in example).
* `npm-version-type`: (required) the npm version type (`major`|`minor`|`patch`) being published.
* `node-version`: (optional) the Node.js version to use for the action.
* `release-branch`: (optional) custom branch to use for releasing the package instead of the main branch. 

## Using the action

Add the following to a `npm-prepare-release.yml` file in `.github/workflows` in the main branch of the GitHub repository you want to publish to npm:

```yaml
---
name: Prepare new npm release

on:
  workflow_dispatch:
    inputs:
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
  prepare:
    name: Prepare a new npm release
    runs-on: ubuntu-latest
    steps:    
      - name: Check out the source code
        uses: actions/checkout@v3

      - name: Run npm-prepare-release
        uses: Automattic/vip-actions/npm-prepare-release@vX.Y.Z
        with:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          npm-version-type: ${{ inputs.npm-version-type }}
```

Add any custom input values and set the version to the latest published one.

You can then browse to `Actions` in the repository and start the action. A pull request should appear after a few seconds.

