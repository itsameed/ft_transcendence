/** POST a payment reminder; resolves with a user-facing result message. */
export async function sendReminder(userId: string, fallbackName: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`/api/friends/${userId}/remind`, { method: 'POST' })
    const data = await res.json().catch(() => null)
    if (res.ok) return { ok: true, message: data?.message ?? `Reminder sent to ${fallbackName}` }
    return { ok: false, message: data?.message ?? 'Could not send the reminder.' }
  } catch {
    return { ok: false, message: 'Could not send the reminder — check your connection.' }
  }
}
