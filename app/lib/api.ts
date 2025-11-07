
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// When deployed on Vercel, use relative paths (empty string) or the provided URL
// This allows the same domain to serve both frontend and API
const getApiBaseUrl = () => {
  // If NEXT_PUBLIC_API_BASE_URL is explicitly set, use it
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
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
    const response = await apiClient.get(`/certificates/${courseId}`, {
      responseType: 'blob'
    });
    return response.data;
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
