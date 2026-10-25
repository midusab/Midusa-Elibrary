import { API_BASE_URL, authHeader } from './client';

/**
 * Fetch all reviews for a specific book
 * @param {string} bookId
 * @returns {Promise<{ success: boolean, count: number, averageRating: number, distribution: object, reviews: Array }>}
 */
export async function getBookReviews(bookId) {
  if (!bookId) return { success: true, reviews: [], count: 0, averageRating: 0 };

  try {
    const res = await fetch(`${API_BASE_URL}/reviews/book/${bookId}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to load reviews (HTTP ${res.status})`);
    }

    const data = await res.json();
    return {
      success: true,
      reviews: Array.isArray(data.reviews) ? data.reviews : [],
      count: data.count || 0,
      averageRating: data.averageRating || 0,
      distribution: data.distribution || {},
    };
  } catch (error) {
    console.warn(`getBookReviews error for ${bookId}:`, error.message);
    return { success: false, reviews: [], count: 0, averageRating: 0, error: error.message };
  }
}

/**
 * Submit a review for a book
 * @param {{ bookId: string, reviewerName: string, rating: number, comment: string }} payload
 * @param {string|null} token - Optional authentication token
 * @returns {Promise<{ success: boolean, review: object, bookRating: number }>}
 */
export async function createReview(payload, token = null) {
  const res = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit review');
  }

  return data;
}

/**
 * Delete a review (by author or admin)
 * @param {string} reviewId
 * @param {string} token
 */
export async function deleteReview(reviewId, token) {
  const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: {
      ...authHeader(token),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete review');
  }

  return data;
}
