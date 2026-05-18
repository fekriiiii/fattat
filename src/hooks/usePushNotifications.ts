'use client'

import { useEffect, useState } from 'react'

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setLoading(false)
      return
    }
    setPermission(Notification.permission)
    if (Notification.permission === 'granted') {
      checkSubscription().then((s) => {
        setSubscribed(s)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  async function checkSubscription(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return sub !== null
  }

  async function subscribe(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm !== 'granted') return false

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return false

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      })

      const key = sub.getKey('p256dh')
      const auth = sub.getKey('auth')
      if (!key || !auth) return false

      const toBase64 = (buf: ArrayBuffer) =>
        btoa(String.fromCharCode(...Array.from(new Uint8Array(buf))))

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: toBase64(key),
          auth: toBase64(auth),
          userAgent: navigator.userAgent,
        }),
      })

      setSubscribed(true)
      return true
    } catch {
      return false
    }
  }

  return { permission, subscribed, subscribe, loading }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}
