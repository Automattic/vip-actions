# Stale

This action automatically closes stale issues and pull requests after a defined period of inactivity. It is based on GitHub’s official [`stale` action](https://github.com/actions/stale). It provides sensible defaults and limited configurability. If you need more flexibility, you may wish to use the official action directly.

## Inputs

- `days-before-stale`: The number of days old an issue or a pull request can be before it is marked stale. Set to `"-1"` to never mark issues or pull requests as stale automatically. Default: `"60"`.
- `days-before-close`: The number of days to wait to close an issue or a pull request after it is marked stale. Set to `"-1"` to never close stale issues or pull requests. Default: `"7"`.

## Example

```yaml
name: Stale monitor

on:
  schedule:
    - cron: '0 0 * * *'

jobs:
  stale:
    name: Stale
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: Automattic/vip-actions/stale@trunk
        with:
          days-before-stale: "30"
```
