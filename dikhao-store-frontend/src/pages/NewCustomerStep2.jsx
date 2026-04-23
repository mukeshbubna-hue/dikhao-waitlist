import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PhotoUploadBox } from '../components/PhotoUploadBox';
import { ExistingPhotoBox } from '../components/ExistingPhotoBox';
import { BilingualButton } from '../components/BilingualButton';
import { upsertCustomer } from '../api/customers';
import { startTryOn } from '../api/tryon';

function Steps({ step }) {
  return (
    <div className="flex gap-2 mb-6">
      <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-brand-purple' : 'bg-white/20'}`} />
      <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-brand-gold' : 'bg-white/20'}`} />
    </div>
  );
}

export default function NewCustomerStep2() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  const customer = state?.customer;
  const existing = state?.existing;

  const hasExistingPhoto = !!existing?.photo_url;

  const [personFile,  setPersonFile]  = useState(null);
  const [shirtFile,   setShirtFile]   = useState(null);
  const [trouserFile, setTrouserFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!customer) { navigate('/dashboard/customer/new', { replace: true }); return null; }

  // Customer photo step is satisfied either by a newly uploaded file
  // or by an existing stored photo we'll reuse.
  const personReady = personFile || hasExistingPhoto;
  const canSubmit = personReady && (shirtFile || trouserFile) && !loading;

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      // 1. Upsert customer — photo is optional if we already have one
      const { data: custRes } = await upsertCustomer({
        name: customer.name,
        mobile: customer.mobile,
        photoFile: personFile, // null = reuse existing on backend
      });

      // 2. Start try-on session
      const { data: sessionRes } = await startTryOn({
        customerId: custRes.customer.id,
        shirtFile,
        trouserFile,
      });

      navigate(`/dashboard/tryon/${sessionRes.sessionId}`);
    } catch (err) {
      if (err.response?.data?.error === 'TRYON_LIMIT_REACHED') {
        navigate('/dashboard/plan', { state: { reason: 'limit' } });
      } else {
        setError(err.response?.data?.error || 'Could not start try-on.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white text-sm mb-4">← {t('common.back')}</button>

      <Steps step={2} />

      <h1 className="font-heading font-bold text-white text-xl mb-1">{t('newCustomer.step2Title')}</h1>
      <p className="text-white/50 text-xs mb-6">For <span className="text-white">{customer.name}</span> · +91 {customer.mobile}</p>

      <div className="space-y-3 mb-6">
        {hasExistingPhoto ? (
          <ExistingPhotoBox
            photoUrl={existing.photo_url}
            label={t('photos.customerPhoto')}
            labelHi={t('photos.customerSub')}
            onValidFile={setPersonFile}
          />
        ) : (
          <PhotoUploadBox
            type="person"
            label={t('photos.customerPhoto')}
            labelHi={t('photos.customerSub')}
            required
            onValidFile={setPersonFile}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <PhotoUploadBox
            type="cloth"
            label={t('photos.shirt')}
            labelHi="शर्ट"
            onValidFile={setShirtFile}
          />
          <PhotoUploadBox
            type="cloth"
            label={t('photos.trouser')}
            labelHi="ट्राउज़र"
            onValidFile={setTrouserFile}
          />
        </div>
      </div>

      {error && <p className="text-red-300 text-xs mb-3">{error}</p>}

      <BilingualButton
        enKey="photos.cta"
        hiKey="photos.cta"
        onClick={handleSubmit}
        disabled={!canSubmit}
        loadingText={loading ? 'Starting…' : null}
      />
    </div>
  );
}
