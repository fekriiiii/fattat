import webpush from 'web-push'

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!
const vapidSubject = process.env.VAPID_SUBJECT!

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth_key: string },
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth_key,
        },
      },
      JSON.stringify(payload),
      { TTL: 3600 }
    )
    return true
  } catch (err) {
    const e = err as { statusCode?: number; message?: string }
    if (e.statusCode === 410) return false
    console.error('Push send error:', e.message)
    return false
  }
}
