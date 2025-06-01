import { fromZonedTime } from 'date-fns-tz';

export function getStartEndOfDayInColombia(date: Date) {
  const timeZone = 'America/Bogota';
  const yyyyMMdd = date.toISOString().slice(0, 10); // formato 'yyyy-MM-dd'

  const start = fromZonedTime(new Date(`${yyyyMMdd}T00:00:00`), timeZone);
  const end = fromZonedTime(new Date(`${yyyyMMdd}T23:59:59.999`), timeZone);

  return { start, end };
}