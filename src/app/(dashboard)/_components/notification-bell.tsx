"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/kalkulator2026/api/notifications/unread-count");
        if (res.ok) {
          const json = await res.json();
          setUnreadCount(json.data?.total ?? 0);
        }
      } catch {
        // silent fail — badge shows 0
      }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      className="relative p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
      title="Powiadomienia"
      aria-label={`Powiadomienia (${unreadCount} nieprzeczytanych)`}
    >
      <Bell className="size-5 text-aether-text-secondary" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-aether-rose text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
