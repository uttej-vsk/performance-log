"use client"

import Link from "next/link"
import { MessageSquare, LayoutDashboard, Calendar } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/timeline", label: "Timeline", icon: Calendar },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900/95 p-4 flex flex-col">
      <div className="mb-8">
        <Link href="/dashboard" className="text-2xl font-bold text-white">
          Tracker
        </Link>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white",
              pathname === item.href && "bg-gray-800 text-white"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      {/* User profile section can go here */}
    </aside>
  )
} 