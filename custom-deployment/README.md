# Custom Deployments. 

This action allows you to use the release feature from GitHub to create a new deployable artifact from any GitHub Repo and deploy it to any of your WordPress VIP environments. 
To run this you need to ensure that the `WPVIP_DEPLOY_TOKEN` secret and `ENVIRONMENT_SLUG` variable are set correctly. 
Note: Custom Deployments is currently in close beta and not yet available for the broader audience.  

## Inputs

* `WPVIP_DEPLOY_TOKEN`: (required) The deployment token you can optain on the "repository" page for your applications.
* `ENVIRONMENT_SLUG`: (required) The environment slug used in the CLI to specify which application environment you're referencing.
* `RELEASE_NAME`: (required) The name of the release, typically sourced from the GitHub event data.

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
        with:
          WPVIP_DEPLOY_TOKEN: ${{ secrets.WPVIP_DEPLOY_TOKEN }}
          ENVIRONMENT_SLUG: ${{ vars.ENVIRONMENT_SLUG }}
          RELEASE_NAME: ${{ github.event.release.name }}
          PHP_VERSION: '8.2'

```
