export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Origo
          </h1>
          <p className="text-text-muted text-sm">Campus-first social · Verified identity · Real connections</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl shadow-primary/5">
          {children}
        </div>
      </div>
    </div>
  );
}
