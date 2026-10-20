"use client";

/**
 * Navigasi utama RPLBox (dipakai di semua halaman).
 * Menyorot tautan yang sedang aktif lewat usePathname.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/studio", label: "Studio", icon: "photo_camera" },
  { href: "/gallery", label: "Galeri", icon: "photo_library" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-on-surface bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-on-surface bg-primary text-white hard-shadow-sm">
            <span className="material-symbols-outlined is-filled" aria-hidden>
              photo_camera
            </span>
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            RPLBox
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.label}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full border-2 px-3 text-sm font-bold transition-colors sm:px-4 ${
                  active
                    ? "border-on-surface bg-on-surface text-white"
                    : "border-transparent text-on-surface hover:border-on-surface hover:bg-surface-low"
                }`}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  {link.icon}
                </span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default AppNav;
