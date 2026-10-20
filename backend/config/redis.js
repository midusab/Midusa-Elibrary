/**
 * Redis Service for Caching & Asynchronous Tasks
 * Powered by ioredis with transparent in-memory fallback.
 */
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = null;
let isRedisConnected = false;

// Fallback in-memory cache and task queues for local dev / offline mode
const memoryCache = new Map();
const memoryQueues = new Map();

try {
  redisClient = new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 3) {
        return null; // Stop retrying after 3 attempts
      }
      return Math.min(times * 100, 2000);
    }
  });

  redisClient.connect().then(() => {
    isRedisConnected = true;
    console.log('Redis connected successfully for caching and async tasks');
  }).catch((err) => {
    isRedisConnected = false;
    console.warn(`Redis server not reachable (${err.message || 'connection failed'}). Using in-memory fallback.`);
  });

  redisClient.on('connect', () => {
    isRedisConnected = true;
  });

  redisClient.on('error', () => {
    isRedisConnected = false;
  });
} catch (err) {
  console.warn('Redis client initialization skipped, using fallback:', err.message);
}

// ─────────────────────────────────────────────────────────────
// Caching Layer
// ─────────────────────────────────────────────────────────────

async function getCache(key) {
  try {
    if (isRedisConnected && redisClient) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (err) {
    // Fall back to memory cache on Redis error
  }

  const item = memoryCache.get(key);
  if (item) {
    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  }
  return null;
}

async function setCache(key, value, ttlSeconds = 300) {
  try {
    if (isRedisConnected && redisClient) {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    }
  } catch (err) {
    // Fall back to memory cache on Redis error
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

async function delCache(key) {
  try {
    if (isRedisConnected && redisClient) {
      await redisClient.del(key);
    }
  } catch (err) {}
  memoryCache.delete(key);
}

async function delCachePattern(pattern) {
  try {
    if (isRedisConnected && redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
  } catch (err) {}

  const regex = new RegExp(`^${pattern.replace('*', '.*')}$`);
  for (const k of memoryCache.keys()) {
    if (regex.test(k)) {
      memoryCache.delete(k);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Asynchronous Task Queue Layer
// ─────────────────────────────────────────────────────────────

async function pushAsyncTask(queueName, payload) {
  const item = {
    payload,
    enqueuedAt: new Date().toISOString()
  };

  try {
    if (isRedisConnected && redisClient) {
      await redisClient.rpush(`queue:${queueName}`, JSON.stringify(item));
      return true;
    }
  } catch (err) {}

  if (!memoryQueues.has(queueName)) {
    memoryQueues.set(queueName, []);
  }
  memoryQueues.get(queueName).push(item);
  return true;
}

async function popAsyncTask(queueName) {
  try {
    if (isRedisConnected && redisClient) {
      const raw = await redisClient.lpop(`queue:${queueName}`);
      return raw ? JSON.parse(raw) : null;
    }
  } catch (err) {}

  const q = memoryQueues.get(queueName);
  if (q && q.length > 0) {
    return q.shift();
  }
  return null;
}

/**
 * Register a background worker to consume async tasks from a queue
 */
function registerWorker(queueName, handler, pollIntervalMs = 2000) {
  setInterval(async () => {
    try {
      const task = await popAsyncTask(queueName);
      if (task) {
        await handler(task.payload);
      }
    } catch (err) {
      console.error(`Error processing async task on ${queueName}:`, err);
    }
  }, pollIntervalMs);
}

module.exports = {
  redisClient,
  isRedisConnected: () => isRedisConnected,
  getCache,
  setCache,
  delCache,
  delCachePattern,
  pushAsyncTask,
  popAsyncTask,
  registerWorker
};
