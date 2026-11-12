// Month/day names of formatted dates follow the interface language. Locales are
// loaded on demand so unsupported languages cost nothing; English needs no file.
const loaders = {
  hu: () => import('dayjs/esm/locale/hu.js'),
}

export async function loadDayjsLocale(lang, dayjs) {
  const code = String(lang || 'en').toLowerCase().split(/[-_]/)[0]
  const load = loaders[code]
  if (!load) return false
  try {
    await load()
    dayjs.locale(code)
    // dayjs/hu ships no meridiem, so 'a' would print English am/pm
    if (code === 'hu') {
      dayjs.updateLocale?.('hu', {
        meridiem: (hour, _minute, isLower) =>
          hour < 12 ? (isLower ? 'de' : 'DE') : isLower ? 'du' : 'DU',
      })
    }
    return true
  } catch {
    return false
  }
}
