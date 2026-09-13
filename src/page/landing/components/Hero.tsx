import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

type ModelKey = 'nqa' | 'ndc'

const MODELS: Record<ModelKey, { label: string; src: string; title: string }> = {
  nqa: { label: 'Nguyễn Quý Anh', src: '/3d-viewer/index.html', title: 'Mô hình 3D Là Nhà Apartment — Nguyễn Quý Anh' },
  ndc: { label: 'Nguyễn Đình Chiểu', src: '/3d-viewer-ndc/index.html', title: 'Mô hình 3D Là Nhà Apartment — Nguyễn Đình Chiểu' },
}

// Đọc model đang chọn từ hash URL (#nqa / #ndc) để có thể gửi link trực tiếp cho khách xem đúng
// 1 căn nhà — vd. lanha.vn/#ndc. Mặc định về NQA nếu hash trống/không hợp lệ.
function readModelFromHash(): ModelKey {
  const hash = window.location.hash.replace('#', '') as ModelKey
  return hash === 'ndc' ? 'ndc' : 'nqa'
}

export function Hero() {
  const [model, setModel] = useState<ModelKey>(readModelFromHash)

  // Đồng bộ khi khách bấm back/forward hoặc dán thẳng link có hash khác vào cùng tab.
  useEffect(() => {
    const onHashChange = () => setModel(readModelFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function selectModel(key: ModelKey) {
    setModel(key)
    window.location.hash = key
  }

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Bộ chọn nhà — NQA/NDC — đồng bộ 2 chiều với hash URL để có thể gửi link riêng cho khách
          (lanha.vn/#ndc, lanha.vn/#nqa) mở thẳng đúng mô hình. */}
      <div className="absolute left-1/2 top-5 z-20 flex -translate-x-1/2 gap-1 rounded-full bg-black/40 p-1 backdrop-blur-sm">
        {(Object.keys(MODELS) as ModelKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => selectModel(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              model === key ? 'bg-white text-black' : 'text-white/80 hover:text-white'
            }`}
          >
            {MODELS[key].label}
          </button>
        ))}
      </div>

      {/* Mô hình 3D căn hộ — chiếm toàn bộ banner, UI điều hướng/zoom tầng nằm bên trong iframe.
          Scroll trên canvas 3D zoom model bình thường; khi zoom-out đã chạm giới hạn tối thiểu,
          app.js (bên trong iframe) không còn preventDefault() nữa nên trình duyệt tự chuyển phần
          wheel dư ra thành cuộn trang landing xuống các section bên dưới — không cần chặn gì ở
          document cha (overscroll-behavior) vì hành vi này giờ là chủ đích, không phải leak.
          key={model} buộc React remount iframe khi đổi nhà (thay vì chỉ đổi src của iframe cũ),
          tránh việc script bên trong iframe cũ (app.js của nhà trước) còn sót lại chạy chồng lên. */}
      <iframe
        key={model}
        src={MODELS[model].src}
        title={MODELS[model].title}
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