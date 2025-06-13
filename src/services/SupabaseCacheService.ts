type CacheEntry<T> = {
  data: T
  expires: number
}

export class SupabaseCacheService {
  private static cache: Record<string, CacheEntry<unknown>> = {}
  private static defaultTTL = 5 * 60 * 1000 // 5 phút

  static async get<T>(key: string, fetcher: () => Promise<T>, options?: { ttl?: number }): Promise<T> {
    const now = Date.now()
    const entry = this.cache[key] as CacheEntry<T> | undefined
    const ttl = options?.ttl ?? this.defaultTTL
    if (entry && entry.expires > now) {
      return entry.data
    }
    const data = await fetcher()
    this.cache[key] = { data, expires: now + ttl }
    return data
  }

  static clear(key: string) {
    delete this.cache[key]
  }

  static clearAll() {
    this.cache = {}
  }
} 