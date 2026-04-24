import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';

const PLANS = [
  {
    id: 'pilot',
    name: 'Pilot',
    nameHi: 'पायलट',
    price: 999,
    tagline: 'For single-location shops starting out',
    features: [
      '50 customers / month',
      '1 location',
      'Unlimited try-ons per customer',
      'WhatsApp shortlist share',
      'Basic support',
    ],
    recommended: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    nameHi: 'ग्रोथ',
    price: 2999,
    tagline: 'For busy shops seeing real bridal traffic',
    features: [
      '300 customers / month',
      'Up to 3 locations',
      'Unlimited try-ons per customer',
      'Priority WhatsApp share + analytics',
      'Phone + WhatsApp support',
    ],
    recommended: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    nameHi: 'प्रो',
    price: 7999,
    tagline: 'Multi-city chains',
    features: [
      'Unlimited customers',
      'Unlimited locations',
      'Custom branding on customer WhatsApp link',
      'Monthly conversion review',
      'Dedicated account manager',
    ],
    recommended: false,
  },
];

// Placeholder UPI ID — swap with real merchant when onboarded with Razorpay/PhonePe
const MERCHANT_UPI = 'dikhao@paytm';

function upiDeepLink(planId, amount) {
  const params = new URLSearchParams({
    pa: MERCHANT_UPI,
    pn: 'Dikhao',
    am: String(amount),
    cu: 'INR',
    tn: `Dikhao ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan`,
  });
  return `upi://pay?${params.toString()}`;
}

function qrUrl(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&format=png&margin=10&data=${encodeURIComponent(data)}`;
}

export default function Plans() {
  const { store } = useOutletContext();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const currentPlan = store?.plan;

  const plan = selected ? PLANS.find(p => p.id === selected) : null;
  const deepLink = plan ? upiDeepLink(plan.id, plan.price) : null;

  if (plan) {
    return (
      <div className="min-h-screen bg-ivory">
        <div className="max-w-[560px] mx-auto px-6 sm:px-10 py-10">
          <button
            onClick={() => setSelected(null)}
            className="text-plum/60 hover:text-plum text-sm font-body mb-6"
          >
            ← Change plan
          </button>

          <p className="text-[10px] uppercase tracking-[0.25em] text-plum/70 font-body">Pay for</p>
          <h1 className="font-display text-plum text-[36px] leading-tight mt-1">
            {plan.name} · ₹{plan.price.toLocaleString('en-IN')}<span className="text-[18px] text-plum/60">/mo</span>
          </h1>

          <div className="mt-8 bg-warm-white border border-plum/10 p-6 flex flex-col items-center">
            <img
              src={qrUrl(deepLink)}
              alt={`UPI QR for ₹${plan.price}`}
              className="w-72 h-72 bg-ivory p-2"
              loading="eager"
            />
            <p className="font-display text-plum text-[20px] mt-5">Scan with any UPI app</p>
            <p className="text-plum/60 text-sm font-body mt-1">
              Google Pay · PhonePe · Paytm · BHIM
            </p>
            <p className="text-plum/50 text-xs font-body mt-3 text-center">
              Merchant: <span className="text-plum font-mono">{MERCHANT_UPI}</span>
            </p>
            <a
              href={deepLink}
              className="mt-6 inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-plum text-ivory text-[12px] uppercase tracking-[0.15em] hover:bg-plum-dim transition-colors"
            >
              Open in UPI app →
            </a>
          </div>

          <p className="text-plum/60 text-xs font-body mt-6 leading-relaxed">
            Your store plan updates automatically within 5 minutes of payment. Issue?
            WhatsApp us at <span className="text-plum font-medium">+91 98765 43210</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-[1100px] mx-auto px-6 sm:px-10 py-10">
        <header className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.25em] text-plum/70 font-body">
            Plans · प्लान्स
          </p>
          <h1 className="font-display text-plum text-[36px] leading-tight mt-1">
            Choose your plan
          </h1>
          <p className="text-plum/70 text-sm font-body mt-2">
            Pay once a month. Cancel anytime. All plans are billed monthly.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(p => {
            const isCurrent = currentPlan === p.id;
            return (
              <div
                key={p.id}
                className={`relative p-6 border ${
                  p.recommended ? 'border-plum bg-warm-white' : 'border-plum/15 bg-warm-white'
                } flex flex-col`}
              >
                {p.recommended && (
                  <div className="absolute -top-3 left-6 bg-plum text-ivory text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 font-body">
                    Recommended
                  </div>
                )}

                <p className="text-[10px] uppercase tracking-[0.25em] text-rose-gold-dim font-body">
                  {p.nameHi} · {p.name}
                </p>
                <div className="flex items-baseline mt-3 mb-1">
                  <span className="font-display text-plum text-[40px] leading-none">
                    ₹{p.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-plum/60 text-sm ml-1 font-body">/month</span>
                </div>
                <p className="text-plum/70 text-sm font-body mb-4">{p.tagline}</p>

                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm text-plum font-body">
                      <span className="text-rose-gold-dim">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setSelected(p.id)}
                  disabled={isCurrent}
                  className={`w-full py-3 text-[12px] uppercase tracking-[0.15em] transition-colors ${
                    isCurrent
                      ? 'bg-plum/5 text-plum/40 border border-plum/10 cursor-not-allowed'
                      : p.recommended
                        ? 'bg-plum text-ivory hover:bg-plum-dim'
                        : 'bg-ivory text-plum border border-plum hover:bg-plum hover:text-ivory'
                  }`}
                >
                  {isCurrent ? 'Your current plan' : `Pay ₹${p.price.toLocaleString('en-IN')} →`}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-plum/50 text-xs font-body mt-8 max-w-[560px] leading-relaxed">
          All plans include AI virtual try-on, WhatsApp shortlist sharing,
          category-specific product placement (necklace, choker, pendant,
          earrings, borla, nath), and the full customer-onboarding flow.
        </p>
      </div>
    </div>
  );
}
