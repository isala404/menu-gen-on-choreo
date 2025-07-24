export default function MenuItemCard({ item, onRegenerate }) {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <img
        src={item.generated_image_url}
        alt={item.item_text}
        className="w-full h-64 object-cover"
      />
      <div className="p-4">
        <h3 className="text-xl font-bold">{item.item_text}</h3>
        <p className="text-gray-600">{item.item_price}</p>
        <button
          onClick={() => onRegenerate(item.id)}
          className="mt-4 px-4 py-2 text-white font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg duration-150"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
}
