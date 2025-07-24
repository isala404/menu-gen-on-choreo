import MenuItemCard from './MenuItemCard';

export default function MenuResultsView({ menu, onRegenerate }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Visual Menu</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {menu.items.map((item) => (
          <MenuItemCard key={item.id} item={item} onRegenerate={onRegenerate} />
        ))}
      </div>
    </div>
  );
}
