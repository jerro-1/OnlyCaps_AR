import Header from '../components/Header';
import Footer from '../components/Footer';
import BgImg from '../components/BgImg';
import SizeGuideCard from '../components/SizeGuideCard';

const CapMeasurement = () => (
  <>
    <BgImg>
      <Header />
      <div className="min-h-screen pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <SizeGuideCard />
        </div>
      </div>
    </BgImg>
    <Footer />
  </>
);

export default CapMeasurement;
