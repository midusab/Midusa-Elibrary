import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';
import Card from '../ui/Card';

export default function AdminCategoriesTab({
  categories,
  books,
  handleOpenAddCategory,
  handleOpenEditCategory,
  handleDeleteCategory
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200/90">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Manage Categories</h3>
          <p className="text-xs text-slate-500">Organize books into browseable topics</p>
        </div>
        <button
          onClick={handleOpenAddCategory}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1E90FF] hover:bg-[#1873cc] text-white text-xs font-semibold cursor-pointer transition-all"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const bookCount = books.filter((b) => b.category === cat.name).length;
          return (
            <Card
              key={cat.id || cat.name}
              className="overflow-hidden bg-white border border-slate-200/90 rounded-lg flex flex-col"
            >
              {/* Category image banner */}
              <div className="relative w-full h-28 bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiImage className="w-8 h-8 text-slate-300" />
                )}
                {/* Action buttons overlay */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditCategory(cat)}
                    className="p-1.5 rounded-md bg-white/90 text-slate-500 hover:text-[#1E90FF] shadow-sm transition-colors cursor-pointer"
                    title="Edit category"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 rounded-md bg-white/90 text-slate-500 hover:text-rose-600 shadow-sm transition-colors cursor-pointer"
                    title="Delete category"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{cat.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {cat.description || 'No description provided for this category.'}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{bookCount} Book(s)</span>
                  <Link
                    to={`/library?category=${encodeURIComponent(cat.name)}`}
                    className="text-[#1E90FF] hover:underline font-semibold"
                  >
                    Browse →
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}

        {categories.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No categories yet. Click "Add Category" to create your first one.
          </div>
        )}
      </div>
    </div>
  );
}
