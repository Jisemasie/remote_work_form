'use client';

import { useState } from "react";
import { roleMenus } from "@/app/lib/menu_config";
import Link from "next/link";

type SidebarProps = {
  role: string; // e.g., 'admin'
  orgSlug: string; // e.g., 'school-x'
};

export default function Sidebar({ role, orgSlug }: SidebarProps) {
  const menu = roleMenus[role] || [];
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (label: string) => {
    setExpanded(expanded === label ? null : label);
  };

  return (
    <aside className="w-64 bg-white shadow-lg h-screen p-4 space-y-2 overflow-auto">
      {menu.map((item) => (
        <div key={item.label}>
          <button
            onClick={() => toggle(item.label)}
            className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-100 rounded-md"
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
          {expanded === item.label && item.children && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child}
                  href={`/${orgSlug}/main/${child.toLowerCase().replace(/ /g, "-")}`}
                  className="block text-sm text-gray-600 hover:text-black hover:underline"
                >
                  {child}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}
