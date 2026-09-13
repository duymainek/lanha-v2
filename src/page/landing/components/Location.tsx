import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { LowPolyTree } from './decor/LowPolyTree'

const BUILDINGS = [
  {
    id: 1,
    name: "Là Nhà Apartment - Nguyễn Quý Anh",
    address: "Đường Nguyễn Quý Anh, Khu đô thị FPT, Ngũ Hành Sơn, Đà Nẵng",
    googleMapsUrl: "https://www.google.com/maps/place/Là+Nhà+Apartment/@15.9849651,108.2599165,17z"
  },
  {
    id: 2,
    name: "Là Nhà Apartment - Nguyễn Đình Chiểu",
    address: "228 Đ. Nguyễn Đình Chiểu, Khuê Mỹ, Ngũ Hành Sơn, Đà Nẵng",
    googleMapsUrl: "https://www.google.com/maps/place/Là+Nhà+Apartment/@16.0204442,108.2454339,17z"
  }
]

export function Location() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand/[0.06] to-transparent py-24" id="contact">
      <LowPolyTree className="pointer-events-none absolute -left-6 top-8 h-28 w-28 opacity-20 sm:h-36 sm:w-36" />
      <LowPolyTree className="pointer-events-none absolute -right-8 bottom-4 h-32 w-32 opacity-15 sm:h-44 sm:w-44" />
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Vị Trí
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-gray-600"
          >
            Các chi nhánh Là Nhà Apartment tại Đà Nẵng
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {BUILDINGS.map((building) => (
            <Card
              key={building.id}
              className="rounded-2xl border-black/5 p-6 shadow-[0_24px_60px_rgba(15,25,45,0.10)] transition-shadow hover:shadow-[0_28px_70px_rgba(15,25,45,0.16)]"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPinIcon className="w-6 h-6 text-brand" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {building.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {building.address}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-brand/30 text-brand hover:bg-brand hover:text-white"
                    onClick={() => window.open(building.googleMapsUrl, '_blank')}
                  >
                    Chỉ Đường
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
} 