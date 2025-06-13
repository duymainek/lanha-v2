import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ContactDialog } from './ContactDialog'

const navigation = [
  { name: 'Căn Hộ', href: '#apartments' },
  { name: 'Tiện Ích', href: '#amenities' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [openContact, setOpenContact] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <motion.header
        className={`fixed top-0 w-full z-50 transition-colors duration-300 ${
          isScrolled ? 'bg-white/80 backdrop-blur-md border-b' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <a href="#" className="text-2xl font-bold">
                Là Nhà
              </a>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {navigation.map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="text-slate-600 hover:text-slate-900 px-3 py-2 text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.name}
                </motion.a>
              ))}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button onClick={() => setOpenContact(true)}>
                  Liên hệ
                </Button>
              </motion.div>
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Bars3Icon className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="mt-6 flow-root">
                    <div className="space-y-4">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className="block px-3 py-2 text-base font-medium text-slate-900"
                        >
                          {item.name}
                        </a>
                      ))}
                      <Button className="w-full" onClick={() => setOpenContact(true)}>
                        Liên hệ
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </motion.header>
      <ContactDialog open={openContact} onOpenChange={setOpenContact} />
    </>
  )
} 