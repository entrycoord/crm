// Display only: formatDuration remains the canonical, parseable edit format.
export function formatDurationDisplay(totalSeconds, longForm = false) {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds === '') return ''
  const s = parseInt(totalSeconds, 10)
  if (isNaN(s)) return ''

  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const parts = []

  if (longForm) {
    if (h) parts.push(h === 1 ? __('{0} hour', [h]) : __('{0} hours', [h]))
    if (m) parts.push(m === 1 ? __('{0} minute', [m]) : __('{0} minutes', [m]))
    if (sec || s === 0) parts.push(sec === 1 ? __('{0} second', [sec]) : __('{0} seconds', [sec]))
  } else {
    if (h) parts.push(__('{0}h', [h]))
    if (m) parts.push(__('{0}m', [m]))
    if (sec || s === 0) parts.push(__('{0}s', [sec]))
  }
  return parts.join(' ')
}
