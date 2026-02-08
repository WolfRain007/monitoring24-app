const { data, error } = await supabase
  .from("news_items")
  .insert({
    event_id: null,
    source: "test",
    url: "https://example.com",
    published_at: new Date().toISOString(),
    source_type: "rss",
  });

if (error) {
  console.error("SUPABASE INSERT ERROR:", error);
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
}

return NextResponse.json({ status: "ok" });
