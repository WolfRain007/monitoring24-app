import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg">
        Monitoring24
      </Link>

      <nav className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-600">
              {user.email}
            </span>

            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="text-sm text-red-600 hover:underline"
              >
                Выйти
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/auth/login"
            className="text-sm text-blue-600 hover:underline"
          >
            Войти
          </Link>
        )}
      </nav>
    </header>
  );
}
