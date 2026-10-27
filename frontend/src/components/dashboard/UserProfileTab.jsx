import { Link } from 'react-router-dom';
import { FiUser, FiEdit3, FiSave } from 'react-icons/fi';
import Card from '../ui/Card';

export default function UserProfileTab({
  user,
  isAdmin,
  isEditingProfile,
  setIsEditingProfile,
  editName,
  setEditName,
  editAvatar,
  setEditAvatar,
  isSavingProfile,
  handleSaveProfile,
  handleStartEdit,
  profileStatusMsg,
  profileErrorMsg,
  purchasedBooks = [],
  favoriteBooks = []
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Overview Card */}
        <Card className="p-6 border border-slate-200/80 rounded-2xl bg-white shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FiUser className="text-[#1E90FF]" /> Profile Details
            </h2>
            {!isEditingProfile && (
              <button
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1E90FF] transition-colors cursor-pointer"
              >
                <FiEdit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileErrorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#F40009] text-xs font-semibold">
                  {profileErrorMsg}
                </div>
              )}
              {profileStatusMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#00A651] text-xs font-semibold">
                  {profileStatusMsg}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/25 focus:border-[#1E90FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/25 focus:border-[#1E90FF]"
                />
              </div>

              {/* Live Circular Avatar Preview */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                {editAvatar ? (
                  <img
                    src={editAvatar}
                    alt="Avatar preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-[#1E90FF]/30"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1E90FF] to-blue-400 text-white font-bold text-base flex items-center justify-center shadow-sm ring-2 ring-[#1E90FF]/30">
                    {editName?.[0]?.toUpperCase() || user.fullname?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 block">Avatar Preview</span>
                  <span className="text-[11px] text-slate-400">Rounded profile picture like modern apps</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E90FF] hover:bg-[#1C86EE] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  <FiSave className="w-3.5 h-3.5" />
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setEditName(user.fullname || '');
                    setEditAvatar(user.avatar || '');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                    Full Name
                  </span>
                  <span className="text-sm font-bold text-slate-900">{user.fullname}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                    Email Address
                  </span>
                  <span className="text-sm font-semibold text-slate-900 truncate block">{user.email}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                    Account Role
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold capitalize ${isAdmin ? 'text-amber-700' : 'text-slate-900'}`}>
                      {isAdmin ? 'Platform Administrator' : 'Library Reader'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                    Account Status
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active & Verified
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Info & Stats Card */}
        <div className="space-y-4">
          <Card className="p-6 border border-slate-200/80 rounded-2xl bg-white shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Library Summary
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-500">Books Purchased</span>
                <span className="font-bold text-slate-900">{purchasedBooks.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-500">Saved Wishlist</span>
                <span className="font-bold text-slate-900">{favoriteBooks.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Currency</span>
                <span className="font-bold text-slate-900">Kenyan Shillings (KSh)</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <Link to="/library">
                <button className="w-full py-2 px-3 rounded-xl bg-[#1E90FF]/10 hover:bg-[#1E90FF]/20 text-[#1E90FF] text-xs font-bold transition-colors cursor-pointer">
                  Explore Book Catalog →
                </button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
