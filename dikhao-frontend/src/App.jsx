import { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import HowItWorks from './components/HowItWorks';
import PricingSection from './components/PricingSection';
import Footer from './components/Footer';

export default function App() {
  const [step, setStep] = useState('form'); // 'form' | 'otp' | 'success'
  const [mobile, setMobile] = useState('');

  const handleOtpSent = (mob) => {
    setMobile(mob);
    setStep('otp');
  };

  return (
    <>
      <Navbar />
      <HeroSection
        step={step}
        mobile={mobile}
        onOtpSent={handleOtpSent}
        onVerified={() => setStep('success')}
        onBack={() => setStep('form')}
      />
      <HowItWorks />
      <PricingSection />
      <Footer />
    </>
  );
}
