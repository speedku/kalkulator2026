import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-aether-void">
      <div className="glass rounded-2xl p-12 text-center">
        <h1 className="mb-2 text-8xl font-bold text-aether-blue font-display">
          404
        </h1>
        <h2 className="mb-4 text-2xl font-semibold text-aether-text font-display">
          Strona nie istnieje
        </h2>
        <p className="mb-8 text-aether-text-secondary">
          Nie znaleziono strony, której szukasz.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-aether-blue px-6 py-3 text-white font-medium transition-all hover:bg-aether-blue/80 neon-glow"
        >
          Wróć do strony głównej
        </Link>
      </div>
    </div>
  );
}
