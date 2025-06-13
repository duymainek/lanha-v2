import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'

export function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liên Hệ</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <EnvelopeIcon className="w-5 h-5" />
                <a href="mailto:info@lanha.space" className="hover:text-white transition-colors">
                  info@lanha.space
                </a>
              </div>
              <div className="flex items-center gap-2">
                <PhoneIcon className="w-5 h-5" />
                <a href="tel:0777460408" className="hover:text-white transition-colors">
                  0777.460.408
                </a>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Địa Chỉ</h3>
            <div className="space-y-3">
              <p>Lô 90 Khu B2-7, khu đô thị Phú Mỹ An, Ngũ Hành Sơn, Đà Nẵng</p>
              <p>228 Đ. Nguyễn Đình Chiểu, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng</p>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Theo Dõi</h3>
            <div className="space-y-3">
              <a href="https://www.facebook.com/profile.php?id=61561284322137" className="block hover:text-white transition-colors">Facebook</a>
              <a href="https://www.instagram.com/lanha.space/" className="block hover:text-white transition-colors">Instagram</a>
              <a href="https://zalo.me/0777460408" className="block hover:text-white transition-colors">Zalo</a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-700 text-center">
          <p>&copy; {new Date().getFullYear()} Là Nhà Apartment. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
} 