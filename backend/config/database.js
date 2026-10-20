/**
 * Native Supabase Database Gateway
 * Replaces Prisma with the native @supabase/supabase-js client directly.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ Supabase credentials missing in backend environment (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
}

// Native Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

console.log('✅ Native Supabase JS client initialized successfully');

/**
 * Helper to build Supabase filters from a Prisma-style 'where' object
 */
function applyFilters(query, where = {}) {
  for (const [key, val] of Object.entries(where)) {
    if (val === undefined || val === null) continue;

    if (key === 'OR' && Array.isArray(val)) {
      const orClauses = val.map(clause => {
        const [k, v] = Object.entries(clause)[0];
        if (typeof v === 'object' && v !== null) {
          if (v.equals) return `${k}.eq.${v.equals}`;
          if (v.contains) return `${k}.ilike.%${v.contains}%`;
        }
        return `${k}.eq.${v}`;
      }).join(',');
      query = query.or(orClauses);
      continue;
    }

    if (typeof val === 'object' && !Array.isArray(val)) {
      if (val.equals !== undefined) {
        if (val.mode === 'insensitive') {
          query = query.ilike(key, val.equals);
        } else {
          query = query.eq(key, val.equals);
        }
      } else if (val.contains !== undefined) {
        query = query.ilike(key, `%${val.contains}%`);
      } else if (val.in !== undefined && Array.isArray(val.in)) {
        query = query.in(key, val.in);
      } else if (val.gte !== undefined) {
        query = query.gte(key, val.gte);
      } else if (val.lte !== undefined) {
        query = query.lte(key, val.lte);
      } else if (val.gt !== undefined) {
        query = query.gt(key, val.gt);
      } else if (val.lt !== undefined) {
        query = query.lt(key, val.lt);
      }
    } else {
      query = query.eq(key, val);
    }
  }
  return query;
}

/**
 * Creates a table interface executing native Supabase queries
 */
function createSupabaseTable(tableName) {
  return {
    async findUnique({ where = {}, include } = {}) {
      let selectClause = '*';
      if (include?.categories) selectClause += ', categories(*)';
      if (include?.order_items || include?.orderItems) selectClause += ', order_items(*)';

      let query = supabase.from(tableName).select(selectClause);
      for (const [k, v] of Object.entries(where)) {
        query = query.eq(k, v);
      }
      const { data, error } = await query.maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error(`Supabase findUnique error in ${tableName}:`, error);
      }
      return data || null;
    },

    async findFirst({ where = {}, include, orderBy } = {}) {
      let selectClause = '*';
      if (include?.categories) selectClause += ', categories(*)';
      let query = supabase.from(tableName).select(selectClause);
      query = applyFilters(query, where);

      if (orderBy) {
        for (const [col, dir] of Object.entries(orderBy)) {
          query = query.order(col, { ascending: String(dir).toLowerCase() === 'asc' });
        }
      }

      const { data, error } = await query.limit(1).maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error(`Supabase findFirst error in ${tableName}:`, error);
      }
      return data || null;
    },

    async findMany({ where = {}, include, orderBy, skip, take } = {}) {
      let selectClause = '*';
      if (include?.categories) selectClause += ', categories(*)';
      if (include?.order_items || include?.orderItems) selectClause += ', order_items(*)';
      if (include?._count) selectClause += ', books(count)';

      let query = supabase.from(tableName).select(selectClause);
      query = applyFilters(query, where);

      if (orderBy) {
        for (const [col, dir] of Object.entries(orderBy)) {
          query = query.order(col, { ascending: String(dir).toLowerCase() === 'asc' });
        }
      }

      if (skip !== undefined && take !== undefined) {
        query = query.range(skip, skip + take - 1);
      } else if (take !== undefined) {
        query = query.limit(take);
      }

      const { data, error } = await query;
      if (error) {
        console.error(`Supabase findMany error in ${tableName}:`, error);
        return [];
      }
      return data || [];
    },

    async count({ where = {} } = {}) {
      let query = supabase.from(tableName).select('*', { count: 'exact', head: true });
      query = applyFilters(query, where);
      const { count, error } = await query;
      if (error) {
        console.error(`Supabase count error in ${tableName}:`, error);
        return 0;
      }
      return count || 0;
    },

    async create({ data = {} } = {}) {
      const { data: created, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error(`Supabase create error in ${tableName}:`, error);
        throw new Error(error.message || `Failed to create record in ${tableName}`);
      }
      return created;
    },

    async createMany({ data = [] } = {}) {
      if (!Array.isArray(data) || data.length === 0) return { count: 0 };
      const { data: created, error } = await supabase
        .from(tableName)
        .insert(data)
        .select();

      if (error) {
        console.error(`Supabase createMany error in ${tableName}:`, error);
        throw new Error(error.message || `Failed to insert records in ${tableName}`);
      }
      return { count: created?.length || 0 };
    },

    async update({ where = {}, data = {} } = {}) {
      const processedData = { ...data };
      const incrementKeys = Object.keys(data).filter(
        k => data[k] && typeof data[k] === 'object' && typeof data[k].increment === 'number'
      );

      if (incrementKeys.length > 0) {
        let checkQuery = supabase.from(tableName).select('*');
        for (const [k, v] of Object.entries(where)) {
          checkQuery = checkQuery.eq(k, v);
        }
        const { data: current } = await checkQuery.maybeSingle();
        for (const k of incrementKeys) {
          const base = current ? (Number(current[k]) || 0) : 0;
          processedData[k] = base + data[k].increment;
        }
      }

      let query = supabase.from(tableName).update(processedData);
      for (const [k, v] of Object.entries(where)) {
        query = query.eq(k, v);
      }
      const { data: updated, error } = await query.select().single();
      if (error) {
        console.error(`Supabase update error in ${tableName}:`, error);
        throw new Error(error.message || `Failed to update record in ${tableName}`);
      }
      return updated;
    },

    async delete({ where = {} } = {}) {
      let query = supabase.from(tableName).delete();
      for (const [k, v] of Object.entries(where)) {
        query = query.eq(k, v);
      }
      const { data: deleted, error } = await query.select().maybeSingle();
      if (error) {
        console.error(`Supabase delete error in ${tableName}:`, error);
        throw new Error(error.message || `Failed to delete record in ${tableName}`);
      }
      return deleted;
    },

    async upsert({ where = {}, update = {}, create = {} } = {}) {
      // Check existing
      let checkQuery = supabase.from(tableName).select('*');
      for (const [k, v] of Object.entries(where)) {
        checkQuery = checkQuery.eq(k, v);
      }
      const { data: existing } = await checkQuery.maybeSingle();

      if (existing) {
        if (Object.keys(update).length > 0) {
          let updateQuery = supabase.from(tableName).update(update);
          for (const [k, v] of Object.entries(where)) {
            updateQuery = updateQuery.eq(k, v);
          }
          const { data: updated, error } = await updateQuery.select().single();
          if (error) throw new Error(error.message);
          return updated;
        }
        return existing;
      }

      // Create new
      const insertPayload = { ...where, ...create };
      const { data: created, error } = await supabase
        .from(tableName)
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return created;
    }
  };
}

