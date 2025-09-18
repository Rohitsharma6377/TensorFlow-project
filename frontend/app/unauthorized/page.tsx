export default function UnauthorizedPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to access this page.</p>
        <a href="/" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-white hover:opacity-90">
          Go to Home
        </a>
      </div>
    </div>
  );
}
