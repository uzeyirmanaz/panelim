// Socket bildirim servisine olay gönderir (sunucu içi, 127.0.0.1:3004)
const NOTIFY_URL = 'http://127.0.0.1:3004/notify'
const NOTIFY_TOKEN = process.env.NOTIFY_TOKEN || 'adisyon-local-token-2024'

export async function notify(event: string, data?: unknown): Promise<void> {
  try {
    await fetch(NOTIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-notify-token': NOTIFY_TOKEN },
      body: JSON.stringify({ event, data }),
      signal: AbortSignal.timeout(1500),
    })
  } catch {
    // Bildirim başarısız olsa da ana akış bozulmasın
  }
}
