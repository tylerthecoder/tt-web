'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

import NavItem from './navitem';

interface NavItem {
  label: string;
  href: string;
}

interface NavbarClientProps {
  navItems: NavItem[];
}

const NavbarClient = ({ navItems }: NavbarClientProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Check if viewport is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIfMobile();

    // Listen for resize events
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className="flex z-20 bg-gray-950 relative">
        {/* Desktop Navbar */}
        <ul className="hidden md:flex border-b-2 border-black w-full">
          {navItems.map((item) => (
            <NavItem key={item.href} label={item.label} href={item.href} />
          ))}
        </ul>

        {/* Mobile Navbar */}
        <div className="md:hidden flex justify-between items-center w-full px-4 py-3 border-b-2 border-black">
          <Link href="/" className="text-white font-bold text-xl">
            Tyler's Things
          </Link>
          <button
            onClick={toggleMobileMenu}
            className="text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-gray-950 z-10 pt-16 overflow-y-auto md:hidden">
          <div className="flex flex-col p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-white py-4 text-xl border-b border-gray-800 ${
                  pathname === item.href
                    ? 'font-bold text-blue-400 border-l-4 border-red-500 pl-2'
                    : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default NavbarClient;
