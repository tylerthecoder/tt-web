"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemProps {
    label: string;
    href: string;
}

export default function NavItem({ label, href }: NavItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href;

    const baseClasses = "list-none px-6 py-3 transition-colors duration-150 ease-in-out border-b-4";
    const activeClasses = "bg-gray-800 font-bold border-red-500";
    const inactiveClasses = "border-transparent hover:bg-gray-800 hover:border-red-500";

    return (
        <Link href={href} className="text-white no-underline block">
            <li className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
                {label}
            </li>
        </Link>
    );
}