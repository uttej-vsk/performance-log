"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, Calendar, Settings, LogOut, User } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

const mainNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/timeline", label: "Timeline", icon: Calendar },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 text-gray-200 flex flex-col p-4">
      <div className="text-2xl font-bold mb-8">Tracker</div>
      <nav className="flex-1 space-y-2">
        {mainNavLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <div className="p-3 rounded-md hover:bg-gray-800 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {session?.user?.email || "No email"}
              </p>
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 mt-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname === "/dashboard/settings"
              ? "bg-gray-700 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          )}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 mt-2 px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
} 