"use client";

import Image from "next/image";
import { lusitana } from "./fonts";

export default function Navbar() {

  return (
    <nav className="bg-white border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Logo and menu button */}
          <div className="flex items-center">


            <div className="flex-shrink-0 flex items-center ml-1">
              <Image 
                src="/app_logo.png" 
                alt="Remote work form" 
                width={60} 
                height={60} 
                className="rounded-md"
              />
              <span className={`${lusitana.className} text-xl text-gray-800 md:text-3xl md:leading-normal`}>
                Remote work form
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}