import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { PricingTable_building1 } from "./components/PricingTable_building1";
import { Gallery } from "./components/Gallery";
import { Location } from "./components/Location";
import { Amenities } from "./components/Amenities";
import { Footer } from "./components/Footer";
import { Head } from "./components/Head";
import { PricingTable_building2 } from "./components/PricingTable_building2";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Head />
      <Navbar />
      <main>
        <Hero />
        <PricingTable_building1 />
        <PricingTable_building2 />

        <Gallery />
        <Amenities />
        <Location />
      </main>
      <Footer />
    </div>
  );
}   