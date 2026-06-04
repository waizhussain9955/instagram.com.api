import Link from "next/link";

export default function Footer() {
  return (
    <footer className="glass-panel mt-auto border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center space-x-2">
              <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
              <span className="text-xl font-bold text-white">InstaSave</span>
            </div>
            <p className="text-sm text-zinc-400">
              The ultimate high-speed Instagram downloader for reels, photos, stories, and profiles. No limits, completely free.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-white">Services</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li>
                    <Link href="/single" className="text-sm text-zinc-400 hover:text-white transition">
                      Single Downloader
                    </Link>
                  </li>
                  <li>
                    <Link href="/story" className="text-sm text-zinc-400 hover:text-white transition">
                      Story Downloader
                    </Link>
                  </li>
                  <li>
                    <Link href="/bulk" className="text-sm text-zinc-400 hover:text-white transition">
                      Bulk Downloader
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-white">Support</h3>
                <ul role="list" className="mt-4 space-y-4">
                  <li>
                    <Link href="/about" className="text-sm text-zinc-400 hover:text-white transition">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm text-zinc-400 hover:text-white transition">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="text-sm text-zinc-400 hover:text-white transition">
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Legal</h3>
              <ul role="list" className="mt-4 space-y-4">
                <li>
                  <Link href="/privacy" className="text-sm text-zinc-400 hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-zinc-400 hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-white/5 pt-8 md:flex md:items-center md:justify-between">
          <p className="text-xs text-zinc-400 md:order-1">
            &copy; {new Date().getFullYear()} InstaSave. All rights reserved. Not affiliated with Instagram or Meta.
          </p>
        </div>
      </div>
    </footer>
  );
}
