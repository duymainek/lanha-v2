import { motion } from 'framer-motion'

export function Hero() {
  return (
    <section className="relative h-screen overflow-hidden">
      {/* Mô hình 3D căn hộ — chiếm toàn bộ banner, UI điều hướng/zoom tầng nằm bên trong iframe.
          Scroll trên canvas 3D zoom model bình thường; khi zoom-out đã chạm giới hạn tối thiểu,
          app.js (bên trong iframe) không còn preventDefault() nữa nên trình duyệt tự chuyển phần
          wheel dư ra thành cuộn trang landing xuống các section bên dưới — không cần chặn gì ở
          document cha (overscroll-behavior) vì hành vi này giờ là chủ đích, không phải leak. */}
      <iframe
        src="/3d-viewer/index.html"
        title="Mô hình 3D Là Nhà Apartment"
        className="absolute inset-0 z-0 h-full w-full border-0"
        allow="fullscreen"
      />

      {/* Gợi ý cuộn xuống — icon chuột nảy nhẹ, không chặn tương tác với canvas bên dưới. */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
      >
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/90 pt-2">
          <div className="h-2.5 w-1 rounded-full bg-white/90" />
        </div>
      </motion.div>
    </section>
  )
}