import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BilingualLabel } from '../components/BilingualLabel';
import { BilingualButton } from '../components/BilingualButton';
import { PhotoUploadBox } from '../components/PhotoUploadBox';
import { ExistingPhotoBox } from '../components/ExistingPhotoBox';
import { searchByMobile, upsertCustomer } from '../api/customers';

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
      window.datafast?.(existing ? "customer_returned" : "customer_onboarded");
      navigate('/dashboard/customer/new/catalogue', {
        state: { customer: data.customer }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save customer.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-warm-white border border-plum/20 px-3 py-2.5 text-plum text-sm placeholder-plum/30 outline-none focus:border-plum focus:bg-ivory transition-colors font-body";

  return (
    <div className="min-h-screen bg-ivory">
      <div className="p-6 sm:p-10 max-w-md mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-plum/60 hover:text-plum text-sm mb-6 font-body"
        >
          ← {t('common.back')}
        </button>

        {existing ? (
          <>
            <p className="text-[10px] uppercase tracking-[0.25em] text-rose-gold-dim font-body">✨ Returning customer</p>
            <h1 className="font-display text-plum text-[32px] leading-tight mt-1 mb-1">Welcome back</h1>
            <p className="text-plum/60 text-sm mb-8 font-body">पुरानी ग्राहक · saved photo ready</p>
          </>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-[0.25em] text-plum/70 font-body">New customer</p>
            <h1 className="font-display text-plum text-[32px] leading-tight mt-1 mb-1">Register</h1>
            <p className="text-plum/60 text-sm mb-8 font-body">ग्राहक की जानकारी</p>
          </>
        )}

        <form onSubmit={next} className="space-y-5">
          <div>
            <BilingualLabel enKey="newCustomer.mobile" hiKey="newCustomer.mobile" />
            <div className="flex gap-2">
              <span className="bg-warm-white border border-plum/20 px-3 py-2.5 text-plum/60 text-sm font-body">+91</span>
              <input
                className={inputCls}
                type="tel" inputMode="numeric" maxLength={10}
                value={form.mobile} onChange={set('mobile')}
                placeholder="10-digit" required
              />
            </div>
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
            <div className="bg-rose-gold/20 border border-rose-gold p-4 text-sm text-plum font-body">
              <p>✨ Found her — {existing.name}</p>
              <p className="text-plum/70 text-xs mt-1">Saved photo ready. Skip to browsing — no need to re-take.</p>
              <p className="text-plum/60 text-xs mt-0.5">सुरक्षित फ़ोटो से काम चलेगा · फिर से फ़ोटो की ज़रूरत नहीं</p>
            </div>
          )}

          <div>
            <p className="text-plum text-[11px] uppercase tracking-[0.2em] font-body mb-1">Customer photo</p>
            <p className="text-plum/50 text-xs mb-3 font-body">कंधे, गर्दन और चेहरा · shoulders, neck and face</p>
            {hasExistingPhoto ? (
              <ExistingPhotoBox
                original={existing.photo_url}
                cleaned={existing.photo_clean_url}
                label="Saved photo"
                labelHi="सुरक्षित फ़ोटो"
                onValidFile={setPersonFile}
              />
            ) : (
              <>
                {/* Inline photo guidelines — what a good bust shot looks like */}
                <div className="bg-warm-white border border-plum/10 p-4 mb-3 text-[13px] font-body space-y-1.5">
                  <p className="text-plum">
                    <span className="text-status-green">✓</span> Wear a plain <b>white full-sleeve kurta</b>
                  </p>
                  <p className="text-plum">
                    <span className="text-status-green">✓</span> Face, neck, shoulders AND <b>both ears</b> visible
                  </p>
                  <p className="text-plum">
                    <span className="text-status-green">✓</span> Hair behind the ears — don't cover them
                  </p>
                  <p className="text-plum">
                    <span className="text-status-green">✓</span> Remove any jewellery on neck and ears
                  </p>
                  <p className="text-plum">
                    <span className="text-status-green">✓</span> Plain background, even lighting
                  </p>
                  <p className="text-plum">
                    <span className="text-status-green">✓</span> Looking straight at the camera
                  </p>
                  <p className="text-plum/60 text-[11px] mt-2">
                    सफ़ेद कुर्ता · चेहरा, गर्दन, कंधे, दोनों कान · बाल कान के पीछे · गहने उतारें
                  </p>
                </div>
                <PhotoUploadBox
                  type="person"
                  label="Bust-shot photo"
                  labelHi="कंधे तक की फ़ोटो"
                  required
                  onValidFile={setPersonFile}
                />
              </>
            )}
          </div>

          {error && <p className="text-red-800 text-xs font-body">{error}</p>}

          <BilingualButton
            enKey="newCustomer.next"
            hiKey="newCustomer.next"
            type="submit"
            disabled={!canSubmit}
            loadingText={loading ? 'Saving…' : null}
          />
        </form>
      </div>
    </div>
  );
}
