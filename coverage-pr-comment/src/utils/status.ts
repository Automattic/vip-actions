const RED_STATUS = '🔴|'
const YELLOW_STATUS = '🟡|'
const GREEN_STATUS = '🟢|'

export function getStatus(statementsCovered: number): string {
  if (statementsCovered < 50) {
    return RED_STATUS
  } else if (statementsCovered > 80) {
    return GREEN_STATUS
  } else {
    return YELLOW_STATUS
  }
}

export const statusHeader = 'St|'
