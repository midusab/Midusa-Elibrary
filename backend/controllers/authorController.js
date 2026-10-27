const { prisma } = require('../config/database');

const isUuid = (str) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));

/**
 * Try to fetch a real author photo from Wikipedia API.
 * Returns an image URL string or null.
 */
async function fetchAuthorAvatarFromWikipedia(authorName) {
  try {
    // Step 1: Search Wikipedia for the author
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(authorName)}&format=json&srlimit=1&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const pages = searchData?.query?.search;
    if (!pages || pages.length === 0) return null;

    const pageTitle = pages[0].title;

    // Step 2: Get the page image from Wikipedia
    const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=300&format=json&origin=*`;
    const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(5000) });
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();
    const pagesObj = imgData?.query?.pages;
    if (!pagesObj) return null;

    const page = Object.values(pagesObj)[0];
    const thumbnail = page?.thumbnail?.source;
    return thumbnail || null;
  } catch {
    return null;
  }
}

// ─── Get author profile with follow status ──────────────────────────────────
const getAuthorProfile = async (req, res) => {
  try {
    const authorName = decodeURIComponent(req.params.name || '').trim();
    if (!authorName) {
      return res.status(400).json({ error: 'Author name is required' });
    }

    // Look up author in DB
    let rows = [];
    try {
      rows = await prisma.$queryRawUnsafe(`
        SELECT id, name, COALESCE(bio, '') as bio, COALESCE(avatar, '') as avatar
        FROM public.authors
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
        LIMIT 1
      `, authorName);
    } catch (_) {}

    let authorRow = rows[0] || null;

    // If no avatar stored, try fetching one from Wikipedia and save it
    if (authorRow && !authorRow.avatar) {
      const wikiAvatar = await fetchAuthorAvatarFromWikipedia(authorName);
      if (wikiAvatar) {
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE public.authors SET avatar = $1, updated_at = NOW() WHERE id = $2`,
            wikiAvatar,
            authorRow.id
          );
          authorRow.avatar = wikiAvatar;
        } catch (_) {}
      }
    }

    // If author not in table at all, try wiki avatar without saving yet
    let avatar = authorRow?.avatar || '';
    if (!avatar) {
      const wikiAvatar = await fetchAuthorAvatarFromWikipedia(authorName);
      avatar = wikiAvatar || '';
    }

    // Check follower count
    let followerCount = 0;
    if (authorRow?.id) {
      try {
        const countRes = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as cnt FROM public.author_follows WHERE author_id = $1
        `, authorRow.id);
        followerCount = Number(countRes[0]?.cnt || 0);
      } catch (_) {}
    }

    // Check if the requesting user follows this author
    let isFollowing = false;
    let reqUserId = null;
    if (req.user) {
      if (isUuid(req.user.id)) reqUserId = req.user.id;
      else if (req.user.email) {
        try {
          const u = await prisma.users.findUnique({ where: { email: req.user.email.toLowerCase().trim() } });
          if (u) reqUserId = u.id;
        } catch (_) {}
      }
    }

    if (reqUserId && authorRow?.id) {
      try {
        const followRow = await prisma.$queryRawUnsafe(`
          SELECT 1 FROM public.author_follows WHERE user_id = $1 AND author_id = $2 LIMIT 1
        `, reqUserId, authorRow.id);
        isFollowing = followRow.length > 0;
      } catch (_) {}
    }

    res.json({
      success: true,
      authorId: authorRow?.id || null,
      name: authorName,
      bio: authorRow?.bio || '',
      avatar,
      followerCount,
      isFollowing,
    });
  } catch (err) {
    console.error('Error fetching author profile:', err);
    res.status(500).json({ error: 'Failed to fetch author profile' });
  }
};

// ─── Follow an author ──────────────────────────────────────────────────────
const followAuthor = async (req, res) => {
  try {
    const authorName = decodeURIComponent(req.params.name || '').trim();
    if (!authorName) return res.status(400).json({ error: 'Author name is required' });
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    // Resolve user DB ID
    let userId = null;
    if (isUuid(req.user.id)) userId = req.user.id;
    else if (req.user.email) {
      const u = await prisma.users.findUnique({ where: { email: req.user.email.toLowerCase().trim() } });
      if (u) userId = u.id;
    }
    if (!userId) return res.status(401).json({ error: 'User account not found' });

    // Get or create author record
    let rows = await prisma.$queryRawUnsafe(`
      SELECT id FROM public.authors WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1
    `, authorName);

    let authorId;
    if (rows.length === 0) {
      // Create a stub author record so we can track follows
      const wikiAvatar = await fetchAuthorAvatarFromWikipedia(authorName);
      const newAuthor = await prisma.$queryRawUnsafe(`
        INSERT INTO public.authors (name, bio, avatar) VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
        RETURNING id
      `, authorName, '', wikiAvatar || '');
      authorId = newAuthor[0]?.id;
    } else {
      authorId = rows[0].id;
    }

    if (!authorId) return res.status(500).json({ error: 'Could not resolve author' });

    // Upsert follow row
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.author_follows (user_id, author_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, author_id) DO NOTHING
    `, userId, authorId);

    // Return updated follower count
    const countRes = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as cnt FROM public.author_follows WHERE author_id = $1
    `, authorId);
    const followerCount = Number(countRes[0]?.cnt || 0);

    res.json({ success: true, isFollowing: true, followerCount });
  } catch (err) {
    console.error('Error following author:', err);
    res.status(500).json({ error: 'Failed to follow author' });
  }
};

// ─── Unfollow an author ──────────────────────────────────────────────────────
const unfollowAuthor = async (req, res) => {
  try {
    const authorName = decodeURIComponent(req.params.name || '').trim();
    if (!authorName) return res.status(400).json({ error: 'Author name is required' });
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    // Resolve user DB ID
    let userId = null;
    if (isUuid(req.user.id)) userId = req.user.id;
    else if (req.user.email) {
      const u = await prisma.users.findUnique({ where: { email: req.user.email.toLowerCase().trim() } });
      if (u) userId = u.id;
    }
    if (!userId) return res.status(401).json({ error: 'User account not found' });

    // Find author ID
    const rows = await prisma.$queryRawUnsafe(`
      SELECT id FROM public.authors WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1
    `, authorName);
    if (rows.length === 0) return res.json({ success: true, isFollowing: false, followerCount: 0 });

    const authorId = rows[0].id;

    await prisma.$executeRawUnsafe(`
      DELETE FROM public.author_follows WHERE user_id = $1 AND author_id = $2
    `, userId, authorId);

    const countRes = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as cnt FROM public.author_follows WHERE author_id = $1
    `, authorId);
    const followerCount = Number(countRes[0]?.cnt || 0);

    res.json({ success: true, isFollowing: false, followerCount });
  } catch (err) {
    console.error('Error unfollowing author:', err);
    res.status(500).json({ error: 'Failed to unfollow author' });
  }
};

// ─── Get authors the current user follows ───────────────────────────────────
const getFollowedAuthors = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });

    let userId = null;
    if (isUuid(req.user.id)) userId = req.user.id;
    else if (req.user.email) {
      const u = await prisma.users.findUnique({ where: { email: req.user.email.toLowerCase().trim() } });
      if (u) userId = u.id;
    }
    if (!userId) return res.status(401).json({ error: 'User account not found' });

    const followed = await prisma.$queryRawUnsafe(`
      SELECT a.id, a.name, a.bio, a.avatar, af.created_at as followed_at
      FROM public.author_follows af
      JOIN public.authors a ON a.id = af.author_id
      WHERE af.user_id = $1
      ORDER BY af.created_at DESC
    `, userId);

    res.json({ success: true, authors: followed });
  } catch (err) {
    console.error('Error fetching followed authors:', err);
    res.status(500).json({ error: 'Failed to fetch followed authors' });
  }
};

module.exports = {
  getAuthorProfile,
  followAuthor,
  unfollowAuthor,
  getFollowedAuthors,
};
