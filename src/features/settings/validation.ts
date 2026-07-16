import { differenceInCalendarDays, parseISO } from 'date-fns'
export function validateGoalRange(startDate:string,endDate:string,goalDays:number){const days=differenceInCalendarDays(parseISO(endDate),parseISO(startDate))+1;if(days<1)return '开始日期不能晚于结束日期';if(goalDays>days)return `目标打卡天数不能超过日期区间的 ${days} 天`;return ''}
