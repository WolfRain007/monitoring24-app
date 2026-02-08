import { headers } from "next/headers";

async function fetchEvents() {
  const headersList = await headers();
  const host = headersList.get("host");

  const protocol =
    host?.includes("localhost") ? "http" : "https";

  const res = await fetch(
    `${protocol}://${host}/api/events`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to load events");
  }

  return res.json();
}

export default async function EventsPage() {
  const events = await fetchEvents();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        События
      </h1>

      {events.length === 0 && (
        <p className="text-gray-500">
          Событий пока нет
        </p>
      )}

      <div className="space-y-4">
        {events.map((event: any) => (
          <div
            key={event.id}
            className="border rounded p-4"
          >
            <h2 className="font-semibold">
              {event.title}
            </h2>

            {event.cities && (
              <p className="text-sm text-gray-500">
                {event.cities.name}, {event.cities.country}
              </p>
            )}

            {event.description && (
              <p className="mt-2">
                {event.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
