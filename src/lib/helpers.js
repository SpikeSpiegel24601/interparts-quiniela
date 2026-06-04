export const PRIZES = [
  { min: 45, max: 999, label: 'Montacargas de Juguete', emoji: '🏆', color: '#FFD700' },
  { min: 40, max: 44,  label: 'Chaleco LED',            emoji: '🦺', color: '#FF6B35' },
  { min: 35, max: 39,  label: 'Parasol',                emoji: '☂️',  color: '#4CAF50' },
  { min: 30, max: 34,  label: 'Camisa Interparts',      emoji: '👕', color: '#2196F3' },
  { min: 25, max: 29,  label: 'Gorra Interparts',       emoji: '🧢', color: '#9C27B0' },
]

export function getPrize(points) {
  return PRIZES.find(p => points >= p.min && points <= p.max) || null
}

export function getNextPrize(points) {
  for (let i = PRIZES.length - 1; i >= 0; i--) {
    if (points < PRIZES[i].min) {
      return { prize: PRIZES[i], needed: PRIZES[i].min - points }
    }
  }
  return null
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  // Forzar hora de Monterrey (UTC-6, sin horario de verano en junio = CDT = UTC-5)
  const date = new Date(dateStr)
  return date.toLocaleString('es-MX', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Monterrey'
  })
}

export function getResult(homeScore, awayScore) {
  if (homeScore === null || awayScore === null) return null
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return 'draw'
}
