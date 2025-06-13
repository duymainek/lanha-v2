/**
 * Chuyển đổi số tháng thành tên tháng viết tắt
 * @param {string} month - Số tháng dạng chuỗi (01-12)
 * @returns {string} Tên tháng viết tắt (Jan-Dec)
 */
export function convertMonthNumberToName(month: string): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthIndex = parseInt(month, 10) - 1;
  return months[monthIndex];
}

/**
 * Format date string from ISO format to dd-MM-yyyy
 * @param {string} dateString - Date string in ISO format (YYYY-MM-DDTHH:mm:ss)
 * @returns {string} Formatted date string (dd-MM-yyyy)
 */
export function formatDateToDDMMYYYY(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function formatDateToYYYYMMDD(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}



