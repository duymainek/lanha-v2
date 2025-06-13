/**
 * Chuyển đổi số tiền sang định dạng tiền tệ VND
 * @param {number} amount - Số tiền cần chuyển đổi
 * @returns {string} Số tiền đã được định dạng theo VND
 */
export function formatToVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Ví dụ sử dụng:
// formatToVND(4208600) => "4.208.600 ₫"
