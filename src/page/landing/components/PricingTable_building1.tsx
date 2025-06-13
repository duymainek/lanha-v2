import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckIcon } from '@heroicons/react/24/solid'
import { MinusIcon } from '@heroicons/react/24/outline'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { ContactDialog } from './ContactDialog'

const information = [
  {key: 'type', name: 'Loại căn hộ'},
  {key: 'm2', name: 'Diện tích'},
  {key: 'deposit', name: 'Đặt cọc'},
  {key: 'payment', name: 'Thanh toán'},
]

const feeServices = [
  {key: 'electricity', name: 'Điện'},
  {key: 'water', name: 'Nước/người', tooltip: 'Tính trên số lượng người ở' },
  {key: 'other', name: 'Phí dịch vụ/người', tooltip: 'Tính trên số lượng người ở, dùng cho các hoạt động như sinh nhật, tết, ...' },
  {key: 'hot_water', name: 'Nước nóng/người', tooltip: 'Sử dụng nước năng lượng mặt trời. Chi phí sẽ chia đầu người của toà nhà' },
]

const features = [
  { key: 'wifi', name: 'Wifi', tooltip: 'Wifi tốc độ cao 1000Mbps' },
  { key: 'air_conditioner', name: 'Điều hòa', tooltip: 'Điều hòa 1.5HP' },
  { key: 'washing_machine', name: 'Máy giặt', tooltip: 'Máy giặt 9kg' },
  { key: 'refrigerator', name: 'Tủ lạnh', tooltip: 'Tủ lạnh 250L' },
  { key: 'bed', name: 'Giường 1m8',},
  { key: 'table', name: 'Bàn làm việc',},
  { key: 'wardrobe', name: 'Tủ quần áo',},
  { key: 'dining_table', name: 'Bàn ăn và 4 ghế',},
  { key: 'kitchen', name: 'Bếp từ',},
  { key: 'bathroom', name: 'Phòng tắm riêng',},
  { key: 'balcony', name: 'Sân thượng',},
  { key: 'parking', name: 'Chỗ đậu xe',},
  { key: 'balcony', name: 'Ban công',},
  { key: 'personal_wifi', name: 'Wifi cá nhân', tooltip: 'Wifi riêng trong phòng' },
  { key: 'tv', name: 'TV', tooltip: 'Tivi 40 inch' },
]

const planData = [
  {
    name: 'STANDARD',
    description: 'Căn hộ có đầy đủ tiện nghi, giá cả phải chăng',
    price: { sixMonths: '4.9M', year: '5.3M' },
    information: ['1 phòng ngủ', '45m2', '1 tháng', '1 tháng'],
    features: [true, true, true, true, true, true, true, true, true, true, true, true,true,false, false],
    recommended: true,
    feeServices: ['3.8k/kw', '80.000đ', '50.000đ', 'Chia theo người ở'],
  },
  {
    name: 'PREMIUM',
    description: 'Căn hộ như Standard nhưng có thêm nhiều tiện ích',
    price: { sixMonths: '6M', year: '5.5M' },
    features: [true, true, true, true, true, true, true, true, true, true, true, true,true,true, true],
    recommended: false,
    information: ['1 phòng ngủ', '45m2', '1 tháng', '1 tháng'],
    feeServices: ['3.8k/kw', '80.000đ', '50.000đ', 'Chia theo người ở'],
  },
]

