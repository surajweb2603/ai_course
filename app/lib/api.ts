
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// When deployed on Vercel, use relative paths (empty string) or the provided URL
// This allows the same domain to serve both frontend and API
const getApiBaseUrl = () => {
  // If APP_BASE_URL is explicitly set, use it
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  
  // In production (Vercel), use relative paths (same domain)
  // In development, use relative paths (Next.js serves both frontend and API)
  if (typeof window !== 'undefined') {
    return '/api';
  }
  
  // During build / server rendering use relative paths
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      error.message = error.message || 'Network error. Please check your connection and try again.';
    }
    return Promise.reject(error);
  }
);

export function setAuthToken(token: string | null): void {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

// Auth API methods
export const auth = {
  signup: async (data: { email: string; name: string; password: string }) => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  login: async (data: { email: string; password: string; rememberMe?: boolean }) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  googleLogin: async (idToken: string) => {
    const response = await apiClient.post('/auth/google', { idToken });
    return response.data;
  },

  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (data: { email: string }) => {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: { token: string; password: string }) => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },
};

// Dashboard API methods
export const dashboard = {
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },

  getCourses: async () => {
    const response = await apiClient.get('/dashboard/courses');
    return response.data;
  },

  createCourse: async (data: { 
    title: string; 
    description?: string; 
    lessonsCount?: number; 
    estimatedTimeMinutes?: number;
    category?: string;
  }) => {
    const response = await apiClient.post('/dashboard/courses', data);
    return response.data;
  },

  updateCourseProgress: async (courseId: string, progress: number) => {
    const response = await apiClient.patch(`/dashboard/courses/${courseId}`, { progress });
    return response.data;
  },

  updateStreak: async () => {
    const response = await apiClient.patch('/dashboard/stats/streak');
    return response.data;
  },

  syncStreak: async () => {
    const response = await apiClient.post('/dashboard/stats/sync-streak');
    return response.data;
  },
};

// Course API methods
export const courses = {
  create: async (data: { title: string; language?: string }) => {
    const response = await apiClient.post('/courses', data);
    return response.data;
  },

  list: async () => {
    const response = await apiClient.get('/courses');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  },

  export: async (id: string) => {
    const response = await apiClient.get(`/courses/${id}/export`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Public course sharing (no auth required)
  getPublic: async (id: string) => {
    const response = await apiClient.get(`/courses/${id}/share`);
    return response.data;
  },

  // Update course visibility
  updateVisibility: async (id: string, visibility: 'private' | 'unlisted' | 'public') => {
    const response = await apiClient.patch(`/courses/${id}/visibility`, { visibility });
    return response.data;
  },
};

// Progress API methods
export const progress = {
  update: async (data: { 
    courseId: string; 
    moduleOrder: number; 
    lessonOrder: number; 
    completed: boolean 
  }) => {
    const response = await apiClient.post('/progress/update', data);
    return response.data;
  },

  get: async (courseId: string) => {
    const response = await apiClient.get(`/progress/${courseId}`);
    return response.data;
  },

  bulkUpdate: async (data: { 
    courseId: string; 
    items: Array<{
      moduleOrder: number;
      lessonOrder: number;
      completed: boolean;
    }>
  }) => {
    const response = await apiClient.post('/progress/bulk', data);
    return response.data;
  },
};

// Quiz API methods
export const quiz = {
  save: async (data: {
    courseId: string;
    lessonId: string;
    moduleOrder: number;
    lessonOrder: number;
    questionIndex: number;
    selectedAnswerIndex: number;
  }) => {
    const response = await apiClient.post('/quizzes/save', data);
    return response.data;
  },

  saveBatch: async (data: {
    courseId: string;
    lessonId: string;
    responses: Array<{
      moduleOrder: number;
      lessonOrder: number;
      questionIndex: number;
      selectedAnswerIndex: number;
    }>;
  }) => {
    const response = await apiClient.post('/quizzes/save-batch', data);
    return response.data;
  },

  getResponses: async (courseId: string, lessonId: string) => {
    const response = await apiClient.get(`/quizzes/responses/${courseId}/${lessonId}`);
    return response.data;
  },
};

// Generate API methods
export const generate = {
  outline: async (data: { 
    topic: string; 
    language?: string; 
    subtopics?: string[]; 
    courseId?: string;
  }) => {
    const response = await apiClient.post('/generate/outline', data);
    return response.data;
  },
  
  content: async (data: {
    courseId: string;
    moduleOrder: number;
    lessonOrder?: number;
    lessonId?: string;
    audienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  }, config: AxiosRequestConfig = {}) => {
    const response = await apiClient.post('/generate/content', data, config);
    return response.data;
  },
};

// Certificate API methods
export const certificate = {
  download: async (courseId: string) => {
    try {
      const response = await apiClient.get(`/certificates/${courseId}`, {
        responseType: 'blob'
      });
      
      // Check if the response is actually a PDF (starts with PDF header)
      const blob = response.data;
      if (blob instanceof Blob) {
        // Check if it's actually a PDF by reading the first bytes
        const arrayBuffer = await blob.slice(0, 4).arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const isPDF = uint8Array[0] === 0x25 && uint8Array[1] === 0x50 && uint8Array[2] === 0x44 && uint8Array[3] === 0x46; // %PDF
        
        if (!isPDF) {
          // Likely an error JSON response, try to parse it
          const text = await blob.text();
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.error || 'Failed to download certificate');
          } catch {
            throw new Error('Failed to download certificate');
          }
        }
      }
      
      return blob;
    } catch (error: any) {
      // If it's an axios error with a blob response that contains JSON error
      if (error.response?.data instanceof Blob && error.response.status !== 200) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || 'Failed to download certificate');
        } catch {
          // If parsing fails, use a generic error message
          throw new Error('Failed to download certificate');
        }
      }
      
      // Handle standard axios errors
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      // Handle error messages
      if (error.message) {
        throw error;
      }
      
      throw new Error('Failed to download certificate');
    }
  },
  
  verify: async (code: string) => {
    const response = await apiClient.get(`/certificates/verify/${code}`);
    return response.data;
  },
};

// Chat API methods
export const chat = {
  sendMessage: async (data: {
    message: string;
    courseId: string;
    moduleTitle?: string;
    lessonTitle?: string;
    conversationHistory?: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
    language?: string;
  }) => {
    const response = await apiClient.post('/chat', data);
    return response.data;
  },
};

// Translation API methods
export const translation = {
  translate: async (data: {
    text: string;
    targetLanguage: string;
    sourceLanguage?: string;
    context?: string;
  }) => {
    const response = await apiClient.post('/translate/translate', data);
    return response.data;
  },

  getLanguages: async () => {
    const response = await apiClient.get('/translate/languages');
    return response.data;
  },
};

// Image Search API methods
export const imageSearch = {
  search: async (data: {
    query: string;
    numResults?: number;
  }) => {
    const response = await apiClient.post('/media/images/search', data);
    return response.data;
  },
};

// Video Search API methods
export const videos = {
  search: async (topic: string) => {
    const response = await apiClient.get('/media/videos/search', {
      params: { topic },
    });
    return response.data;
  },
};

export default apiClient;
