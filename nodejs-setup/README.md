# Node.js setup

This action (composite workflow) reduces boilerplate in your action by performing Node.js setup and installing dependencies—with a solid approach to caching that speeds up your workflows.

## Inputs

One of `node-version` or `node-version-file` is required. Do not provide both.

- `fetch-depth`: Depth for fetching commits (optional).
- `node-version-file`: Set to the file containing your preferred Node.js version (e.g., `.nvmrc` or `.node-version`).
- `node-version`: Set to a valid semver referencing your preferred Node.js version (e.g., `18.13`).
- `ref`: The branch, tag, or SHA to checkout (optional, defaults to commit that triggered the workflow).
- `working-directory`: Effectively focuses checkout to this directory and uses as a working directory when running NPM install. Useful if you have a Node application inside a subdirectory and you only want that checked out and dependencies for it installed.  Do not prepend directory value with `./`. Optional parameter.

## Example

```yaml
name: My Workflow
on:
  pull_request:
  push:
    branches:
      - trunk
  workflow_dispatch:

jobs:
  format:
    name: Check formatting
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Setup and install
        uses: Automattic/vip-actions/nodejs-setup@trunk
        with:
          node-version-file: .nvmrc

      - name: Run Prettier
        run: npm run format

  lint:
    name: Lint
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Setup and install
        uses: Automattic/vip-actions/nodejs-setup@trunk
        with:
          node-version-file: .nvmrc

      - name: Run linter
        run: npm run lint

  lint-other-app:
    name: Other App: Lint
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Setup and install
        uses: Automattic/vip-actions/nodejs-setup@trunk
        with:
          node-version-file: other-app/.nvmrc
          working-directory: other-app

      - name: Run linter 
        working-directory: ./other-app
        run: npm run lint

```
