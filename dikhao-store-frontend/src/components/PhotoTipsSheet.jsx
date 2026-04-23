export function PhotoTipsSheet({ type, onOpenCamera, onClose }) {
  // type: 'person' | 'cloth'
  const personTips = [
    ['✓ Full body — head to feet visible', 'सिर से पैर तक पूरा दिखे'],
    ['✓ Even lighting, no harsh shadows', 'एक जैसी रोशनी, shadow नहीं'],
    ['✓ Plain wall behind customer', 'सादी दीवार के सामने खड़े हों'],
    ['✓ Stand 1–2 metres away', '1-2 मीटर की दूरी से लें'],
    ['✗ Not too dark', 'बहुत अंधेरा नहीं'],
    ['✗ Not backlit', 'पीछे से रोशनी नहीं'],
    ['✗ Not blurry', 'blur नहीं'],
  ];
  const clothTips = [
    ['✓ Flat on table or on hanger', 'मेज़ पर बिछाएं या hanger पर'],
    ['✓ Full cloth visible, no folding', 'पूरा कपड़ा दिखे, मुड़ा नहीं'],
    ['✓ White or light background', 'सफ़ेद या हल्के रंग की background'],
    ['✗ Not crumpled', 'सिकुड़ा नहीं'],
    ['✗ Not partially cut off', 'आधा नहीं'],
  ];
  const tips = type === 'person' ? personTips : clothTips;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-brand-navy border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto sm:hidden mb-4" />
        <p className="font-heading font-bold text-white text-lg mb-1">
          {type === 'person' ? 'Customer photo' : 'Cloth photo'}
        </p>
        <p className="text-white/50 text-xs mb-4">
          {type === 'person' ? 'ग्राहक की फ़ोटो' : 'कपड़े की फ़ोटो'}
        </p>

        <ul className="space-y-2.5 mb-6">
          {tips.map(([en, hi], i) => (
            <li key={i} className={`text-sm ${en.startsWith('✓') ? 'text-status-green' : 'text-status-red'}`}>
              <div>{en}</div>
              <div className="text-white/50 text-xs">{hi}</div>
            </li>
          ))}
        </ul>

        <button
          onClick={onOpenCamera}
          className="w-full py-3 rounded-xl bg-brand-gold text-brand-navy font-bold text-sm hover:bg-yellow-400"
        >
          Open Camera · कैमरा खोलें
        </button>
      </div>
    </div>
  );
}
