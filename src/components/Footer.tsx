import { Github, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="glass-card mt-8">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold title-gradient mb-3">
              Torrent Network
            </h3>
            <p className="text-gray-400 mb-3">
              Join our thriving Minecraft community and embark on epic
              adventures.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Youtube className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Github className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-gray-200 font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  Rules
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  Store
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  Vote
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  Map
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-gray-200 font-semibold mb-3">Legal</h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  Rules
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-center text-gray-400">
            © {currentYear} TorrentSMP. All rights reserved.
            <br />
            <span className="text-sm">
              With Love
              <a
                href="https://github.com/JT"
                className="text-red-400 hover:text-red-300"
              ></a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
