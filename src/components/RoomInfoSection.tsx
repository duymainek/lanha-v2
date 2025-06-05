import * as React from 'react';
import type { Room } from '../data/types';
import { Badge } from './Badge';
import { getStatusColor } from '../utils/helpers';

const amenityIcons: Record<string, string> = {
  furnished: '🛋️',
  air_conditioning: '❄️',
  washing_machine: '🧺',
  internet: '🌐',
};
const serviceIcons: Record<string, string> = {
  includes_water: '🚰',
  includes_wifi: '📶',
  includes_cleaning: '🧹',
  includes_security: '🛡️',
  includes_maintenance: '🔧',
  includes_electricity: '⚡',
};

const boolText = (val?: boolean) => val ? 'Có' : 'Không';
const formatPrice = (val?: number) => val != null ? val.toLocaleString('vi-VN') + ' ₫' : '-';
const formatDate = (val?: string) => val ? new Date(val).toLocaleDateString('vi-VN') : '-';

export const RoomInfoSection: React.FC<{ room: Room }> = ({ room }) => {
  const [lang, setLang] = React.useState<'vi' | 'en' | 'ru'>('vi');
  const desc =
    lang === 'en' ? room.description_en :
    lang === 'ru' ? room.description_ru :
    room.description_vi;
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold">{room.unit_number}</span>
          <Badge colorClass={getStatusColor(room.status)}>{room.status}</Badge>
        </div>
        <div className="flex gap-2">
          <button className={`px-2 py-1 rounded ${lang==='vi'?'bg-primary text-white':'bg-slate-100'}`} onClick={()=>setLang('vi')}>VI</button>
          <button className={`px-2 py-1 rounded ${lang==='en'?'bg-primary text-white':'bg-slate-100'}`} onClick={()=>setLang('en')}>EN</button>
          <button className={`px-2 py-1 rounded ${lang==='ru'?'bg-primary text-white':'bg-slate-100'}`} onClick={()=>setLang('ru')}>RU</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div><b>Tầng:</b> {room.floor || '-'}</div>
          <div><b>Phòng tắm:</b> {room.bathrooms}</div>
          <div><b>Diện tích:</b> {room.area} m²</div>
          <div><b>Giá hiển thị:</b> {formatPrice(room.display_price ?? room.price)}</div>
          <div><b>Tiền điện:</b> {formatPrice(room.electricity_price)}</div>
          <div><b>Tiền nước:</b> {formatPrice(room.water_price)}</div>
          <div><b>Tiền đặt cọc:</b> {formatPrice(room.deposit)}</div>
          <div><b>Thời gian thuê tối thiểu:</b> {room.minimum_rental_period} tháng</div>
          <div><b>Ngày có thể nhận phòng tiếp theo:</b> {formatDate(room.next_available_date)}</div>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <b>Tiện nghi:</b>
            {Object.entries(amenityIcons).map(([key, icon]) => (
              <span key={key} title={key} className={`inline-flex items-center px-2 py-1 rounded ${room[key as keyof Room] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{icon} {boolText(room[key as keyof Room] as boolean)}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <b>Dịch vụ bao gồm:</b>
            {Object.entries(serviceIcons).map(([key, icon]) => (
              <span key={key} title={key} className={`inline-flex items-center px-2 py-1 rounded ${room[key as keyof Room] ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{icon} {boolText(room[key as keyof Room] as boolean)}</span>
            ))}
          </div>
        </div>
      </div>
      <div>
        <b>Mô tả ({lang.toUpperCase()}):</b>
        <div className="mt-1 p-3 bg-slate-50 rounded min-h-[60px]">{desc || <span className="text-text-muted">(Chưa có mô tả)</span>}</div>
      </div>
    </div>
  );
}; 