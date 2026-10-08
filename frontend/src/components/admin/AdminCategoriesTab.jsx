import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
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
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Manage Categories</h3>
          <p className="text-xs text-slate-500">Organize books into browseable topics</p>
        </div>
        <button
          onClick={handleOpenAddCategory}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E90FF] hover:bg-[#1873cc] text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Catalogue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const bookCount = books.filter((b) => b.category === cat.name).length;
          return (
            <Card
              key={cat.id || cat.name}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E90FF] flex items-center justify-center font-bold text-sm">
                    {cat.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-1 rounded-lg text-slate-400 hover:text-[#1E90FF] hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-base font-bold text-slate-900 mb-1">{cat.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {cat.description || 'No description provided for this category.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">{bookCount} eBook(s)</span>
                <Link
                  to={`/library?category=${encodeURIComponent(cat.name)}`}
                  className="text-[#1E90FF] hover:underline font-semibold"
                >
                  Browse →
                </Link>
              </div>
            </Card>
          );
        })}

        {categories.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No categories in the catalogue yet. Click "Add Catalogue" to create your first one.
          </div>
        )}
      </div>
    </div>
  );
}
