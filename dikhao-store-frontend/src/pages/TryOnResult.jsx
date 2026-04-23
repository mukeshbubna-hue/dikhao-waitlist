import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getStatus, markSent } from '../api/tryon';
import { getCustomer } from '../api/customers';

export default function TryOnResult() {
  const { t } = useTranslation();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    getStatus(sessionId).then(async r => {
      setData(r.data);
      if (r.data.customerId) {
        const c = await getCustomer(r.data.customerId);
        setCustomer(c.data.customer);
      }
    });
  }, [sessionId]);

  // Fallback: fetch customer from session's sessions/today if we didn't get ID from status
  // For now, keep it simple — customer name passed via localStorage or rendered from customers fetch later.

  const share = () => {
    const name = customer?.name || 'Sir';
    const mobile = customer?.mobile || '';
    const storeName = JSON.parse(localStorage.getItem('dikhao_store') || '{}').store_name || 'Dikhao';
    const msg = `नमस्ते ${name} ji, देखिए यह कपड़ा आप पर कैसा दिखता है! 👔\nHello ${name}, see how this outfit looks on you!\n— ${storeName}\n\n👇 Tap to view & save (valid 24 hours):\n${data.shareUrl}\n\n⏰ Save before it expires · 24 घंटे में save करें`;
    const phone = `91${mobile}`;
    const encoded = encodeURIComponent(msg);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const url = isMobile
      ? `https://wa.me/${phone}?text=${encoded}`
      : `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;
    window.open(url, '_blank');
    setTimeout(() => markSent(sessionId).catch(() => {}), 3000);
  };

  if (!data) return <div className="p-6 text-white/60">Loading…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="grid lg:grid-cols-[1fr,360px] gap-6">

        {/* Image */}
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 bg-brand-gold text-brand-navy text-[11px] font-bold px-3 py-1 rounded-full mb-3">
            ✨ {t('result.badge')}
          </div>
          <img src={data.resultUrl} alt="Try-on result" className="w-full rounded-2xl aspect-[3/4] object-cover bg-white/5" />
        </div>

        {/* Action panel */}
        <div>
          <div className="mb-5">
            <p className="text-white text-lg font-heading font-bold">{customer?.name}</p>
            <p className="text-white/40 text-sm font-mono">+91 {customer?.mobile}</p>
          </div>

          <div className="border border-status-green/30 rounded-2xl p-4 bg-status-green/[0.05] mb-5">
            <p className="text-white/80 text-xs font-semibold mb-2">{t('result.shareTitle')}</p>
            <div className="text-white/50 text-xs italic mb-3 leading-relaxed">
              "नमस्ते {customer?.name} ji, देखिए यह कपड़ा आप पर कैसा दिखता है! 👔<br/>
              Hello {customer?.name}, see how this outfit looks on you!"
            </div>
            <button onClick={share} className="w-full py-3 rounded-xl bg-status-green text-white font-bold text-sm">
              📲 {t('result.waButton')}
            </button>
            <p className="text-white/40 text-xs text-center mt-2">{t('result.waNote')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={() => navigate('/dashboard/customer/new/clothes', { state: { customer } })}
              className="py-2.5 rounded-xl border border-white/15 text-white text-xs font-semibold hover:bg-white/5">
              {t('result.tryAnother')}
            </button>
            <Link to="/dashboard/customer/new" className="text-center py-2.5 rounded-xl border border-white/15 text-white text-xs font-semibold hover:bg-white/5">
              {t('result.newCustomer')}
            </Link>
          </div>

          <p className="text-white/35 text-xs text-center">{t('result.deleteNote')}</p>
        </div>
      </div>
    </div>
  );
}
