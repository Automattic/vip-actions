# Auto-merge Dependabot PRs

This action merges dependabot PRs automatically. It's currently hardcoded only for minor and patch versions.

## How to Use

We assume you have already set up dependabot.

Generally, the steps are as follow:

1. Configure the repo to allow merging on the default branch.
2. Enable 'Allow auto merge'.
3. Add a workflow that uses the Dependabot Auto Merge action.
4. Schedule dependabot every Wednesday, preferably at the start of your workday.
5. Allow dependabot to create security PRs.
6. Enjoy the extra hours you freed up thanks to automated merge

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
        uses: Automattic/vip-actions/dependabot-auto-merge@trunk
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### How to allow dependabot to create security PRs.

1. Go to https://github.com/Automattic/<your-repo-name>
2. Assuming you have enough permissions, go to the Settings tab > On the left navbar, Code security and analysis > Dependabot alerts and Dependabot security updates > Enable both.
3. Dependabot will create security update PRs regardless of the dependabot schedule that you've set.

### How to schedule dependabot every Wednesday.

Here's an example `dependabot.yml` that you can use. Place this at `.github/dependabot.yml`.

```yaml
version: 2
updates:
  - package-ecosystem: "npm" # See documentation for possible values
    directory: "/" # Location of package manifests
    schedule:
      interval: "weekly"
      day: "wednesday"
      time: "01:00" # UTC
    reviewers:
      - "Automattic/vip-platform-forno"
    labels:
      - "[Status] Needs Review"
      - "dependencies"
    # Allow up to 15 open pull requests at the same time
    open-pull-requests-limit: 15
```

### Troubleshooting

#### I'm getting an error "Pull request User is not authorized for this protected branch"

This is because your repository has additional security feature to it. To fix this:

1. Go to Settings > Branches on the left navbar
2. Under Branch protection rules, find your default branch and press Edit. We assume it's `trunk`.
3. Untick `Restrict who can push to matching branches`

We're currently unsure if this is a safe thing to do. However, there's currentlyno way to put an exception for `dependabot` and `github-actions`
