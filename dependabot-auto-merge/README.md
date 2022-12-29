# Auto-merge Dependabot PRs

This action merges dependabot PRs automatically. It's currently hardcoded only for minor and patch versions.

## How to Use

To use this action, here's an example workflow:

```yaml

name: Dependabot auto-merge
on: pull_request_target

permissions:
  contents: write
  pull-requests: write

jobs:
  dependabot-auto-merge:
    name: Dependabot auto-merge
    runs-on: ubuntu-latest
    if: ${{ github.event.pull_request.user.login == 'dependabot[bot]' }}
    steps:
      - name: Run Dependabot Auto Merge action
        uses: Automattic/vip-actions/dependabot-auto-merge
```
