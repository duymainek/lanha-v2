import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import {
  ShieldCheckIcon,
  HomeIcon,
  WifiIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

const amenities = [
  {
    category: "An ninh",
    icon: ShieldCheckIcon,
    items: [
      "Camera 24/7",
      "Khóa vân tay",
    ]
  },
  {
    category: "Sinh hoạt chung",
    icon: HomeIcon,
    items: [
      "Chỗ để xe",
      "Sân thượng chung"
    ]
  },
  {
    category: "Internet",
    icon: WifiIcon,
    items: [
      "Wifi tốc độ cao 1000Mbps",
      "Hỗ trợ kỹ thuật 24/7",
    ]
  },
  {
    category: "Chi phí",
    icon: CurrencyDollarIcon,
    items: [
      "Điện: 3.8k/kWh",
      "Nước: 80.000đ/người",
    ]
  }
]

export function Amenities() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <section className="py-24 bg-white" id="amenities">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Tiện Ích & Dịch Vụ
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-gray-600"
          >
            Tất cả các tiện ích được bao gồm trong giá thuê căn hộ
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {amenities.map((amenity) => (
            <motion.div key={amenity.category} variants={item}>
              <Card className="p-6 h-full hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                      <amenity.icon className="w-6 h-6 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {amenity.category}
                    </h3>
                  </div>
                  <ul className="space-y-3 text-gray-600 flex-grow">
                    {amenity.items.map((item, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
} 