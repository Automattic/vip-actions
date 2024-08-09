export function getReportParts(rawCoverage: string): {
  coverageInfoHeader: string[]
  coverageInfoRows: string[]
} {
  const trimmedRawCoverage = rawCoverage.trim()
  const rawCoverageRows = trimmedRawCoverage.split('\n')
  const coverageRows = rawCoverageRows.slice(1, rawCoverageRows.length - 1)
  const coverageInfoHeader = coverageRows.slice(0, 3)
  const coverageInfoRows = coverageRows.slice(3)
  return { coverageInfoHeader, coverageInfoRows }
}