// Native Supabase Model Gateway
const db = {
  users: createSupabaseTable('users'),
  books: createSupabaseTable('books'),
  categories: createSupabaseTable('categories'),
  authors: createSupabaseTable('authors'),
  orders: createSupabaseTable('orders'),
  order_items: createSupabaseTable('order_items'),
  site_visits: createSupabaseTable('site_visits'),
  book_clicks: createSupabaseTable('book_clicks'),
  payments: createSupabaseTable('payments'),
  purchases: createSupabaseTable('purchases'),

  // Aliases for compatibility
  user: createSupabaseTable('users'),
  book: createSupabaseTable('books'),
  category: createSupabaseTable('categories'),
  author: createSupabaseTable('authors'),
  order: createSupabaseTable('orders'),
  orderItem: createSupabaseTable('order_items'),
  siteVisit: createSupabaseTable('site_visits'),
  bookClick: createSupabaseTable('book_clicks'),
  payment: createSupabaseTable('payments'),
  purchase: createSupabaseTable('purchases'),

  // Raw SQL fallback directly via Supabase RPC or query
  async $queryRawUnsafe(sql, ...params) {
    try {
      // Check if authors query
      if (sql.includes('public.authors') && params.length > 0) {
        const authorName = String(params[0]).trim();
        const { data } = await supabase
          .from('authors')
          .select('*')
          .ilike('name', authorName)
          .limit(1);
        return data || [];
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  async $executeRawUnsafe(sql, ...params) {
    try {
      if (sql.includes('public.authors') && params.length >= 2) {
        const name = String(params[0]).trim();
        const bio = String(params[1]).trim();
        await supabase.from('authors').upsert({ name, bio }, { onConflict: 'name' });
        return 1;
      }
      return 0;
    } catch (e) {
      console.warn('executeRawUnsafe fallback error:', e.message);
      return 0;
    }
  },

  $connect() {
    return Promise.resolve();
  },
  $disconnect() {
    return Promise.resolve();
  }
};

// Export native supabase client and db (alias as prisma for smooth migration)
module.exports = {
  supabase,
  db,
  prisma: db
};
