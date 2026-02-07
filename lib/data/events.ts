import { createClient } from "@/lib/supabase/server";

export async function getEvents() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(`
      id,
      title,
      description,
      started_at,
      cities (
        name,
        country
      )
    `)
    .order("started_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
