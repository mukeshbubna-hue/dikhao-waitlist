// Generic "coming soon" placeholder for pages we haven't built yet
export default function Placeholder({ title = 'Coming soon', subtitle = 'जल्द ही आ रहा है' }) {
  return (
    <div className="p-6 max-w-md mx-auto text-center pt-24">
      <div className="text-4xl mb-4">🚧</div>
      <h1 className="font-heading font-bold text-white text-xl mb-1">{title}</h1>
      <p className="text-white/50 text-sm">{subtitle}</p>
    </div>
  );
}
