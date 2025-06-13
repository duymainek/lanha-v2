import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPinIcon } from '@heroicons/react/24/outline'

const BUILDINGS = [
  {
    id: 1,
    name: "Là Nhà Apartment - Phú Mỹ An",
    address: "Lô 90 Khu B2-7, khu đô thị Phú Mỹ An, Ngũ Hành Sơn, Đà Nẵng",
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
    <section className="py-24 bg-slate-50" id="contact">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
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
            <Card key={building.id} className="p-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPinIcon className="w-6 h-6 text-slate-600" />
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
                    className="w-full"
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