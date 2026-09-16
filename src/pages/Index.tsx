import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import HowItWorks from '@/components/HowItWorks';
import Modules from '@/components/Modules';
import ParentFlow from '@/components/ParentFlow';
import ErrorHeatmap from '@/components/ErrorHeatmap';
import Shop from '@/components/Shop';
import Parents from '@/components/Parents';
import CtaSection from '@/components/CtaSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Header />
      <Hero />
      <Marquee />
      <HowItWorks />
      <Modules />
      <ParentFlow />
      <ErrorHeatmap />
      <Shop />
      <Parents />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Index;