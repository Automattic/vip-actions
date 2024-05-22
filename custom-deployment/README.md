# Stale

This action allows you to use the release feature from GitHub to create a new deployable artifact from any GitHub Repo and deploy it to any of your WordPress VIP environments. 
To run this you need to ensure that the `WPVIP_DEPLOY_TOKEN` secret and `ENVIRONMENT_SLUG` variable are set correctly. 
Note: Custom Deployments is currently in close beta and not yet available for the broader audience.  

## Inputs

* `WPVIP_DEPLOY_TOKEN`: (required) The deployment token you can optain on the "repository" page for your applications.
* `ENVIRONMENT_SLUG`: (required) The environment slug used in the CLI to specify which application environment you're referencing to.

## Example

```yaml
name: Deploy action
on:
  workflow_dispatch:
  release:
    types: [published]

jobs:
  deploy-action:
    name: Deploy action
    runs-on: ubuntu-latest
    steps:
      - uses: Automattic/vip-actions/custom-deployment@trunk
```
