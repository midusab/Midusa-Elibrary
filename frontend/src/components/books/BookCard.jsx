import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart, Check, Flame } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useFlashSale } from '../../context/FlashSaleContext';
import { recordBookClick } from '../../services/api';
import { resolveCoverUrl, DEFAULT_BOOK_COVER } from '../../utils/imageUrl';

/**
 * Reusable StarRating component
 */
function StarRating({ rating = 5, count }) {
  const numRating = Number(rating) || 5;
  const full = Math.floor(numRating);
  const frac = numRating - full;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center text-amber-400">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${
              i < full
                ? 'fill-amber-400 text-amber-400'
                : i === full && frac >= 0.5
                ? 'fill-amber-400/60 text-amber-400'
                : 'text-slate-300'
            }`}
          />
        ))}
      </div>
      <span className="text-[11px] font-bold text-slate-700 ml-0.5">
        {numRating.toFixed(1)}
      </span>
      {count && <span className="text-[10px] text-slate-400">({count})</span>}
    </div>
  );
}

/**
 * Standardized BookCard Component
 * Ensures 100% visual and size consistency between the Library catalogue,
 * Hero carousels, and related books shelves.
 */
export default function BookCard({ book, onAddToCart }) {
  const [added, setAdded] = useState(false);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isLive, isBookInFlashSale, getDiscountedPrice } = useFlashSale();

  if (!book) return null;

  // Check if book participates in active flash sale
  const isFlash = Boolean(isLive && isBookInFlashSale && isBookInFlashSale(book.id));
  const flashPricing = isFlash && getDiscountedPrice ? getDiscountedPrice(book) : null;

  const finalPrice = flashPricing ? flashPricing.salePrice : book.price;
  const finalOriginalPrice = flashPricing
    ? flashPricing.originalPrice
    : book.originalPrice || book.price;
  const hasDiscount =
    Boolean(flashPricing) ||
    (Number(book.discountPercent) > 0 && finalOriginalPrice > finalPrice);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Always store the canonical DB price so the backend M-Pesa charge
    // always matches the displayed amount.  Flash-sale display is handled
    // by FlashSaleContext at render time everywhere, not in stored cart data.
    const itemToAdd = {
      ...book,
      price: book.price,         // real DB price
      originalPrice: book.price,
      discountPercent: 0,
      isFlashSale: false,
    };

    if (onAddToCart) {
      onAddToCart(itemToAdd);
    } else {
      addToCart(itemToAdd);
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Link
      to={`/book/${book.id}`}
      onClick={() => {
        if (book.id) recordBookClick(book.id);
      }}
      className="group flex flex-col liquid-glass-card specular-sheen rounded-2xl overflow-hidden h-full relative select-none"
    >
      {/* Cover Image Container */}
      <div className="relative bg-slate-100 flex items-center justify-center overflow-hidden aspect-[3/4]">
        <img
          src={resolveCoverUrl(book.coverImage)}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_BOOK_COVER;
          }}
        />

        {/* Wishlist Heart Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(book);
          }}
          aria-label={isInWishlist(book.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-2 right-2 p-1.5 rounded-xl backdrop-blur-md transition-all cursor-pointer z-10 ${
            isInWishlist(book.id)
              ? 'bg-white text-[#F40009] shadow-sm'
              : 'bg-black/35 text-white hover:bg-white hover:text-[#F40009]'
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 ${
              isInWishlist(book.id) ? 'fill-[#F40009]' : ''
            }`}
          />
        </button>

        {/* Badges: Flash Sale, #1 Best, Featured, -% Discount */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isFlash && flashPricing ? (
            <span className="bg-[#F40009] text-white text-[9px] font-black px-1.5 py-0.5 rounded-xl tracking-wider shadow-xs flex items-center gap-0.5 animate-pulse">
              <Flame className="w-2.5 h-2.5 fill-white" />
              -{flashPricing.discountPercent}%
            </span>
          ) : (
            <>
              {book.bestseller && (
                <span className="bg-[#F40009] text-white text-[9px] font-black px-2 py-0.5 rounded-xl uppercase tracking-wider shadow-xs">
                  #1 Best
                </span>
              )}
              {book.featured && !book.bestseller && (
                <span className="bg-[#00A651] text-white text-[9px] font-black px-2 py-0.5 rounded-xl uppercase tracking-wider shadow-xs">
                  Featured
                </span>
              )}
              {Number(book.discountPercent) > 0 && !book.bestseller && !book.featured && (
                <span className="bg-[#F40009] text-white text-[9px] font-black px-1.5 py-0.5 rounded-xl shadow-xs">
                  -{book.discountPercent}%
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info Container */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-3 gap-1">
        {/* Title with consistent 2-line clamp and min-height so cards align across grid rows */}
        <h3 className="text-xs sm:text-sm font-bold text-black line-clamp-2 leading-snug group-hover:text-[#1E90FF] transition-colors min-h-[2.2rem] sm:min-h-[2.5rem]">
          {book.title}
        </h3>

        {/* Author */}
        <p className="text-[11px] text-slate-500 font-medium truncate">
          by {book.author}
        </p>

        {/* Stars */}
        <div className="pt-0.5">
          <StarRating
            rating={book.rating ? parseFloat(book.rating) : 5}
            count={book.clicks ? `${book.clicks} reads` : undefined}
          />
        </div>

        {/* Price block */}
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-black text-black">
              {formatPrice(finalPrice)}
            </span>
            {hasDiscount && finalOriginalPrice > finalPrice && (
              <span className="text-[10px] text-slate-400 line-through">
                {formatPrice(finalOriginalPrice)}
              </span>
            )}
          </div>
          {hasDiscount && finalOriginalPrice > finalPrice && (
            <p className="text-[10px] text-[#F40009] font-bold">
              Save {formatPrice(finalOriginalPrice - finalPrice)}
            </p>
          )}
        </div>

        {/* Add to Cart button */}
        <button
          type="button"
          onClick={handleAdd}
          className={`mt-2 w-full py-2 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs ${
            added
              ? 'bg-[#00A651] text-white border border-[#00A651]'
              : 'bg-[#F40009] hover:bg-[#CC0007] text-white border border-[#F40009]'
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Added</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
