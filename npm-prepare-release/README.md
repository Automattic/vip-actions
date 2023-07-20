# Prepare publishing to npm

This workflow prepares a repository for publishing to npm and is designed to work in tandem with the [npm-publish](../npm-publish/README.md) workflow.

The `npm-prepare-release` workflow should be called first using manual dispatch. Once added to a repository and run, it will increase the npm package's version number in accordance with input from the caller (requested when dispatched). It will then commit this change to the GitHub repository, and create a new pull request that is assigned to the caller of the workflow. The caller should review and merge the pull request once they feel their changes are ready.

Usage of the two workflows is compatible with [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) and requires only the standard GitHub Actions access token provided (with read-write permission). No GitHub bot account is needed.

## Inputs

* `npm-version-type`: (optional) the npm version type (`major`|`minor`|`patch`) being published.

## Using the workflow

Add the following to a `.yml` file in `.github/workflows` in the main branch of the GitHub repository you want to publish to npm:

```
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
        uses: Automattic/vip-actions/npm-prepare-release@latest
        with:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          npm-version-type: ${{ inputs.npm-version-type }}
```

You can then browse to `Actions` in the repository and start the workflow. A pull request should appear after a few seconds.

