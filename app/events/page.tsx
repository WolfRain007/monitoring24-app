import { headers } from "next/headers";

async function fetchEvents() {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 5000);

  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";

    const res = await fetch(`${protocol}://${host}/api/events?limit=20`, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error("Failed to load events");
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export default async function EventsPage() {
  try {
    const response = await fetchEvents();
    const events = response.items ?? [];

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">События</h1>

        {events.length === 0 && (
          <p className="text-gray-500">Событий пока нет</p>
        )}

        <div className="space-y-4">
          {events.map((event: any) => (
            <div key={event.id} className="border rounded p-4">
              <h2 className="font-semibold">{event.title}</h2>

              {event.country_code && (
                <p className="text-sm text-gray-500">
                  {event.country_code}
                </p>
              )}

              {event.status && (
                <p className="text-sm text-gray-500 mt-1">
                  Статус: {event.status}
                </p>
              )}

              {event.real_news_count !== undefined && (
                <p className="text-sm text-gray-500 mt-1">
                  Новостей: {event.real_news_count}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  } catch {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">События</h1>

        <div className="border rounded p-4 bg-yellow-50">
          <p className="font-medium">⚠️ Данные временно недоступны</p>
          <p className="text-sm text-gray-600 mt-1">
            Попробуйте обновить страницу через несколько секунд
          </p>
        </div>
      </div>
    );
  }
}
