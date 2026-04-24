import { useReveal } from './hooks/useReveal';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TheMoment } from './components/TheMoment';
import { HowItWorks } from './components/HowItWorks';
import { Showcase } from './components/Showcase';
import { WaitlistForm } from './components/WaitlistForm';
import { Footer } from './components/Footer';

export default function App() {
  useReveal();
  return (
    <div className="grain">
      <Navbar />
      <main>
        <Hero />
        <TheMoment />
        <HowItWorks />
        <Showcase />
        <WaitlistForm />
      </main>
      <Footer />
    </div>
  );
}
