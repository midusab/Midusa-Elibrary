import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useFlashSale } from '../../context/FlashSaleContext';
import { formatPrice } from '../../utils/currency';

export default function FloatingCartButton() {
  const { cart, cartCount } = useCart();
  const { getDiscountedPrice } = useFlashSale();
  const location = useLocation();

  // Hide on cart and checkout pages, or when cart is empty
  if (cartCount === 0 || location.pathname === '/cart' || location.pathname === '/checkout') {
    return null;
  }

  const liveTotal = cart.reduce((sum, item) => {
    const flash = getDiscountedPrice(item);
    const price = flash ? flash.salePrice : (item.price || 0);
    return sum + price * (item.quantity || 1);
  }, 0);

  return (
    <aside
      aria-label="Floating cart preview"
      className="fixed bottom-6 left-4 sm:left-auto sm:right-24 z-[9985] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <Link
        to="/cart"
        className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 hover:bg-black text-white shadow-xl hover:shadow-2xl border border-white/20 backdrop-blur-md transition-all transform hover:scale-105 active:scale-95 group cursor-pointer"
        title="View Shopping Cart"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5 text-white" />
          <span className="absolute -top-1.5 -right-2 bg-[#1E90FF] text-white text-[10px] font-extrabold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
            {cartCount}
          </span>
        </div>
        <div className="text-xs font-bold flex items-center gap-1.5">
          <span>View Cart</span>
          <span className="text-slate-400">•</span>
          <span className="text-emerald-400 font-extrabold">{formatPrice(liveTotal)}</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </aside>
  );
}
