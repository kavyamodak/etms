const tripDatePattern =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d{1,3})?)?/;

function parseTripDateTime(value?: string | Date | null) {
  if (!value) return null;

  if (value instanceof Date) {
    return new Date(Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
      value.getUTCHours(),
      value.getUTCMinutes(),
      value.getUTCSeconds()
    ));
  }

  const text = String(value).trim();
  if (!text) return null;

  const match = text.match(tripDatePattern);
  if (!match) return null;

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
  return new Date(Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  ));
}

export function formatTripDateTime(
  value?: string | Date | null,
  locale = 'en-IN',
  options?: Intl.DateTimeFormatOptions
) {
  const parsed = parseTripDateTime(value);
  if (!parsed) return '';

  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(parsed);
}

export function formatTripDate(
  value?: string | Date | null,
  locale = 'en-IN',
  options?: Intl.DateTimeFormatOptions
) {
  const parsed = parseTripDateTime(value);
  if (!parsed) return '';

  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...options,
  }).format(parsed);
}

export function formatTripTime(
  value?: string | Date | null,
  locale = 'en-IN',
  options?: Intl.DateTimeFormatOptions
) {
  const parsed = parseTripDateTime(value);
  if (!parsed) return '';

  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(parsed);
}

export function getTripTimestamp(value?: string | Date | null) {
  const parsed = parseTripDateTime(value);
  return parsed ? parsed.getTime() : NaN;
}
