import { Hero } from "./components/Hero";
import { Amenities } from "./components/Amenities";
import { PricingTable_building1 } from "./components/PricingTable_building1";
import { Location } from "./components/Location";
import { Footer } from "./components/Footer";
import { Head } from "./components/Head";
import { PricingTable_building2 } from "./components/PricingTable_building2";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Head />
      <main>
        <Hero />
        <Amenities />
        <PricingTable_building1 />
        <PricingTable_building2 />
        <Location />
      </main>
      <Footer />
    </div>
  );
}
