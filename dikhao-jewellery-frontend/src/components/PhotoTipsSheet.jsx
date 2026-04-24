export function PhotoTipsSheet({ onOpenCamera, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-plum/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-ivory border-t sm:border border-plum/10 sm:max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-plum/20 mx-auto sm:hidden mb-4" />

        <p className="font-display text-plum text-[22px] mb-1">Customer photo</p>
        <p className="text-plum/60 text-xs mb-4 font-body">ग्राहक की फ़ोटो — कंधे, गर्दन और चेहरा</p>

        <ul className="space-y-2.5 mb-6">
          {[
            ['✓ Wear a plain white full-sleeve kurta', 'सादा सफ़ेद कुर्ता, पूरी बाज़ू'],
            ['✓ Face, neck, shoulders AND both ears visible', 'चेहरा, गर्दन, कंधे और दोनों कान दिखें'],
            ['✓ Hair behind the ears — ears not covered', 'बाल कान के पीछे — कान ढँके नहीं'],
            ['✓ Plain, well-lit background', 'सादी दीवार, अच्छी रोशनी'],
            ['✓ Looking straight at the camera', 'सीधे camera की तरफ़ देखें'],
            ['✓ Remove existing jewellery on neck / ears', 'गर्दन और कान में पहने गहने उतार दें'],
            ['✗ No harsh shadows', 'तेज़ shadow नहीं'],
            ['✗ No sunglasses or face cover', 'चश्मा या मास्क नहीं'],
            ['✗ Not too close, not too far', 'बहुत पास या बहुत दूर नहीं'],
          ].map(([en, hi], i) => (
            <li key={i} className={`text-sm font-body ${en.startsWith('✓') ? 'text-status-green' : 'text-status-red'}`}>
              <div>{en}</div>
              <div className="text-plum/50 text-xs">{hi}</div>
            </li>
          ))}
        </ul>

        <button
          onClick={onOpenCamera}
          type="button"
          className="w-full py-3 bg-plum text-ivory font-body text-sm hover:bg-plum-dim transition-colors"
        >
          Open camera · कैमरा खोलें
        </button>
      </div>
    </div>
  );
}
