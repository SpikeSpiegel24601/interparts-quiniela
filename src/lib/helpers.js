export const PRIZES = [
  { min: 450, max: 999, label: 'Montacargas de Juguete', emoji: '🏆', color: '#FFD700' },
  { min: 400, max: 440,  label: 'Chaleco LED',            emoji: '🦺', color: '#FF6B35' },
  { min: 350, max: 390,  label: 'Parasol',                emoji: '☂️',  color: '#4CAF50' },
  { min: 300, max: 340,  label: 'Camisa Interparts',      emoji: '👕', color: '#2196F3' },
  { min: 250, max: 290,  label: 'Gorra Interparts',       emoji: '🧢', color: '#9C27B0' },
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
  return new Date(dateStr).toLocaleString('es-MX', {
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
