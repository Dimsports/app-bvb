"use client";

import { useEffect, useState } from "react";
import { subscribeToPush, unsubscribeFromPush } from "@/app/push/actions";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray.buffer as ArrayBuffer;
}

type Status = "unsupported" | "loading" | "subscribed" | "unsubscribed" | "denied";

export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setStatus(sub ? "subscribed" : "unsubscribed"))
        .catch(() => setStatus("unsubscribed"));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function handleSubscribe() {
    setError(null);
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setError("Notifications non configurées pour l'instant.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON();
      const result = await subscribeToPush({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });
      setStatus(result.ok ? "subscribed" : "unsubscribed");
      if (!result.ok) setError("Erreur lors de l'activation.");
    } catch {
      setError("Erreur lors de l'activation.");
    }
  }

  async function handleUnsubscribe() {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch {
      setError("Erreur lors de la désactivation.");
    }
  }

  if (status === "loading" || status === "unsupported") return null;

  return (
    <section className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-medium text-anthracite">Notifications</h2>
          <p className="mt-1 text-sm text-anthracite/60">
            {status === "subscribed" && "Tu reçois une notification pour chaque nouvelle annonce."}
            {status === "unsubscribed" && "Active les notifications pour ne rien manquer."}
            {status === "denied" && "Notifications bloquées dans les réglages de ton navigateur."}
          </p>
        </div>
        {status !== "denied" && (
          <button
            type="button"
            onClick={status === "subscribed" ? handleUnsubscribe : handleSubscribe}
            className="h-10 shrink-0 rounded-lg border border-anthracite/20 px-4 text-sm font-medium text-anthracite"
          >
            {status === "subscribed" ? "Désactiver" : "Activer"}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
