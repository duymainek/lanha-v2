import { useState } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'

const MOCK_APARTMENTS = [
  {
    id: 1,
    type: "Studio",
    images: [
      "https://scontent.fdad3-1.fna.fbcdn.net/v/t39.30808-6/480682731_122148343358376144_571203137591992955_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_ohc=_DNH-oseAWUQ7kNvwFbp2XD&_nc_oc=AdnjM9xtzKhah7iZADzPjf08xMDvnTzQ367ArWIDoO7pY1coerzip6D0JXb3Qg6EXn2jt4C7V8353B0fBd275FvZ&_nc_zt=23&_nc_ht=scontent.fdad3-1.fna&_nc_gid=InIehRRNOodU8-KEhFsk1Q&oh=00_AfP5fnQb0K3vIxpLmYOBPOGcM46B3NEp1DPwrLvVrUWxJA&oe=6852B9EE",
      "https://scontent.fdad3-1.fna.fbcdn.net/v/t39.30808-6/480286229_122148234968376144_4021510128780571651_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=rl2k9g-RIYoQ7kNvwFJxVhE&_nc_oc=Adl0iuJeVJ7DAXmoihlXHG80hg3bSvDq_SmTDZFnI7qOe1sedMDZgXlUs9YzK4EeCvRQ0bYZpkmr_E_2W3uR4aWG&_nc_zt=23&_nc_ht=scontent.fdad3-1.fna&_nc_gid=vDXlyEjlcIjTznSeW4TQRg&oh=00_AfO4y7QwxQVsVrSwZuAk91ofyHIL95B2YIrn1GgLnmGIQg&oe=68528D08",
      "https://scontent.fdad3-1.fna.fbcdn.net/v/t39.30808-6/480298773_122148234794376144_2028996750840609235_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_ohc=p9niokdr6SAQ7kNvwH9JcBX&_nc_oc=AdmWiCZaYyZA9017J658aud_9XqI2U3yXIliiSY9wg6HgOdZHovoyUcEk2g2wl47M1D4ajtId4hXnByHQOh6Etwe&_nc_zt=23&_nc_ht=scontent.fdad3-1.fna&_nc_gid=5Wd3WFdH-EAbxpBq8Gqp8g&oh=00_AfPiOZ5jA37y7kKbrl7u7iFNFkbfJq6f4niktr21KE210A&oe=68529855",
    ]
  },
  {
    id: 2,
    type: "One-Bedroom",
    images: [
      "https://scontent.fdad3-4.fna.fbcdn.net/v/t39.30808-6/475339366_122145653168376144_5982781744865490335_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=127cfc&_nc_ohc=VnIYNoxNxAIQ7kNvwHNChdF&_nc_oc=AdmOhbZ_5Bgar5ouhi1RI8SIspN9OLw9SGG3flt2MiED6uPFK-4sIvus3FYz5AHeLZ5Qu9Znd2sSK-bWG88bUygq&_nc_zt=23&_nc_ht=scontent.fdad3-4.fna&_nc_gid=wsIkUJl_uSnIs3680d55QA&oh=00_AfN5z8UZ0-2Z0yXhhyDJ6HEpZ0vSepfIVkrw3fEyY9sqvg&oe=68529D9D",
      "https://scontent.fdad3-4.fna.fbcdn.net/v/t39.30808-6/475289677_122145653420376144_7236823523492735147_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_ohc=OQ4iAbv2bMEQ7kNvwH3zBnN&_nc_oc=AdkqV41OWnhzyqb-aw504F6hu4NpVenv0zPQpzMBZHb64slATCIvwQPU4rHtTDJLzGNoM3gFXCr0bBHvl1Qrl98u&_nc_zt=23&_nc_ht=scontent.fdad3-4.fna&_nc_gid=guWOPo3qG7SuZYlW2kOcDA&oh=00_AfMbPsfq_iazK44ICKl0G237RW_D5eXPYCc85_UGdvKkbQ&oe=6852A062",
      "https://scontent.fdad3-4.fna.fbcdn.net/v/t39.30808-6/475339366_122145653168376144_5982781744865490335_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=127cfc&_nc_ohc=VnIYNoxNxAIQ7kNvwHNChdF&_nc_oc=AdmOhbZ_5Bgar5ouhi1RI8SIspN9OLw9SGG3flt2MiED6uPFK-4sIvus3FYz5AHeLZ5Qu9Znd2sSK-bWG88bUygq&_nc_zt=23&_nc_ht=scontent.fdad3-4.fna&_nc_gid=wsIkUJl_uSnIs3680d55QA&oh=00_AfN5z8UZ0-2Z0yXhhyDJ6HEpZ0vSepfIVkrw3fEyY9sqvg&oe=68529D9D",
    ]
  },
  {
    id: 3,
    type: "Private",
    images: [
      "https://scontent.fdad3-4.fna.fbcdn.net/v/t39.30808-6/475953894_122146205330376144_7912648591853252472_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=104&ccb=1-7&_nc_sid=833d8c&_nc_ohc=3RueRpeZKAsQ7kNvwG78xzZ&_nc_oc=AdlgTkiUFHF0ZDc_q331Hkhv3vXA9ph_3dyv0X21oW9SUbxxxuph35xJSlZKaJEgCPp7gMtqEhWvcSUINf7pkuSe&_nc_zt=23&_nc_ht=scontent.fdad3-4.fna&_nc_gid=GZ-qcQAoyXqDF4F2aagspg&oh=00_AfNIseY68Jpo9alibii79XfhvaJ-HU9Zx7I1_nCeiS64Hg&oe=68529AA4",
      "https://scontent.fdad3-1.fna.fbcdn.net/v/t39.30808-6/475945084_122146205366376144_4362075204356924383_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=110&ccb=1-7&_nc_sid=833d8c&_nc_ohc=pDNiUSDGgDoQ7kNvwGmPIVH&_nc_oc=AdmhXFWfSQL4-VP-rtLM44mUYbr7oB8j9EqrixBRHmWUX1qy5MuGCAtsZkWLz6aBoeIZtfHCterDUK3TYUMQ8Pl9&_nc_zt=23&_nc_ht=scontent.fdad3-1.fna&_nc_gid=yuXREEc7fKoMilvMIrmLlw&oh=00_AfOSjJlvr1zuvpzg9nHDtvy1vWmTeCom-ZnPg_ZxVgp30Q&oe=6852929D",
      "https://scontent.fdad3-5.fna.fbcdn.net/v/t39.30808-6/476094678_122146205342376144_2457998607800445273_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=102&ccb=1-7&_nc_sid=833d8c&_nc_ohc=mbRd2wibW-EQ7kNvwHnQkw6&_nc_oc=Adld6YjRe44mYYdjAyfZ9iqtzwOoXY8AEL2YMRUYFSjbLf7oRBeDsRHXRY9W-kPzeLqw06ea4_XOC-8Uyv-vYcAL&_nc_zt=23&_nc_ht=scontent.fdad3-5.fna&_nc_gid=3EO_f6NH3WNeZCLea-aByw&oh=00_AfOj_TAv9cqqzpXVTL22JETnoRvESiBLvasgWArkOnoNWw&oe=68529D5C",
    ]
  }
]

export function Gallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

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
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  }

  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Khám Phá Không Gian Sống
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-gray-600"
          >
            Hình ảnh thực tế các căn hộ tại Là Nhà Apartment
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {MOCK_APARTMENTS.flatMap(apartment => 
            apartment.images.map((image, index) => (
              <motion.div
                key={`${apartment.id}-${index}`}
                variants={item}
                className="relative aspect-[4/3] overflow-hidden rounded-lg cursor-pointer group"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image}
                  alt={`${apartment.type} - Image ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-medium opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {apartment.type}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Selected apartment"
              className="w-full h-auto object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
} 