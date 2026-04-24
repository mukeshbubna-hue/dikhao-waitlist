export default function Placeholder({ title = 'Coming soon', subtitle = 'जल्द ही आ रहा है' }) {
  return (
    <div className="p-6 max-w-md mx-auto text-center pt-24">
      <div className="text-4xl mb-4">🚧</div>
      <h1 className="font-display text-plum text-[24px] mb-1">{title}</h1>
      <p className="text-plum/60 text-sm font-body">{subtitle}</p>
    </div>
  );
}
