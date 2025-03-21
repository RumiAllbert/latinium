import { LatinAnalysisResponse } from '../types/latin';

/**
 * Simple in-memory cache for Latin analysis results
 * This helps reduce API calls for frequently analyzed texts
 */
interface CacheEntry {
  data: LatinAnalysisResponse;
  timestamp: number;
}

class LatinAnalysisCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxCacheSize: number = 50; // Maximum number of entries to store
  private readonly cacheTtlMs: number = 24 * 60 * 60 * 1000; // 24 hours cache lifetime
  
  /**
   * Get a cached analysis result if available
   * @param text The Latin text that was analyzed
   * @returns The cached analysis or undefined if not in cache
   */
  get(text: string): LatinAnalysisResponse | undefined {
    const normalizedText = this.normalizeText(text);
    const entry = this.cache.get(normalizedText);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if the entry is expired
    const now = Date.now();
    if (now - entry.timestamp > this.cacheTtlMs) {
      this.cache.delete(normalizedText);
      return undefined;
    }
    
    return entry.data;
  }
  
  /**
   * Store an analysis result in the cache
   * @param text The Latin text that was analyzed
   * @param analysisResult The result from the API
   */
  set(text: string, analysisResult: LatinAnalysisResponse): void {
    const normalizedText = this.normalizeText(text);
    
    // If cache is at max size, remove the oldest entry
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.findOldestCacheEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(normalizedText, {
      data: analysisResult,
      timestamp: Date.now()
    });
  }
  
  /**
   * Check if the text is in the cache
   * @param text The Latin text to check
   * @returns True if the text is in the cache and not expired
   */
  has(text: string): boolean {
    const normalizedText = this.normalizeText(text);
    const entry = this.cache.get(normalizedText);
    
    if (!entry) {
      return false;
    }
    
    // Check if the entry is expired
    const now = Date.now();
    if (now - entry.timestamp > this.cacheTtlMs) {
      this.cache.delete(normalizedText);
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache stats for monitoring
   */
  getStats(): { size: number; maxSize: number; ttlHours: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      ttlHours: this.cacheTtlMs / (60 * 60 * 1000)
    };
  }
  
  /**
   * Normalize text by removing extra whitespace and lowercase
   * to increase cache hit ratio
   */
  private normalizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ').toLowerCase();
  }
  
  /**
   * Find the oldest entry in the cache
   */
  private findOldestCacheEntry(): string | undefined {
    let oldestTimestamp = Infinity;
    let oldestKey: string | undefined = undefined;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
}

// Export a singleton instance
export const latinCache = new LatinAnalysisCache(); 