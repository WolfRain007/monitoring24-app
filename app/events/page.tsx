async function fetchEvents() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/events`,
    { cache: "no-store" }
  );
