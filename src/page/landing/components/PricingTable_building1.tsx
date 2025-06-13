import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckIcon } from '@heroicons/react/24/solid'
import { MinusIcon } from '@heroicons/react/24/outline'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'

const features = [
  { key: 'live', name: 'Live Collaboration', tooltip: 'Cộng tác thời gian thực trên tài liệu.' },
  { key: 'unlimited', name: 'Unlimited projects', tooltip: 'Không giới hạn số lượng dự án.' },
  { key: 'custom', name: 'Custom permissions', tooltip: 'Phân quyền chi tiết cho từng thành viên.' },
  { key: 'team', name: 'Team members', tooltip: 'Quản lý thành viên nhóm.' },
]

const planData = [
  {
    name: 'FREE',
    description: 'Quis suspendisse ut fermentum neque vivamus.',
    price: { monthly: 0, annual: 0 },
    features: [true, true, false, false],
  },
  {
    name: 'PRO',
    description: 'Quis eleifend a tincidunt pellentesque.',
    price: { monthly: 100, annual: 1000 },
    features: [true, true, true, false],
    recommended: true,
  },
  {
    name: 'PREMIUM',
    description: 'Orci volutpat ut sed sed neque, dui eget.',
    price: { monthly: 150, annual: 1500 },
    features: [true, true, true, true],
  },
]

export function PricingTable_building1() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const priceUnit = billing === 'monthly' ? '/month' : '/year'

  return (
    <section className="w-full bg-white py-20">
      <div className="max-w-5xl mx-auto px-2 sm:px-">
        {/* Heading */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Nguyễn Quý Anh Apartment</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Đường Nguyễn Quý Anh, Khu đô thị FPT, Ngũ Hành Sơn, Phố Đà Nẵng
          </p>
        </div>
        {/* Toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${billing === 'annual' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>6 tháng</span>
            <Switch
              checked={billing === 'monthly'}
              onCheckedChange={(checked: boolean) => setBilling(checked ? 'monthly' : 'annual')}
              className="data-[state=checked]:bg-slate-900"
            />
            <span className={`text-sm ${billing === 'monthly' ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>12 tháng</span>
          </div>
        </div>
        {/* Desktop Grid */}
        <div className="hidden md:block">
          <TooltipProvider>
            <div
              className="grid grid-cols-4 min-w-[900px] border border-slate-200 rounded-xl overflow-hidden bg-white"
              style={{ boxShadow: '0 2px 16px 0 rgba(0,0,0,0.03)' }}
            >
              {/* Empty cell for toggle row */}
              <div className="flex flex-col justify-end border-r border-slate-200 bg-white px-6 py-6"></div>
              {planData.map((plan, idx) => (
                <div
                  key={plan.name}
                  className={`flex flex-col items-center px-6 py-6 border-r last:border-r-0 border-slate-200 bg-white ${plan.recommended ? 'shadow-lg border-2 border-slate-900 z-10' : ''}`}
                  style={{ minHeight: 220 }}
                >
                  <span className="text-base font-bold text-gray-900 uppercase tracking-wide mb-1">{plan.name}</span>
                  <span className="text-sm text-gray-500 text-center mb-4">{plan.description}</span>
                  <div className="flex items-end mb-2">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price[billing] === 0 ? '$0' : `$${plan.price[billing]}`}</span>
                    <span className="text-base text-gray-400 ml-1 pb-1">{priceUnit}</span>
                  </div>
                  <Button className="w-full bg-black text-white rounded-md mt-4 hover:opacity-90 transition-opacity" size="lg">
                    Get Started
                  </Button>
                </div>
              ))}
              {/* Key Features Title Row */}
              <div className="flex items-center border-t border-r border-slate-200 bg-white px-6 py-4">
                <span className="text-sm font-semibold text-gray-900">Key Features</span>
              </div>
              {planData.map((_, idx) => (
                <div key={idx + '-features-title'} className="border-t border-r last:border-r-0 border-slate-200 bg-white px-6 py-4"></div>
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
                  {planData.map((plan, colIdx) => (
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
            </div>
          </TooltipProvider>
        </div>
        {/* Mobile Vertical Cards */}
        <div className="md:hidden flex flex-col gap-8">
          {planData.map((plan, idx) => (
            <div
              key={plan.name}
              className={`border border-slate-200 rounded-xl bg-white shadow-sm ${plan.recommended ? 'shadow-lg border-2 border-slate-900' : ''}`}
            >
              <div className="flex flex-col items-center px-6 pt-6 pb-2">
                <span className="text-base font-bold text-gray-900 uppercase tracking-wide mb-1">{plan.name}</span>
                <span className="text-sm text-gray-500 text-center mb-4">{plan.description}</span>
                <div className="flex items-end mb-2">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price[billing] === 0 ? '$0' : `$${plan.price[billing]}`}</span>
                  <span className="text-base text-gray-400 ml-1 pb-1">{priceUnit}</span>
                </div>
              </div>
              <div className="px-6 pb-4">
                <div className="mb-2 text-sm font-semibold text-gray-900">Key Features</div>
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
                <Button className="w-full bg-black text-white rounded-md mt-6 hover:opacity-90 transition-opacity" size="lg">
                  Get Started
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 