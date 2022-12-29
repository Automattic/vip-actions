# Auto-merge Dependabot PRs

This action merges dependabot PRs automatically. It's currently hardcoded only for minor and patch versions.

## How to Use

We assume you have already set up dependabot.

To use this action, here's an example workflow:

```yaml
# <project-root>/.github/workflow/dependabot_auto_merge.yaml

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
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Once you've created the workflow, you'll need to do the following to that particular github project:

1. Go to repo in github > Settings tab > Click 'Allow auto-merge'
2. Assuming your default branch is `trunk`, go to repo in github > Settings tab > Branch > edit `trunk` > Require status checks to pass before merging
3. On the same page, add at least one status check/job under 'Status checks that are required.' - there's a search bar above this message so you can type that text inside that search bar to look for the status check. Usually you put your CI workflow here.
