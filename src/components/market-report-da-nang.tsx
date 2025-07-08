import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ChartContainer } from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ReportMetadata {
  reportName: string;
  dataPeriod: string;
  currency: string;
  unit: string;
  locations: Record<string, string>;
  propertyTypes: Record<string, string>;
}

interface Offering {
  typeId: string;
  price: number;
  area_sqm: number;
  notes: string;
}

interface UserProperty {
  buildingId: string;
  buildingName: string;
  locationId: string;
  offerings: Offering[];
}

interface MarketAverages {
  studio: number;
  "1_pn": number;
}

interface HistoricalMarketDataItem {
  month: string;
  marketAverages: {
    khue_my: MarketAverages;
    fpt_city: MarketAverages;
  };
}

interface MarketReportData {
  reportMetadata: ReportMetadata;
  userProperties: UserProperty[];
  historicalMarketData: HistoricalMarketDataItem[];
}

interface MarketReportDaNangProps {
  data: MarketReportData;
}

const getMonthLabel = (month: string) => {
  const [year, m] = month.split("-");
  return `T${m}/${year}`;
};

export const MarketReportDaNang: React.FC<MarketReportDaNangProps> = ({ data }) => {
  const [type, setType] = useState<string>("all");
  const [period, setPeriod] = useState<string>("6m");
  const [area, setArea] = useState<string>("all");

  // Filtered months
  const months = useMemo(() => {
    let arr = data.historicalMarketData;
    if (period === "6m") arr = arr.slice(-6);
    return arr;
  }, [data, period]);

  // Chart data
  const chartData = useMemo(() => {
    return months.map((item) => {
      // Tính index tháng để map giá
      const monthIdx = data.historicalMarketData.findIndex(m => m.month === item.month);
      // 228 Nguyễn Đình Chiểu (Khuê Mỹ)
      let building_01_studio = null;
      let building_01_1pn = null;
      // Studio: 3M từ 2024-07 đến 2025-05, 2.8M ở 2025-06
      if (monthIdx >= 0 && monthIdx <= 10) building_01_studio = 3.0;
      if (monthIdx === 11) building_01_studio = 2.8;
      // 1PN: 4.5M toàn bộ 12 tháng
      building_01_1pn = 4.5;
      // Nguyễn Quý Anh (FPT City)
      let building_02_1pn = null;
      // 1PN: 5.2M từ 2025-02 đến 2025-05 (idx 7-10), 4.9M ở 2025-06 (idx 11)
      if (monthIdx >= 7 && monthIdx <= 10) building_02_1pn = 5.2;
      if (monthIdx === 11) building_02_1pn = 4.9;
      return {
        month: getMonthLabel(item.month),
        khue_my_studio: item.marketAverages.khue_my.studio,
        khue_my_1pn: item.marketAverages.khue_my["1_pn"],
        fpt_city_studio: item.marketAverages.fpt_city.studio,
        fpt_city_1pn: item.marketAverages.fpt_city["1_pn"],
        building_01_studio,
        building_01_1pn,
        building_02_1pn,
      };
    });
  }, [months, data]);

  // Xác định các line sẽ hiển thị dựa vào filter
  const showStudio = type === "all" || type === "studio";
  const show1PN = type === "all" || type === "1_pn";
  const showKhueMy = area === "all" || area === "khue_my";
  const showFPT = area === "all" || area === "fpt_city";

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Thị Trường Cho Thuê Bất Động Sản Đà Nẵng
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dữ liệu thực tế từ tháng 7/2024 đến tháng 6/2025 tại các khu vực Khuê Mỹ và FPT City
          </p>
        </div>
        <div className="max-w-3xl mx-auto mb-10">
          <Card className="p-6 md:p-8 shadow-lg border border-slate-200 rounded-xl">
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-stretch justify-center">
              <div className="flex-1 min-w-[160px]">
                <div className="mb-1 text-xs font-medium text-gray-700">Khu vực</div>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tất cả khu vực" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả khu vực</SelectItem>
                    <SelectItem value="khue_my">Khuê Mỹ</SelectItem>
                    <SelectItem value="fpt_city">FPT City</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <div className="mb-1 text-xs font-medium text-gray-700">Loại Căn Hộ</div>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tất cả loại phòng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả loại phòng</SelectItem>
                    {Object.entries(data.reportMetadata.propertyTypes).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <div className="mb-1 text-xs font-medium text-gray-700">Khoảng Thời Gian</div>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="6 tháng gần đây" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6m">6 tháng gần đây</SelectItem>
                    <SelectItem value="12m">12 tháng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 md:p-8 shadow-lg border border-slate-200 rounded-xl">
            <div className="font-semibold text-xl text-gray-900 mb-4 text-center">Xu Hướng Giá Thuê Theo Thời Gian</div>
            <ChartContainer
              config={{
                studio: { label: "Studio", color: "#3b82f6" },
                "1pn": { label: "Căn hộ 1 Phòng Ngủ", color: "#a78bfa" },
                building_01_studio: { label: "Studio 228 Nguyễn Đình Chiểu", color: "#f59e42" },
                building_01_1pn: { label: "1PN 228 Nguyễn Đình Chiểu", color: "#e11d48" },
                building_02_1pn: { label: "1PN Nguyễn Quý Anh", color: "#0d9488" },
              }}
              className="bg-white rounded-lg"
            >
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 14, fill: '#64748b' }} />
                  <YAxis domain={[0, 8]} tickFormatter={(v) => `${v.toFixed(1)}M`} tick={{ fontSize: 14, fill: '#64748b' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 14 }} />
                  {showStudio && showKhueMy && (
                    <Line type="monotone" dataKey="khue_my_studio" name="Studio Khuê Mỹ" stroke="#3b82f6" strokeWidth={2} dot />
                  )}
                  {show1PN && showKhueMy && (
                    <Line type="monotone" dataKey="khue_my_1pn" name="1PN Khuê Mỹ" stroke="#a78bfa" strokeWidth={2} dot />
                  )}
                  {show1PN && showFPT && (
                    <Line type="monotone" dataKey="fpt_city_1pn" name="1PN FPT City" stroke="#f472b6" strokeWidth={2} dot />
                  )}
                  {showStudio && showKhueMy && (
                    <Line type="monotone" dataKey="building_01_studio" name="Studio 228 Nguyễn Đình Chiểu" stroke="#f59e42" strokeWidth={2} dot connectNulls />
                  )}
                  {show1PN && showKhueMy && (
                    <Line type="monotone" dataKey="building_01_1pn" name="1PN 228 Nguyễn Đình Chiểu" stroke="#e11d48" strokeWidth={2} dot connectNulls />
                  )}
                  {show1PN && showFPT && (
                    <Line type="monotone" dataKey="building_02_1pn" name="1PN Nguyễn Quý Anh" stroke="#0d9488" strokeWidth={2} dot connectNulls />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>
        </div>
      </div>
    </section>
  );
}; 