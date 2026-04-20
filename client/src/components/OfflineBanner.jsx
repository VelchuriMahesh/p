export default function OfflineBanner() {
  return (
    <div className="sticky top-[73px] z-10 mx-auto max-w-md px-4 pt-3">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-card">
        No connection. You can still browse cached content, but submissions will wait until you reconnect.
      </div>
    </div>
  );
}
