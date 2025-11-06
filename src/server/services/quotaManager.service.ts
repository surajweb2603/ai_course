/**
 * Quota Management Service
 * Helps manage API quotas and provides fallback strategies
 */

interface QuotaStatus {
  youtube: {
    available: boolean;
    lastChecked: Date;
    quotaExceeded: boolean;
  };
}

class QuotaManager {
  private quotaStatus: QuotaStatus = {
    youtube: {
      available: true,
      lastChecked: new Date(),
      quotaExceeded: false
    }
  };

  private readonly QUOTA_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Check if YouTube API is available (not quota exceeded)
   */
  async isYouTubeAvailable(): Promise<boolean> {
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - this.quotaStatus.youtube.lastChecked.getTime();
    
    // If we checked recently and quota was exceeded, don't check again for 24 hours
    if (this.quotaStatus.youtube.quotaExceeded && timeSinceLastCheck < this.QUOTA_CHECK_INTERVAL) {
      return false;
    }

    // If we haven't checked recently, test the API
    if (timeSinceLastCheck > this.QUOTA_CHECK_INTERVAL) {
      
      try {
        const axios = require('axios');
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: 'test',
            type: 'video',
            maxResults: 1,
            key: process.env.YOUTUBE_API_KEY
          },
          timeout: 5000
        });
        
        this.quotaStatus.youtube.available = true;
        this.quotaStatus.youtube.quotaExceeded = false;
        this.quotaStatus.youtube.lastChecked = now;
        return true;
      } catch (error: any) {
        if (error.response?.status === 403 && error.response.data?.error?.message?.includes('quota')) {
          this.quotaStatus.youtube.available = false;
          this.quotaStatus.youtube.quotaExceeded = true;
          this.quotaStatus.youtube.lastChecked = now;
          return false;
        }
        
        // Other errors, assume available but log the issue
        return true;
      }
    }

    return this.quotaStatus.youtube.available;
  }

  /**
   * Get the recommended video search strategy
   */
  async getVideoSearchStrategy(): Promise<'youtube' | 'scraping' | 'both'> {
    const youtubeAvailable = await this.isYouTubeAvailable();
    
    if (youtubeAvailable) {
      return 'both';
    } else {
      return 'scraping';
    }
  }

  /**
   * Get quota status for debugging
   */
  getQuotaStatus(): QuotaStatus {
    return { ...this.quotaStatus };
  }

  /**
   * Reset quota status (useful for testing)
   */
  resetQuotaStatus(): void {
    this.quotaStatus = {
      youtube: {
        available: true,
        lastChecked: new Date(),
        quotaExceeded: false
      }
    };
  }
}

// Export singleton instance
export const quotaManager = new QuotaManager();
export default quotaManager;
