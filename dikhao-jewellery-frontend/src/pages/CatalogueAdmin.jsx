import { useState, useEffect } from 'react';
import { listProducts, createProduct, deleteProduct } from '../api/catalogue';
import { compressImage } from '../utils/imageCompress';

const CATEGORIES = [
  { id: 'necklace', label: 'Necklace',       photoTip: 'Lay flat in a U-shape. Show the chain arc — that tells the AI where the neckline sits.' },
  { id: 'earrings', label: 'Earrings',       photoTip: 'Show the PAIR side-by-side, hanging orientation (pointy end down). Even for studs.' },
  { id: 'choker',   label: 'Choker',         photoTip: 'Show the full circular outline flat. The small diameter tells the AI it sits high on the neck — not a long necklace.' },
  { id: 'pendant',  label: 'Pendant',        photoTip: 'Include the FULL chain. The chain length determines how low the pendant hangs on the customer.' },
  { id: 'borla',    label: 'Borla / Tikka',  photoTip: 'Photograph hanging as worn — chain at top, ornament pointing down. This is worn on the hair parting.' },
  { id: 'nath',     label: 'Nath',           photoTip: 'Show the full outline of the ring. If there is a side chain to the ear, include its full length in the frame.' },
];

function priceBandLabel(price) {
  if (price < 25_000)   return 'Under ₹25k';
  if (price < 75_000)   return '₹25k–75k';
  if (price < 200_000)  return '₹75k–2L';
  if (price < 500_000)  return '₹2L–5L';
  return '₹5L+';
}

function formatPrice(p) {
  return `₹${Number(p).toLocaleString('en-IN')}`;
}

export default function CatalogueAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const [photoFile, setPhotoFile]       = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [price, setPrice]       = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data } = await listProducts();
      setProducts(data.products || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load catalogue.');
    } finally {
      setLoading(false);
    }
  }

  function onPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPrice('');
    setCategory('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!photoFile || !price || !category) {
      setError('Photo, price and category are required.');
      return;
    }
    setSaving(true);
    try {
      const compressed = await compressImage(photoFile);
      console.log(`[catalogue] original=${photoFile.size}B → compressed=${compressed.size}B`);
      await createProduct({
        photoFile: compressed,
        price: Number(price),
        category,
      });
      window.datafast?.("piece_added");
      resetForm();
      // Background removal now runs synchronously inside the backend request,
      // so a single fetch here is enough — the returned product has the clean URL.
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not add piece.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Hide this piece from the catalogue?')) return;
    try {
      await deleteProduct(id);
      window.datafast?.("piece_hidden");
      fetchProducts();
    } catch {
      setError('Could not hide piece.');
    }
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="max-w-[1100px] mx-auto px-6 sm:px-10 py-10">

        {/* Header */}
        <header className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.25em] text-plum/70">Catalogue</p>
          <h1 className="font-display text-plum text-[36px] leading-tight mt-1">Your pieces</h1>
        </header>

        {/* Add form */}
        <form onSubmit={onSubmit} className="bg-warm-white border border-plum/10 p-6 sm:p-8 mb-12">
          <h2 className="font-display text-plum text-[22px] mb-6">Add a piece</h2>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* Photo */}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-plum/70 mb-2">Photo</label>
              <label className="relative block w-full aspect-square border border-dashed border-plum/30 bg-ivory cursor-pointer overflow-hidden hover:border-plum/60 transition-colors">
                {photoPreview ? (
                  <img src={photoPreview} alt="preview" className="absolute inset-0 w-full h-full object-contain" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-ink-soft">
                    <span className="text-[32px]">📷</span>
                    <span className="text-[13px] mt-2">Tap to upload</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
              </label>
            </div>

            {/* Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-plum/70 mb-2">Price (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="48500"
                  className="w-full px-4 py-3.5 bg-ivory border border-plum/20 text-plum font-body text-[15px] focus:outline-none focus:border-plum"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-plum/70 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`px-4 py-2 text-[12px] uppercase tracking-[0.08em] border transition-colors ${
                        category === c.id
                          ? 'bg-plum text-ivory border-plum'
                          : 'bg-ivory text-plum border-plum/20 hover:border-plum/60'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                {category && (
                  <div className="mt-3 p-3 bg-ivory border border-rose-gold/30 text-[12px] font-body text-plum">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-rose-gold-dim mb-1">📸 Photo tip for this category</p>
                    {CATEGORIES.find(c => c.id === category)?.photoTip}
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && <p className="mt-5 text-[13px] text-red-800 font-body">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-8 inline-flex items-center gap-2 bg-plum text-ivory px-8 py-3.5 text-[12px] uppercase tracking-[0.15em] hover:bg-plum-dim transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving… (removing background, ~20s)' : 'Add piece'}
          </button>
        </form>

        {/* Grid */}
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-plum text-[22px]">
              {loading ? 'Loading…' : `${products.length} ${products.length === 1 ? 'piece' : 'pieces'}`}
            </h2>
          </div>

          {!loading && products.length === 0 && (
            <p className="text-ink-soft text-[14px]">No pieces yet. Add your first piece above.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => (
              <div key={p.id} className="bg-warm-white border border-plum/10 group">
                <div className="aspect-square overflow-hidden bg-warm-white">
                  <img src={p.photo_url} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-plum/70">
                    {CATEGORIES.find(c => c.id === p.category)?.label || p.category}
                  </p>
                  <p className="font-display text-plum text-[16px] leading-tight mt-1">{formatPrice(p.price)}</p>
                  <p className="text-[11px] text-ink-soft">{priceBandLabel(p.price)}</p>
                  <button
                    onClick={() => onDelete(p.id)}
                    className="mt-2 text-[11px] text-red-800/70 hover:text-red-800 transition-colors"
                  >
                    Hide piece
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
