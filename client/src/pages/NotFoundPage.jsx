import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-card">
        <h1 className="text-3xl font-bold text-navy">Page not found</h1>
        <p className="mt-3 text-sm text-muted">The page you are looking for does not exist or has moved.</p>
        <Link to="/" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white">
          Go home
        </Link>
      </div>
    </main>
  );
}

