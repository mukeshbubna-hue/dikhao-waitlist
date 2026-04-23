import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CITIES = ['Kolkata','Guwahati','Asansol','Durgapur','Burdwan','Other'];

const Q1_OPTS = [
  ['Less than 10','10 से कम'],
  ['10–25 customers','10–25 ग्राहक'],
  ['25–50 customers','25–50 ग्राहक'],
  ['More than 50','50 से ज़्यादा'],
];
const Q3_OPTS = [
  ['Less than 5 minutes','5 मिनट से कम'],
  ['5–15 minutes','5–15 मिनट'],
  ['15–30 minutes','15–30 मिनट'],
  ['More than 30 minutes','30 मिनट से ज़्यादा'],
];
const Q4_OPTS = [
  ['Not sure how it will look stitched','सिला कपड़ा कैसा दिखेगा, पता नहीं'],
  ['Wants to ask family first','पहले घर में पूछना है'],
  ['Price is too high','दाम ज़्यादा लगा'],
  ['Did not find the right design','मनपसंद डिज़ाइन नहीं मिला'],
  ['Other','अन्य'],
];
const Q5_OPTS = [
  ['Yes, often','हाँ, अक्सर'],
  ['Sometimes','कभी-कभी'],
  ['Rarely','बहुत कम'],
  ['Almost never','लगभग कभी नहीं'],
];
const Q7_OPTS = [
  ['Yes, would start immediately','हाँ, तुरंत शुरू करूँगा'],
  ['Yes, but free trial first','हाँ, पहले मुफ़्त में देखना है'],
  ['Maybe — depends on image accuracy','शायद — तस्वीर कितनी सही है उस पर'],
  ['Unlikely','नहीं लगता'],
];
const Q8_OPTS = [
  ['Nothing — won\'t pay for software','कुछ नहीं — सॉफ्टवेयर के पैसे नहीं'],
  ['Up to ₹500/month','₹500 तक प्रति माह'],
  ['₹500–₹1,500/month','₹500–₹1,500 प्रति माह'],
  ['₹1,500–₹3,000/month','₹1,500–₹3,000 प्रति माह'],
  ['More than ₹3,000/month','₹3,000 से ज़्यादा'],
];

function RadioGroup({ name, opts, value, onChange }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {opts.map(([en, hi]) => (
        <label key={en} style={{
          display:'flex', alignItems:'flex-start', gap:10,
          padding:'10px 12px', border:`1.5px solid ${value===en ? '#C2620A' : '#e2ddd8'}`,
          borderRadius:10, cursor:'pointer', background: value===en ? '#fff8f3' : '#fff',
          transition:'all 0.15s'
        }}>
          <input type="radio" name={name} value={en} checked={value===en}
            onChange={() => onChange(en)}
            style={{ marginTop:3, accentColor:'#C2620A', flexShrink:0 }} />
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:'#1a1612' }}>{en}</div>
            <div style={{ fontSize:12, color:'#8a7f75', marginTop:2 }}>{hi}</div>
          </div>
        </label>
      ))}
    </div>
  );
}

function ScaleRow({ id, value, onChange, min=1, max=10 }) {
  const nums = [];
  for (let i = min; i <= max; i++) nums.push(i);
  return (
    <div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {nums.map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            width:40, height:40, border:`1.5px solid ${value===n ? '#C2620A' : '#e2ddd8'}`,
            borderRadius:8, background: value===n ? '#C2620A' : '#fff',
            color: value===n ? '#fff' : '#1a1612',
            fontSize:14, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s'
          }}>{n}</button>
        ))}
      </div>
    </div>
  );
}

function QCard({ num, en, hi, children }) {
  return (
    <div style={{
      background:'#fff', border:'1px solid #ede8e2', borderRadius:14,
      padding:'20px 24px', marginBottom:14
    }}>
      <div style={{ fontSize:11, color:'#b0a89e', marginBottom:6, letterSpacing:'0.5px' }}>Q{num}</div>
      <div style={{ fontSize:15, fontWeight:600, color:'#1a1612', lineHeight:1.4 }}>{en}</div>
      <div style={{ fontSize:13, color:'#8a7f75', marginTop:3, lineHeight:1.5 }}>{hi}</div>
      <div style={{ marginTop:14 }}>{children}</div>
    </div>
  );
}

