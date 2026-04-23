import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BilingualLabel } from '../components/BilingualLabel';
import { BilingualButton } from '../components/BilingualButton';
import { searchByMobile } from '../api/customers';

function Steps({ step }) {
  return (
    <div className="flex gap-2 mb-6">
      <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-brand-gold' : 'bg-white/20'}`} />
      <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-brand-gold' : 'bg-white/20'}`} />
    </div>
  );
}

export default function NewCustomerStep1() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', mobile: '' });
  const [existing, setExisting] = useState(null);
  const [error, setError] = useState('');

  const set = (k) => async (e) => {
    const value = e.target.value;
    setForm(f => ({ ...f, [k]: value }));
    setError('');
    if (k === 'mobile' && /^\d{10}$/.test(value)) {
      try {
        const { data } = await searchByMobile(value);
        if (data.customer) {
          setExisting(data.customer);
          setForm(f => ({ ...f, name: data.customer.name }));
        } else {
          setExisting(null);
        }
      } catch {}
    }
  };

  const next = (e) => {
    e.preventDefault();
    if (!form.name || !/^\d{10}$/.test(form.mobile)) {
      setError('Enter a valid name and 10-digit mobile.');
      return;
    }
    navigate('/dashboard/customer/new/photos', { state: { customer: form, existing } });
  };

  const inputCls = "w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 outline-none focus:border-brand-gold/70";

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-white/60 hover:text-white text-sm mb-4">← {t('common.back')}</button>

      <Steps step={1} />

      <h1 className="font-heading font-bold text-white text-xl mb-5">{t('newCustomer.step1Title')}</h1>

      <form onSubmit={next} className="space-y-4">
        <div>
          <BilingualLabel enKey="newCustomer.customerName" hiKey="newCustomer.customerName" />
          <input className={inputCls} value={form.name} onChange={set('name')} placeholder="Customer name" required />
        </div>
        <div>
          <BilingualLabel enKey="newCustomer.mobile" hiKey="newCustomer.mobile" />
          <div className="flex gap-2">
            <span className="bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white/60 text-sm">+91</span>
            <input className={inputCls} type="tel" inputMode="numeric" maxLength={10} value={form.mobile} onChange={set('mobile')} placeholder="10-digit" required />
          </div>
          <p className="text-white/40 text-xs mt-1.5">{t('newCustomer.mobileHint')}</p>
        </div>

        {existing && (
          <div className="bg-brand-purple/15 border border-brand-purple/30 rounded-lg p-3 text-xs text-brand-purple-mid">
            ℹ {t('newCustomer.existingNotice')}
          </div>
        )}

        {error && <p className="text-red-300 text-xs">{error}</p>}

        <BilingualButton enKey="newCustomer.next" hiKey="newCustomer.next" type="submit" />
      </form>
    </div>
  );
}
