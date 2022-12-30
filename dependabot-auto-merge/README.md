# Auto-merge Dependabot PRs

This action merges dependabot PRs automatically. It's currently hardcoded only for minor and patch versions.

## How to Use

We assume you have already set up dependabot.

Generally, the steps are as follow:

1. Configure the repo to allow merging on the default branch.
2. Enable 'Allow auto merge'.
3. Add a workflow that uses the Dependabot Auto Merge action.
4. Enjoy the extra hours you freed up thanks to automated merge


### How to configure the repo to allow merging on the default branch?

Here are the steps:

1. Assuming your default branch is `trunk`, go to repo in github > Settings tab > Branch > edit `trunk` > Require status checks to pass before merging. If your default branch is something else, you should use that instead of `trunk`.
2. On the same page, add at least one status check/job under 'Status checks that are required.' - there's a search bar above this message so you can type that text inside that search bar to look for the status check. This should be the test that you want to pass before auto-merge could occur

### How to allow auto merge?

Go to repo in github > Settings tab > Click 'Allow auto-merge'. **NOTE: Make sure that [the previous step](#how-to-configure-the-repo-to-allow-merging-on-the-default-branch) is done properly. If it's not done properly, Dependabot PRs will get auto-merged even if tests hasn't passed! Dangerous!**


### How to write the workflow

To use this action, you can copy-paste the following example into `.github/workflow/dependabot_auto_merge.yaml` into your repository.

```yaml
# <project-root>/.github/workflow/dependabot_auto_merge.yaml

name: Dependabot auto-merge
on: pull_request_target # on: pull_request should be fine too I think if you need a stricter permission

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
