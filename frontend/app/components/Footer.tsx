import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-purple-900 mt-16">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: About */}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-200" />
              <p className="font-semibold text-sm" style={{ color: "#F3F0F8" }}>
                FungiGuard
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-purple-200">
              Klasifikasi jamur berbasis machine learning. Alat bantu edukasi,
              bukan pengganti identifikasi ahli.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <p className="font-semibold text-sm" style={{ color: "#F3F0F8" }}>
              Navigasi
            </p>
            <ul className="mt-2 space-y-1.5">
              {[
                { href: "/", label: "Home" },
                { href: "/history", label: "History" },
                { href: "/guide", label: "Guide" },
                { href: "/about", label: "About" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-purple-200 hover:text-white hover:underline transition-colors duration-150 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Sources */}
          <div>
            <p className="font-semibold text-sm" style={{ color: "#F3F0F8" }}>
              Sumber Data
            </p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a
                  href="https://archive.ics.uci.edu/dataset/73/mushroom"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-200 hover:text-white hover:underline transition-colors duration-150 inline-block"
                >
                  UCI Mushroom Dataset ↗
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Team */}
          <div>
            <p className="font-semibold text-sm" style={{ color: "#F3F0F8" }}>
              Tim
            </p>
            <p className="mt-2 text-xs leading-relaxed text-purple-200">
              Dikembangkan untuk keperluan edukasi.
            </p>
            <p className="mt-1 text-xs text-purple-200">
              Kontak: fungiguard@example.com
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-purple-800">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-purple-200">
            &copy; {currentYear} FungiGuard
          </p>
          <p className="text-xs text-purple-200">
            Hanya untuk tujuan edukasi.
          </p>
        </div>
      </div>
    </footer>
  );
}