export function PricingTable_building1() {
  const [openContact, setOpenContact] = useState(false)
  const [billing, setBilling] = useState<'sixMonths' | 'year'>('sixMonths')
  const priceUnit = billing === 'sixMonths' ? '/6 months' : '/year'

  return (
    <section className="w-full bg-white py-20">
      <div className="max-w-5xl mx-auto px-2 sm:px-">
        {/* Heading */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Nguyễn Quý Anh Apartment</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Đường Nguyễn Quý Anh, Khu đô thị FPT, Ngũ Hành Sơn, Đà Nẵng
          </p>
        </div>
        {/* Toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${billing === 'year' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>6 tháng</span>
            <Switch
              checked={billing === 'sixMonths'}
              onCheckedChange={(checked: boolean) => setBilling(checked ? 'sixMonths' : 'year')}
              className="data-[state=checked]:bg-slate-900"
            />
            <span className={`text-sm ${billing === 'year' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>12 tháng</span>
          </div>
        </div>
        {/* Desktop Grid */}
        <div className="hidden md:block">
          <TooltipProvider>
            <div
              className="grid grid-cols-3 min-w-[900px] border border-slate-200 rounded-xl overflow-hidden bg-white"
              style={{ boxShadow: '0 2px 16px 0 rgba(0,0,0,0.03)' }}
            >
              {/* Empty cell for toggle row */}
              <div className="flex flex-col justify-end border-r border-slate-200 bg-white px-6 py-6"></div>
              {planData.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col items-center px-6 py-6 border-r last:border-r-0 border-slate-200 bg-white ${plan.recommended ? 'shadow-lg border-2 border-slate-900 z-10' : ''}`}
                  style={{ minHeight: 220 }}
                >
                  <span className="text-base font-bold text-gray-900 uppercase tracking-wide mb-1">{plan.name}</span>
                  <span className="text-sm text-gray-500 text-center mb-4">{plan.description}</span>
                  <div className="flex items-end mb-2">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price[billing]}</span>
                    <span className="text-base text-gray-400 ml-1 pb-1">{priceUnit}</span>
                  </div>
                  <ContactButton onClick={() => setOpenContact(true)} />
                </div>
              ))}

              {/* Information Title Row */}
              <div className="flex items-center border-t border-r border-slate-200 bg-slate-50 px-6 py-4">
                <span className="text-sm font-semibold text-gray-900">Thông tin</span>
              </div>
              {planData.map((_, idx) => (
                <div key={idx + '-information-title'} className="border-t border-r last:border-r-0 border-slate-200 bg-slate-50 px-6 py-4"></div>
              ))}
              {information.map((info, rowIdx) => (
                <>
                  {/* FeFee Servicesature label + info icon */}
                  <div key={info.key} className="flex items-center gap-2 border-t border-r border-slate-200 bg-white px-6 py-4">
                    <span className="text-sm text-gray-900">{info.name}</span>
                    
                  </div>
                  {/* Check/dash for each plan */}
                  {planData.map((plan) => (
                    <div
                      key={plan.name + info.key}
                      className={`flex items-center justify-center border-t border-r last:border-r-0 border-slate-200 bg-white px-6 py-4`}
                    >
                      {plan.information[rowIdx]}
                    </div>
                  ))}
                </>
              ))}

              {/* Key Features Title Row */}
              <div className="flex items-center border-t border-r border-slate-200 bg-slate-50 px-6 py-4">
                <span className="text-sm font-semibold text-gray-900">Tiện ích</span>
              </div>
              {planData.map((_, idx) => (
                <div key={idx + '-features-title'} className="border-t border-r last:border-r-0 border-slate-200 bg-slate-50 px-6 py-4"></div>
              ))}
              {/* Features Rows */}
              {features.map((feature, rowIdx) => (
                <>
                  {/* Feature label + info icon */}
                  <div key={feature.key} className="flex items-center gap-2 border-t border-r border-slate-200 bg-white px-6 py-4">
                    <span className="text-sm text-gray-900">{feature.name}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-block cursor-pointer text-gray-400">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#e5e7eb"/><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#6b7280">i</text></svg>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{feature.tooltip}</TooltipContent>
                    </Tooltip>
                  </div>
                  {/* Check/dash for each plan */}
                  {planData.map((plan) => (
                    <div
                      key={plan.name + feature.key}
                      className={`flex items-center justify-center border-t border-r last:border-r-0 border-slate-200 bg-white px-6 py-4`}
                    >
                      {plan.features[rowIdx] ? (
                        <CheckIcon className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <MinusIcon className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                  ))}
                </>
              ))}
              {/* Fee Services Title Row */}
              <div className="flex items-center border-t border-r border-slate-200 bg-slate-50 px-6 py-4">
                <span className="text-sm font-semibold text-gray-900">Phí dịch vụ</span>
              </div>
              {planData.map((_, idx) => (
                <div key={idx + '-features-title'} className="border-t border-r last:border-r-0 border-slate-200 bg-slate-50 px-6 py-4"></div>
              ))}
              {feeServices.map((feeService, rowIdx) => (
                <>
                  {/* FeFee Servicesature label + info icon */}
                  <div key={feeService.key} className="flex items-center gap-2 border-t border-r border-slate-200 bg-white px-6 py-4">
                    <span className="text-sm text-gray-900">{feeService.name}</span>
                    {feeService.tooltip && <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-block cursor-pointer text-gray-400">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#e5e7eb"/><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#6b7280">i</text></svg>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{feeService.tooltip}</TooltipContent>
                    </Tooltip>}
                  </div>
                  {/* Check/dash for each plan */}
                  {planData.map((plan) => (
                    <div
                      key={plan.name + feeService.key}
                      className={`flex items-center justify-center border-t border-r last:border-r-0 border-slate-200 bg-white px-6 py-4`}
                    >
                      {plan.feeServices[rowIdx]}
                    </div>
                  ))}
                </>
              ))}

            </div>
          </TooltipProvider>
        </div>
        {/* Mobile Vertical Cards */}
        <div className="md:hidden flex flex-col gap-8">
          {planData.map((plan) => (
            <div
              key={plan.name}
              className={`border border-slate-200 rounded-xl bg-white shadow-sm ${plan.recommended ? 'shadow-lg border-2 border-slate-900' : ''}`}
            >
              <div className="flex flex-col items-center px-6 pt-6 pb-2">
                <span className="text-base font-bold text-gray-900 uppercase tracking-wide mb-1">{plan.name}</span>
                <span className="text-sm text-gray-500 text-center mb-4">{plan.description}</span>
                <div className="flex items-end mb-2">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price[billing]}</span>
                  <span className="text-base text-gray-400 ml-1 pb-1">{priceUnit}</span>
                </div>
              </div>
              <div className="px-6 pb-4">
                <div className="mb-2 text-sm font-semibold text-gray-900">Thông tin</div>
                <div className="flex flex-col gap-3">
                  {information.map((info, rowIdx) => (
                    <div key={info.key} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-sm text-gray-900">{info.name}</span>
                      <span className="text-sm text-gray-900">{plan.information[rowIdx]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 pb-4">
                <div className="mb-2 text-sm font-semibold text-gray-900">Tiện ích</div>
                <div className="flex flex-col gap-3">
                  {features.map((feature, rowIdx) => (
                    <div key={feature.key} className="flex items-center justify-between gap-2 py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{feature.name}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block cursor-pointer text-gray-400">
                              <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#e5e7eb"/><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#6b7280">i</text></svg>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{feature.tooltip}</TooltipContent>
                        </Tooltip>
                      </div>
                      <div>
                        {plan.features[rowIdx] ? (
                          <CheckIcon className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <MinusIcon className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 pb-4">
                <div className="mb-2 text-sm font-semibold text-gray-900">Phí dịch vụ</div>
                <div className="flex flex-col gap-3">
                  {feeServices.map((feeService, rowIdx) => (
                    <div key={feeService.key} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-sm text-gray-900">{feeService.name}</span>
                      <span className="text-sm text-gray-900">{plan.feeServices[rowIdx]}</span>
                    </div>
                  ))}
                </div>
                <ContactButton onClick={() => setOpenContact(true)} />
              </div>
              
            </div>
            
          ))}
        </div>
      </div>
      <ContactDialog open={openContact} onOpenChange={setOpenContact} />

    </section>
  )
} 
interface ContactButtonProps {
  className?: string;
  onClick: () => void;
}

function ContactButton({ className, onClick }: ContactButtonProps) {
  return (
    <Button 
      size="lg" 
      className={`w-full bg-black text-white hover:bg-slate-100 mt-4 ${className || ''}`}
      onClick={onClick}
    >
      Liên hệ
    </Button>
  );
}



