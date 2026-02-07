import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Добро пожаловать 👋
      </h1>

    <p className="mt-4 text-gray-600">
  Вы вошли как: <b>{user.email}</b>
</p>
