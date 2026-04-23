export function PhotoTipsSheet({ type, onOpenCamera, onClose }) {
  const isCloth = type === 'cloth';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-brand-navy border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto sm:hidden mb-4" />

        {isCloth ? <ClothTips /> : <PersonTips />}

        <button
          onClick={onOpenCamera}
          className="w-full py-3 rounded-xl bg-brand-gold text-brand-navy font-bold text-sm hover:bg-yellow-400 mt-2"
        >
          Open Camera · कैमरा खोलें
        </button>
      </div>
    </div>
  );
}

function PersonTips() {
  const tips = [
    ['✓ Full body — head to feet visible', 'सिर से पैर तक पूरा दिखे'],
    ['✓ Even lighting, no harsh shadows', 'एक जैसी रोशनी, shadow नहीं'],
    ['✓ Plain wall behind customer', 'सादी दीवार के सामने खड़े हों'],
    ['✓ Stand 1–2 metres away', '1-2 मीटर की दूरी से लें'],
    ['✗ Not too dark', 'बहुत अंधेरा नहीं'],
    ['✗ Not backlit', 'पीछे से रोशनी नहीं'],
    ['✗ Not blurry', 'blur नहीं'],
  ];
  return (
    <>
      <p className="font-heading font-bold text-white text-lg mb-1">Customer photo</p>
      <p className="text-white/50 text-xs mb-4">ग्राहक की फ़ोटो</p>
      <ul className="space-y-2.5 mb-6">
        {tips.map(([en, hi], i) => (
          <li key={i} className={`text-sm ${en.startsWith('✓') ? 'text-status-green' : 'text-status-red'}`}>
            <div>{en}</div>
            <div className="text-white/50 text-xs">{hi}</div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ClothTips() {
  return (
    <>
      <p className="font-heading font-bold text-white text-lg mb-1">Cloth photo</p>
      <p className="text-white/50 text-xs mb-4">कपड़े की फ़ोटो</p>

      {/* THE critical rule, shown loudly */}
      <div className="bg-status-red/15 border border-status-red/40 rounded-xl p-4 mb-4">
        <p className="text-status-red text-sm font-bold mb-1">⚠ The shirt SHAPE must be visible</p>
        <p className="text-status-red/80 text-xs mb-2">कमीज़ का आकार दिखना ज़रूरी है</p>
        <p className="text-white/70 text-xs leading-relaxed">
          If you photograph a <strong className="text-white">folded piece of fabric</strong>, the AI
          will invent a long gown-like garment. Always show the shirt on a hanger or flat-laid
          with the <strong className="text-white">collar and sleeves clearly visible</strong>.
        </p>
        <p className="text-white/50 text-xs mt-1.5">मुड़ा हुआ कपड़ा AI को समझ नहीं आता। Hanger पर या सीधा बिछाकर कमीज़ की पूरी शक्ल दिखाएं।</p>
      </div>

      {/* Good examples */}
      <p className="text-status-green text-xs font-bold uppercase tracking-wider mb-2">✓ Do</p>
      <ul className="space-y-2 mb-4">
        {[
          ['Hang the shirt on a hanger — sleeves spread out', 'Hanger पर — बाज़ू फैलाकर'],
          ['Or lay flat with sleeves fully extended', 'या सीधा बिछाकर, बाज़ू खोलकर'],
          ['Collar, buttons, and full shirt outline visible', 'कॉलर, बटन, पूरा आकार दिखे'],
          ['Plain white or light-coloured background', 'सफ़ेद या हल्के रंग की background'],
        ].map(([en, hi], i) => (
          <li key={i} className="text-sm text-white/80">
            <div>{en}</div>
            <div className="text-white/45 text-xs">{hi}</div>
          </li>
        ))}
      </ul>

      {/* Bad examples */}
      <p className="text-status-red text-xs font-bold uppercase tracking-wider mb-2">✗ Don't</p>
      <ul className="space-y-2 mb-6">
        {[
          ['Don\'t photograph crumpled fabric on the floor', 'ज़मीन पर सिकुड़ा कपड़ा नहीं'],
          ['Don\'t fold or bunch the shirt up', 'मुड़ा हुआ कपड़ा नहीं'],
          ['Don\'t cut off sleeves or collar from frame', 'बाज़ू या कॉलर आधा नहीं'],
          ['Don\'t photograph with busy background', 'रंग-बिरंगी background नहीं'],
        ].map(([en, hi], i) => (
          <li key={i} className="text-sm text-white/80">
            <div>{en}</div>
            <div className="text-white/45 text-xs">{hi}</div>
          </li>
        ))}
      </ul>
    </>
  );
}
