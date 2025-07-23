"use client";

import { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiHome, FiUser, FiFileText } from "react-icons/fi";
import { MdLogout } from "react-icons/md";
import { MdOutlineRequestQuote } from "react-icons/md";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/auth';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const sidebarClasses = `fixed h-[calc(100vh-64px-48px)] bg-[#3e5172] text-white transition-all duration-300 z-30 ${
    isOpen ? "w-52" : "w-16"
  } flex flex-col`;

  return (
    <aside
      className={sidebarClasses}
      style={{ top: '64px' }} // Matches header height
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav>
          <ul className="space-y-1 px-2">
            
            <SidebarLink 
              href="/main" 
              icon={<FiHome className="h-5 w-5" />} 
              label="Accueil" 
              isOpen={isOpen} 
              isHovered={isHovered}
            />
            
            <SidebarLink 
              href="/main/formulaire" 
              icon={<MdOutlineRequestQuote className="h-5 w-5" />} 
              label="Formulaire" 
              isOpen={isOpen} 
              isHovered={isHovered}
            />

            <SidebarLink 
              href="/main/reports" 
              icon={<FiFileText className="h-5 w-5" />} 
              label="Rapports" 
              isOpen={isOpen} 
              isHovered={isHovered}
            />

            <SidebarLink 
              href="/main/users" 
              icon={<FiUser className="h-5 w-5" />} 
              label="Utilisateurs" 
              isOpen={isOpen} 
              isHovered={isHovered}
            />

            <SidebarLink 
              href="#" 
              onClick={() =>  signOut({
                          redirect: true,
                          redirectTo: "/login",
                        })}
              icon={<MdLogout className="h-5 w-5" />} 
              label="Déconnexion" 
              isOpen={isOpen} 
              isHovered={isHovered}
            />


          </ul>
        </nav>
      </div>

      {/* Toggle Button at bottom */}
      <div className="p-2 border-t border-blue-800">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-white hover:bg-blue-800 rounded p-1 transition flex justify-center"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? (
            <FiChevronLeft className="h-5 w-5" />
          ) : (
            <FiChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  isOpen,
  isHovered,
  onClick
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
  isHovered: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  const showTooltip = !isOpen && isHovered;
  const pathname = usePathname();
  let isActive = false;

  if (href === "/main") {
    isActive = pathname === href; // Exact match for /main
  } else {
    isActive = pathname.startsWith(href) && pathname === href; // Partial match for others, but not exact.
  }

  return (
    <li>
      <Link
        href={href}
        className={`flex items-center space-x-3 rounded-md p-2 transition-colors duration-200 ${
          isOpen ? "justify-start" : "justify-center"
        } ${isActive ? "bg-sky-600" : "hover:bg-blue-800"}`}
        onClick={onClick}
        tabIndex={0}
      >
        <span className="flex-shrink-0">
          {icon}
        </span>
        {(isOpen || showTooltip) && (
          <span className={`text-sm font-medium ${
            isOpen ? "opacity-100" : "absolute left-full ml-2 px-2 py-1 bg-blue-800 rounded-md text-white whitespace-nowrap opacity-0 transition-opacity duration-200"
          } ${showTooltip ? "opacity-100" : ""}`}>
            {label}
          </span>
        )}
      </Link>
    </li>
  );
}