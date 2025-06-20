import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth-utils";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-foreground">
                Performance Tracker
              </h1>
            </div>
            <nav className="flex space-x-8">
              <a
                href="/dashboard"
                className="hover:text-muted-foreground px-3 py-2 rounded-md text-sm font-medium text-foreground"
              >
                Dashboard
              </a>
              <a
                href="/chat"
                className="hover:text-muted-foreground px-3 py-2 rounded-md text-sm font-medium text-foreground"
              >
                Chat
              </a>
              <a
                href="/dashboard/timeline"
                className="hover:text-muted-foreground px-3 py-2 rounded-md text-sm font-medium text-foreground"
              >
                Timeline
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
