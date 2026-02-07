import Link from "next/link";

export default function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        Monitoring24
      </h1>

      <p className="mt-4 text-gray-600">
        Платформа мониторинга новостей и событий.
      </p>

      <div className="mt-6 flex gap-4">
        <Link
          href="/protected"
          className="text-blue-600 underline"
        >
          Перейти в приложение
        </Link>

        <Link
          href="/auth/login"
          className="text-blue-600 underline"
        >
          Войти
        </Link>
      </div>
    </div>
  );
}
