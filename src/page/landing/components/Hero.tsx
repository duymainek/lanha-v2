import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ContactDialog } from './ContactDialog'

export function Hero() {
  const [openContact, setOpenContact] = useState(false)
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1522708323590-d24dbb6b0267)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 max-w-4xl mx-auto leading-tight">
            Tìm kiếm không gian sống lý tưởng tại Là Nhà Apartment
          </h1>
          <p className="text-lg sm:text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
            Căn hộ dịch vụ hiện đại, đầy đủ tiện nghi tại trung tâm thành phố. An toàn, tiện lợi và cộng đồng văn minh.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => setOpenContact(true)}>
              Liên hệ ngay
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2" />
        </div>
      </motion.div>
      <ContactDialog open={openContact} onOpenChange={setOpenContact} />
    </section>
  )
} 