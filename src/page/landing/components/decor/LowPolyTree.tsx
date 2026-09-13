interface LowPolyTreeProps {
  className?: string
}

/**
 * Cây low-poly isometric — phiên bản SVG phẳng của hàm tree() trong
 * public/3d-viewer/app.js (thân trụ nâu + 4 khối tán lá đa giác chồng lệch).
 * Dùng làm hoạ tiết trang trí góc section để giữ đồng nhất với banner 3D.
 */
export function LowPolyTree({ className }: LowPolyTreeProps) {
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden="true">
      <ellipse cx="50" cy="112" rx="26" ry="6" fill="var(--color-grass)" opacity="0.35" />
      <path d="M46 118 L44 70 L56 70 L54 118 Z" fill="var(--color-trunk)" />
      <polygon points="50,18 78,34 78,60 50,76 22,60 22,34" fill="var(--color-leaf)" />
      <polygon points="50,18 78,34 50,50 22,34" fill="var(--color-leaf-dark)" opacity="0.55" />
      <polygon points="76,48 96,60 96,80 76,92 60,80 60,60" fill="var(--color-leaf)" />
      <polygon points="76,48 96,60 76,72 60,60" fill="var(--color-leaf-dark)" opacity="0.5" />
      <polygon points="26,50 44,60 44,78 26,88 12,78 12,60" fill="var(--color-leaf)" />
      <polygon points="26,50 44,60 26,70 12,60" fill="var(--color-leaf-dark)" opacity="0.5" />
      <polygon points="50,42 66,52 66,68 50,78 34,68 34,52" fill="var(--color-leaf)" />
      <polygon points="50,42 66,52 50,62 34,52" fill="var(--color-leaf-dark)" opacity="0.45" />
    </svg>
  )
}
