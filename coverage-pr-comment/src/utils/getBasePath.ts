import path from 'path'

interface GetBasePathParams {
  coverageBasePath: string
  parsedBasePath: string
}

export function getBasePath({
  coverageBasePath,
  parsedBasePath
}: GetBasePathParams): string {
  if (parsedBasePath.startsWith(coverageBasePath)) {
    return parsedBasePath
  }

  return path.relative('', `${coverageBasePath}/${parsedBasePath}`)
}
