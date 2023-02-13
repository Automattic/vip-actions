# Auto-merge Dependabot PRs

This action merges dependabot PRs automatically. It's currently hardcoded only for minor and patch versions.

## How to Use

We assume you have already set up dependabot.

Generally, the steps are as follows. Each step has additional details below.

1. [Configure](#how-to-configure-the-repo-to-allow-merging-on-the-default-branch) the repo to allow merging on the default branch.
2. [Enable](#how-to-allow-auto-merge) 'Allow auto merge'.
3. [Add a workflow](#how-to-write-the-workflow) that uses the Dependabot Auto Merge action.
4. [Schedule dependabot](#how-to-write-the-workflow) every Wednesday, preferably at the start of your workday.
5. [Allow](#how-to-allow-dependabot-to-create-security-prs) dependabot to create security PRs.
6. Enjoy the extra hours you freed up thanks to automated merge

### How to configure the repo to allow merging on the default branch?

Here are the steps:

1. Assuming your default branch is `trunk`, go to repo in github > Settings tab > Branch > edit `trunk` > Require status checks to pass before merging. If your default branch is something else, you should use that instead of `trunk`.
2. On the same page, add at least one status check/job under 'Status checks that are required.' - there's a search bar above this message so you can type that text inside that search bar to look for the status check. This should be the test that you want to pass before auto-merge could occur

### How to allow auto merge?

Go to repo in github > Settings tab > Click 'Allow auto-merge'. **NOTE: Make sure that [the previous step](#how-to-configure-the-repo-to-allow-merging-on-the-default-branch) is done properly. If it's not done properly, Dependabot PRs will get auto-merged even if tests hasn't passed! Dangerous!**

### How to write the workflow

To use this action, you can copy-paste the following example into `.github/workflow/dependabot_auto_merge.yaml` into your repository.

You can schedule the time using the `on: schedule: -cron:` field.

```yaml
# <project-root>/.github/workflow/dependabot_auto_merge.yaml

name: Dependabot auto-merge
on:
  workflow_dispatch: # so that you can run it manually
  schedule:
    - cron: '0 0 * * 3' # 00:00 AM UTC on Wednesday
permissions:
  contents: write
  pull-requests: write

jobs:
  dependabot-auto-merge:
    name: Dependabot auto-merge
    runs-on: ubuntu-latest
    steps:
      - name: Run Dependabot Auto Merge action
        uses: Automattic/vip-actions/dependabot-auto-merge@trunk
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### How to allow dependabot to create security PRs.

1. Go to https://github.com/Automattic/<your-repo-name>
2. Assuming you have enough permissions, go to the Settings tab > On the left navbar, Code security and analysis > Dependabot alerts and Dependabot security updates > Enable both.
3. Dependabot will create security update PRs regardless of the dependabot schedule that you've set.

### How do we setup dependabot?

Here's an example `dependabot.yml` that you can use. Place this at `.github/dependabot.yml`.

```yaml
version: 2
updates:
  - package-ecosystem: 'npm' # See documentation for possible values
    directory: '/' # Location of package manifests
    schedule:
      interval: 'daily'
    reviewers:
      - 'Automattic/vip-platform-forno'
    labels:
      - '[Status] Needs Review'
      - 'dependencies'
    # Allow up to 15 open pull requests at the same time
    open-pull-requests-limit: 15
```

### How do we deploy?

Run `npm run build`, commit `dist/main.js` and then create a PR.

### Troubleshooting

#### I'm getting an error "Pull request User is not authorized for this protected branch"

This is because your repository has additional security feature to it. To fix this:

1. Go to Settings > Branches on the left navbar
2. Under Branch protection rules, find your default branch and press Edit. We assume it's `trunk`.
3. Untick `Restrict who can push to matching branches`

We're currently unsure if this is a safe thing to do. However, there's currently no way to put an exception for `dependabot` and `github-actions`
