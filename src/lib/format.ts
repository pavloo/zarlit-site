/** Ukrainian file size, e.g. "4,5 МБ". Sizes are shown before any download. */
export function formatFileSize(bytes: number): string {
  const units = ['Б', 'КБ', 'МБ', 'ГБ']
  let value = bytes
  let unit = 0

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }

  const rounded = value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)
  return `${String(rounded).replace('.', ',')} ${units[unit]}`
}

const dateFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00`))
}

/** "12 уроків" — Ukrainian has three plural forms, so pick by the rules. */
export function pluralizeLessons(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return `${count} урок`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} уроки`
  }
  return `${count} уроків`
}
