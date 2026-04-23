import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BilingualLabel } from '../components/BilingualLabel';
import { BilingualButton } from '../components/BilingualButton';
import { PhotoUploadBox } from '../components/PhotoUploadBox';
import { ExistingPhotoBox } from '../components/ExistingPhotoBox';
import { searchByMobile, upsertCustomer } from '../api/customers';

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
  const location = useLocation();
  const prefillMobile = location.state?.prefillMobile;
  const [form, setForm] = useState({ name: '', mobile: prefillMobile || '' });
  const [existing, setExisting] = useState(null);
  const [personFile, setPersonFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (prefillMobile && /^\d{10}$/.test(prefillMobile)) {
      searchByMobile(prefillMobile).then(({ data }) => {
        if (data.customer) {
          setExisting(data.customer);
          setForm(f => ({ ...f, name: data.customer.name }));
        }
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    } else if (k === 'mobile' && !/^\d{10}$/.test(value)) {
      setExisting(null);
    }
  };

  const hasExistingPhoto = !!existing?.photo_url;
  const photoReady = personFile || hasExistingPhoto;
  const canSubmit = form.name && /^\d{10}$/.test(form.mobile) && photoReady && !loading;

  const next = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await upsertCustomer({
        name: form.name,
        mobile: form.mobile,
        photoFile: personFile,
      });
      navigate('/dashboard/customer/new/clothes', {
        state: { customer: data.customer }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save customer.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 outline-none focus:border-brand-gold/70";

  return (
    <div className="p-4 sm:p-6 max-w-md mx-auto">
      <button onClick={() => navigate('/dashboard')} className="text-white/60 hover:text-white text-sm mb-4">← {t('common.back')}</button>

      <Steps step={1} />

      <h1 className="font-heading font-bold text-white text-xl mb-1">Customer details</h1>
      <p className="text-white/50 text-xs mb-5">ग्राहक की जानकारी</p>

      <form onSubmit={next} className="space-y-4">
        <div>
          <BilingualLabel enKey="newCustomer.mobile" hiKey="newCustomer.mobile" />
          <div className="flex gap-2">
            <span className="bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white/60 text-sm">+91</span>
            <input
              className={inputCls}
              type="tel" inputMode="numeric" maxLength={10}
              value={form.mobile} onChange={set('mobile')}
              placeholder="10-digit" required
            />
          </div>
          <p className="text-white/40 text-xs mt-1.5">{t('newCustomer.mobileHint')}</p>
        </div>

        <div>
          <BilingualLabel enKey="newCustomer.customerName" hiKey="newCustomer.customerName" />
          <input
            className={inputCls}
            value={form.name} onChange={set('name')}
            placeholder="Customer name" required
          />
        </div>

        {existing && (
          <div className="bg-brand-purple/15 border border-brand-purple/30 rounded-lg p-3 text-xs text-brand-purple-mid">
            ℹ {t('newCustomer.existingNotice')}
          </div>
        )}

        <div>
          <p className="text-white/80 text-[11px] font-semibold uppercase tracking-wider mb-1">Customer photo</p>
          <p className="text-white/50 text-xs mb-2">पूरी लंबाई में · full length, head to feet</p>
          {hasExistingPhoto ? (
            <ExistingPhotoBox
              photoUrl={existing.photo_url}
              label="Saved photo"
              labelHi="सुरक्षित फ़ोटो"
              onValidFile={setPersonFile}
            />
          ) : (
            <PhotoUploadBox
              type="person"
              label="Full length photo"
              labelHi="पूरी लंबाई की फ़ोटो"
              required
              onValidFile={setPersonFile}
            />
          )}
        </div>

        {error && <p className="text-red-300 text-xs">{error}</p>}

        <BilingualButton
          enKey="newCustomer.next"
          hiKey="newCustomer.next"
          type="submit"
          disabled={!canSubmit}
          loadingText={loading ? 'Saving…' : null}
        />
      </form>
    </div>
  );
}
