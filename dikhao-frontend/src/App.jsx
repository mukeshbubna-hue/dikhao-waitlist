import { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import HowItWorks from './components/HowItWorks';
import PricingSection from './components/PricingSection';
import Footer from './components/Footer';
import Survey from './components/Survey';

export default function App() {
  const [step, setStep] = useState('form'); // 'form' | 'success'
  const [mobile, setMobile] = useState('');
  const [waitlistData, setWaitlistData] = useState({});
  const [showSurvey, setShowSurvey] = useState(false);

  const handleOtpSent = (formData) => {
    setMobile(formData.mobile);
    setWaitlistData(formData);
    setStep('success');
  };

  if (showSurvey) return (
    <Survey
      prefill={{
        name: waitlistData.owner_name || '',
        whatsapp: waitlistData.mobile || '',
        city: waitlistData.city || '',
      }}
    />
  );

  return (
    <>
      <Navbar />
      <HeroSection
        step={step}
        mobile={mobile}
        onOtpSent={handleOtpSent}
        onVerified={() => setStep('success')}
        onBack={() => setStep('form')}
        onTakeSurvey={() => setShowSurvey(true)}
      />
      <HowItWorks />
      <PricingSection />
      <Footer />
    </>
  );
}