export default function Survey({ prefill = {} }) {
  const [form, setForm] = useState({
    name: prefill.name || '',
    whatsapp: prefill.whatsapp || '',
    city: prefill.city || '',
    q1:'', q2:null, q3:'', q4:'', q5:'',
    q6:null, q7:'', q8:'', q9:''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.whatsapp || !form.city) {
      setError('Please fill name, WhatsApp number and city. / नाम, नंबर और शहर ज़रूरी है।');
      return;
    }
    setLoading(true);
    setError('');
    const { error: dbErr } = await supabase.from('survey_responses').insert({
      respondent_name: form.name,
      whatsapp: form.whatsapp,
      city: form.city,
      q1_footfall: form.q1,
      q2_leave_without: form.q2,
      q3_folding_time: form.q3,
      q4_main_reason: form.q4,
      q5_come_back: form.q5,
      q6_would_help: form.q6,
      q7_likelihood: form.q7,
      q8_willingness_pay: form.q8,
      q9_other_pain: form.q9,
    });
    setLoading(false);
    if (dbErr) { setError('Something went wrong. Please try again.'); return; }
    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{
      minHeight:'100vh', background:'#faf7f4', display:'flex',
      alignItems:'center', justifyContent:'center', padding:'2rem'
    }}>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{
          width:64, height:64, borderRadius:'50%', background:'#C2620A',
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 1.5rem', fontSize:28
        }}>✓</div>
        <div style={{ fontSize:22, fontWeight:700, color:'#1a1612', marginBottom:8 }}>
          Thank you! / धन्यवाद!
        </div>
        <div style={{ fontSize:14, color:'#8a7f75', lineHeight:1.6 }}>
          We'll WhatsApp you a free demo soon.<br />
          जल्द ही आपको मुफ़्त डेमो WhatsApp पर मिलेगा।
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#faf7f4', fontFamily:"'Lora', Georgia, serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Noto+Sans:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background:'#1a1612', padding:'1.5rem 1rem', textAlign:'center'
      }}>
        <div style={{ fontSize:28, fontWeight:700, color:'#fff', letterSpacing:-1 }}>
          Dik<span style={{ color:'#C2620A' }}>hao</span>
        </div>
        <div style={{ fontSize:13, color:'#a09590', marginTop:4, fontFamily:"'Noto Sans', sans-serif" }}>
          Store Survey · दुकान सर्वे
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'1.5rem 1rem 3rem' }}>

        {/* Intro */}
        <div style={{
          background:'#fff', border:'1px solid #ede8e2', borderRadius:14,
          padding:'20px 24px', marginBottom:14
        }}>
          <div style={{ fontSize:15, fontWeight:600, color:'#1a1612', lineHeight:1.4 }}>
            Help us build the right product for your store.
          </div>
          <div style={{ fontSize:13, color:'#8a7f75', marginTop:4, lineHeight:1.5 }}>
            अपनी दुकान के बारे में बताएं — हम आपके लिए सही चीज़ बनाएंगे। सिर्फ 3 मिनट।
          </div>
          <div style={{ marginTop:12, padding:'8px 12px', background:'#f3f0ec', borderRadius:8, fontSize:13, color:'#5a5048' }}>
            Filling for <strong>{form.name}</strong> · +91 {form.whatsapp} · {form.city}
          </div>
        </div>

        <QCard num={1}
          en="How many customers walk in on an average day?"
          hi="एक सामान्य दिन में कितने ग्राहक आते हैं?">
          <RadioGroup name="q1" opts={Q1_OPTS} value={form.q1} onChange={v => set('q1',v)} />
        </QCard>

        <QCard num={2}
          en="Out of 10 customers, how many leave WITHOUT buying?"
          hi="10 में से कितने ग्राहक बिना खरीदे चले जाते हैं?">
          <ScaleRow id="q2" value={form.q2} min={0} max={10} onChange={v => set('q2',v)} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#b0a89e', marginTop:6, fontFamily:"'Noto Sans',sans-serif" }}>
            <span>Nobody · कोई नहीं</span><span>Everyone · सब</span>
          </div>
        </QCard>

        <QCard num={3}
          en="Time spent folding clothes after a customer leaves without buying?"
          hi="ग्राहक बिना खरीदे जाए तो कपड़े तह करने में कितना वक्त?">
          <RadioGroup name="q3" opts={Q3_OPTS} value={form.q3} onChange={v => set('q3',v)} />
        </QCard>

        <QCard num={4}
          en="Main reason a customer leaves without buying?"
          hi="ग्राहक बिना खरीदे क्यों जाता है?">
          <RadioGroup name="q4" opts={Q4_OPTS} value={form.q4} onChange={v => set('q4',v)} />
        </QCard>

        <QCard num={5}
          en="Has a customer ever said 'will come back' and actually returned?"
          hi="क्या कोई 'सोचकर आता हूँ' कहकर वापस आया?">
          <RadioGroup name="q5" opts={Q5_OPTS} value={form.q5} onChange={v => set('q5',v)} />
        </QCard>

        <QCard num={6}
          en="If you could show a customer exactly how cloth looks on them — stitched — would that help close more sales? (1–10)"
          hi="अगर ग्राहक को सिला हुआ कपड़ा उन पर दिखा सकें — तो क्या बिक्री बढ़ेगी?">
          <ScaleRow id="q6" value={form.q6} min={1} max={10} onChange={v => set('q6',v)} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#b0a89e', marginTop:6, fontFamily:"'Noto Sans',sans-serif" }}>
            <span>Not at all · बिल्कुल नहीं</span><span>Definitely · ज़रूर</span>
          </div>
        </QCard>

        <QCard num={7}
          en="Staff takes 2 photos on any phone → AI sends result on WhatsApp in 20 seconds. How likely to use?"
          hi="2 फ़ोटो → AI 20 सेकंड में WhatsApp पर भेजता है। आप इस्तेमाल करेंगे?">
          <RadioGroup name="q7" opts={Q7_OPTS} value={form.q7} onChange={v => set('q7',v)} />
        </QCard>

        <QCard num={8}
          en="What would you pay per month if this genuinely helped sell more?"
          hi="अगर सच में ज़्यादा बिक्री हो तो महीने में कितना देंगे?">
          <RadioGroup name="q8" opts={Q8_OPTS} value={form.q8} onChange={v => set('q8',v)} />
        </QCard>

        <QCard num={9}
          en="Any other challenge technology could help solve in your store?"
          hi="कोई और परेशानी जो टेक्नोलॉजी से हल हो सकती है?">
          <textarea value={form.q9} onChange={e => set('q9', e.target.value)}
            placeholder="Type here... / यहाँ लिखें..."
            style={{
              width:'100%', padding:'10px 12px', border:'1.5px solid #e2ddd8',
              borderRadius:8, fontSize:13, fontFamily:"'Noto Sans',sans-serif",
              background:'#faf7f4', color:'#1a1612', resize:'vertical',
              minHeight:72, outline:'none', boxSizing:'border-box'
            }} />
        </QCard>

        {error && (
          <div style={{ background:'#fff3ef', border:'1px solid #f5c4b3', borderRadius:8,
            padding:'10px 14px', fontSize:13, color:'#993c1d', marginBottom:14,
            fontFamily:"'Noto Sans',sans-serif" }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{
          width:'100%', padding:'14px', background: loading ? '#b0a89e' : '#C2620A',
          color:'#fff', border:'none', borderRadius:10, fontSize:16,
          fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily:"'Lora', Georgia, serif", transition:'opacity 0.15s'
        }}>
          {loading ? 'Submitting... / जमा हो रहा है...' : 'Submit · जमा करें'}
        </button>
      </div>
    </div>
  );
}
