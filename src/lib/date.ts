import { format, isWithinInterval, parseISO } from 'date-fns'

export const isoToday = () => format(new Date(), 'yyyy-MM-dd')
export const parseLocalDate = (value: string) => parseISO(`${value}T00:00:00`)
export const defaultSelectedDate = (startDate: string, endDate: string) => {
  const today = isoToday()
  return isWithinInterval(parseLocalDate(today), { start: parseLocalDate(startDate), end: parseLocalDate(endDate) }) ? today : startDate
}
