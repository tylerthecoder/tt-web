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

    return (
        <Link href={href} className="text-white no-underline">
            <li className={`list-none px-6 py-3 hover:bg-gray-800 ${isActive ? "bg-gray-800 font-bold border-b-4 border-red-500 hover:border-b-4 hover:border-red-500" : "hover:bg-gray-800 hover:border-b-4"}`}>
                {label}
            </li>
        </Link>
    );
}