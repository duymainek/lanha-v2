import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { PricingTable_building1 } from "./components/PricingTable_building1";
import { Gallery } from "./components/Gallery";
import { Location } from "./components/Location";
import { Amenities } from "./components/Amenities";
import { Footer } from "./components/Footer";
import { Head } from "./components/Head";
import { PricingTable_building2 } from "./components/PricingTable_building2";
import { MarketReportDaNang } from "@/components/market-report-da-nang";

// Dữ liệu mẫu, thực tế sẽ lấy từ API hoặc props ngoài
const marketReportData = {
  reportMetadata: {
    reportName: "Dữ liệu Thị trường Cho thuê Bất động sản Đà Nẵng",
    dataPeriod: "Tháng 7, 2024 - Tháng 6, 2025",
    currency: "VND",
    unit: "Triệu VND / tháng",
    locations: {
      khue_my: "Khuê Mỹ / Nam Việt Á",
      fpt_city: "FPT City / Làng Đại học"
    },
    propertyTypes: {
      studio: "Studio",
      "1_pn": "Căn hộ 1 Phòng Ngủ"
    }
  },
  userProperties: [
    {
      buildingId: "building_01",
      buildingName: "Tòa nhà tại 228 Nguyễn Đình Chiểu",
      locationId: "khue_my",
      offerings: [
        {
          typeId: "studio",
          price: 5.2,
          area_sqm: 40,
          notes: "Căn hộ sân thượng (rooftop), không gian thoáng đãng, full nội thất."
        },
        {
          typeId: "1_pn",
          price: 7.0,
          area_sqm: 60,
          notes: "Diện tích lớn 60m², nội thất cao cấp, có cửa sổ lớn."
        }
      ]
    },
    {
      buildingId: "building_02",
      buildingName: "Tòa nhà tại đường Nguyễn Quý Anh",
      locationId: "fpt_city",
      offerings: [
        {
          typeId: "1_pn",
          price: 5.8,
          area_sqm: 45,
          notes: "Full tiện ích, có ban công riêng, gần các công ty công nghệ."
        }
      ]
    }
  ],
  historicalMarketData: [
    { month: "2024-07", marketAverages: { khue_my: { studio: 4.6, "1_pn": 5.8 }, fpt_city: { studio: 3.4, "1_pn": 5.3 } } },
    { month: "2024-08", marketAverages: { khue_my: { studio: 4.6, "1_pn": 5.8 }, fpt_city: { studio: 3.4, "1_pn": 5.4 } } },
    { month: "2024-09", marketAverages: { khue_my: { studio: 4.7, "1_pn": 5.9 }, fpt_city: { studio: 3.5, "1_pn": 5.4 } } },
    { month: "2024-10", marketAverages: { khue_my: { studio: 4.7, "1_pn": 5.9 }, fpt_city: { studio: 3.5, "1_pn": 5.4 } } },
    { month: "2024-11", marketAverages: { khue_my: { studio: 4.7, "1_pn": 6.0 }, fpt_city: { studio: 3.5, "1_pn": 5.5 } } },
    { month: "2024-12", marketAverages: { khue_my: { studio: 4.8, "1_pn": 6.1 }, fpt_city: { studio: 3.6, "1_pn": 5.6 } } },
    { month: "2025-01", marketAverages: { khue_my: { studio: 4.8, "1_pn": 6.1 }, fpt_city: { studio: 3.6, "1_pn": 5.6 } } },
    { month: "2025-02", marketAverages: { khue_my: { studio: 4.7, "1_pn": 6.0 }, fpt_city: { studio: 3.5, "1_pn": 5.5 } } },
    { month: "2025-03", marketAverages: { khue_my: { studio: 4.8, "1_pn": 6.0 }, fpt_city: { studio: 3.6, "1_pn": 5.5 } } },
    { month: "2025-04", marketAverages: { khue_my: { studio: 4.8, "1_pn": 6.0 }, fpt_city: { studio: 3.6, "1_pn": 5.5 } } },
    { month: "2025-05", marketAverages: { khue_my: { studio: 4.9, "1_pn": 6.1 }, fpt_city: { studio: 3.7, "1_pn": 5.6 } } },
    { month: "2025-06", marketAverages: { khue_my: { studio: 4.8, "1_pn": 6.0 }, fpt_city: { studio: 3.6, "1_pn": 5.5 } } }
  ],
  buildingHistoricalData: [
    {
      buildingId: "building_01",
      buildingName: "Tòa nhà tại 228 Nguyễn Đình Chiểu",
      locationId: "khue_my",
      prices: [
        { month: "2024-07", studio: 3.0, "1_pn": 4 },
        { month: "2024-08", studio: 3.0, "1_pn": 4 },
        { month: "2024-09", studio: 3.0, "1_pn": 4 },
        { month: "2024-10", studio: 3.0, "1_pn": 4 },
        { month: "2024-11", studio: 3.0, "1_pn": 4 },
        { month: "2024-12", studio: 3.0, "1_pn": 4.5 },
        { month: "2025-01", studio: 3.0, "1_pn": 4.5 },
        { month: "2025-02", studio: 3.0, "1_pn": 4.5 },
        { month: "2025-03", studio: 3.0, "1_pn": 4.5 },
        { month: "2025-04", studio: 3.0, "1_pn": 4.5 },
        { month: "2025-05", studio: 3.0, "1_pn": 4.5 },
        { month: "2025-06", studio: 2.8, "1_pn": 4.5 }
      ]
    },
    {
      buildingId: "building_02",
      buildingName: "Tòa nhà tại đường Nguyễn Quý Anh",
      locationId: "fpt_city",
      prices: [
        { month: "2025-02", "1_pn": 5.2 },
        { month: "2025-03", "1_pn": 5.2 },
        { month: "2025-04", "1_pn": 5.2 },
        { month: "2025-05", "1_pn": 5.2 },
        { month: "2025-06", "1_pn": 4.9 }
      ]
    }
  ]
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Head />
      <Navbar />
      <main>
        <Hero />
        <Amenities />
        <MarketReportDaNang data={marketReportData} />
        <PricingTable_building1 />
        <PricingTable_building2 />
        <Location />
        <Gallery />
      </main>
      <Footer />
    </div>
  );
}   