# 🎓 AI Course Generator

> A full-stack, AI-powered course generation platform that transforms any topic into comprehensive, structured learning experiences in minutes.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Features in Detail](#features-in-detail)
- [Subscription Plans](#subscription-plans)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

**AI Course Generator** is an intelligent, AI-driven platform that automatically creates complete educational courses from any topic. Whether you're an educator looking to create curriculum quickly or a student wanting structured learning materials, this platform generates comprehensive courses with:

- **AI-Generated Course Outlines** - 6-8 modules with 3-5 lessons each
- **Rich Lesson Content** - Detailed theory, examples, exercises, and key takeaways
- **Interactive Quizzes** - Auto-generated assessments with multiple-choice questions
- **Visual Learning** - Automatic image search and integration
- **Video Integration** - Educational videos from YouTube
- **AI Tutor** - 24/7 conversational AI assistant for learning support
- **Progress Tracking** - Detailed analytics and completion certificates
- **Multi-language Support** - Generate courses in 12+ languages
- **Course Sharing** - Share courses with shareable links
- **PDF Certificates** - Downloadable certificates with QR codes for completed courses

## ✨ Key Features

### 🚀 Core Capabilities

- **🤖 AI Course Generation**: Generate complete course structures with modules, lessons, and quizzes in minutes
- **📚 Smart Content Creation**: AI writes detailed lesson content with theory, examples, and exercises
- **🖼️ Auto Image Search**: Automatically find and integrate relevant educational images
- **🎥 Video Integration**: Embed educational videos from YouTube for enhanced learning
- **💬 AI Tutor Chat**: 24/7 AI tutor for instant help and guidance (Pro plans)
- **📊 Progress Analytics**: Track learning progress with detailed charts and statistics
- **🎓 Certificates**: Generate PDF certificates with QR codes upon course completion
- **🌍 Multi-language**: Support for 12+ languages in course generation
- **🔗 Course Sharing**: Share courses via public links
- **🎨 Theme Customization**: Customize course appearance and branding
- **📱 Mobile Responsive**: Fully responsive design for all devices

### 🔒 Security & Authentication

- JWT-based authentication
- Google OAuth integration
- Secure password hashing with bcrypt
- Protected API routes with middleware
- User session management

### 💳 Payment Integration

- Stripe integration for subscriptions
- Free, Monthly Pro, and Yearly Pro plans
- Secure payment processing
- Subscription management

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: React 18
- **Animations**: Framer Motion
- **Charts**: Chart.js, React-Chartjs-2
- **Math Rendering**: KaTeX, Rehype-Katex
- **Markdown**: React-Markdown
- **HTTP Client**: Axios
- **Icons**: Lucide React

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, Google OAuth
- **AI Services**: 
  - OpenAI GPT-4o (Primary)
  - Google Gemini 2.0 Flash (Fallback)
- **Payment**: Stripe API
- **PDF Generation**: PDFKit, PDF-lib
- **Image Search**: 
  - Primary: g-i-s library (Google Image Search scraping)
  - Fallbacks: Custom Google scraper, Bing Images
- **Video Search**: 
  - Primary: YouTube Data API v3
  - Fallback: YouTube Search scraping (cheerio)
- **QR Codes**: QRCode library

### Infrastructure

- **Package Management**: Single npm workspace with centralized tooling
- **Build Tool**: TypeScript compiler
- **Development**: ts-node-dev (hot reload)
- **Environment**: dotenv

## 🏗️ Architecture

The project follows a **unified Next.js 14 monolithic architecture** with all routes served from a single application:

```
ai-course-generator/
├── app/                # Next.js App Router
│   ├── api/            # API Route Handlers (Next.js Route Handlers)
│   └── [pages]/        # Frontend pages
├── src/                # Shared code
│   ├── models/         # Mongoose models
│   ├── server/         # Server-side code
│   │   ├── services/   # Business logic
│   │   ├── db/         # Database connection
│   │   ├── auth/       # Authentication utilities
│   │   └── http/       # HTTP adapters
│   └── utils/          # Utility functions
├── public/             # Static assets (images, PDFs)
├── scripts/            # Utility scripts
├── next.config.js      # Next.js configuration
├── tsconfig.json       # TypeScript config
└── package.json        # Dependencies and scripts
```

### Architecture Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTP/REST
       ▼
┌─────────────────────┐
│   Next.js 14 App    │
│  (Monolithic)       │
│  ├── Frontend Pages │
│  └── API Routes     │
└──────┬──────────────┘
       │
       ├───────────────┬───────────────┐
       ▼               ▼               ▼
┌───────────┐   ┌───────────┐   ┌───────────┐
│  MongoDB  │   │  OpenAI   │   │  Stripe   │
└───────────┘   └───────────┘   └───────────┘
```

### Key Features

- **Single Command**: `npm run dev` starts everything
- **Unified API**: All API routes under `/app/api`
- **Shared Code**: Models, services, and utils in `/src`
- **Serverless Ready**: Optimized for Vercel deployment
- **Type Safety**: Full TypeScript support across the stack

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** instance (local or cloud)
- **API Keys** (see Environment Setup section)

### Quick Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ai_Course_Generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (see [Environment Setup](#environment-setup))

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Application: http://localhost:3000
   - API endpoints: http://localhost:3000/api

## ⚙️ Environment Setup

### Environment Variables

Create a `.env.local` file in the project root (Next.js will automatically load it):

```env
# Frontend Configuration (Public - accessible in browser)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
NEXT_PUBLIC_API_BASE_URL=/api
APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id  # Optional

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/ai-course-generator
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-course-generator

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI API (Primary AI Provider)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ORGANIZATION=org-your-org-id  # Optional
OPENAI_PROJECT=proj-your-project-id  # Optional
OPENAI_MODEL=gpt-4o
OPENAI_MODEL_CONTENT=gpt-4o-mini
OPENAI_CONTENT_TIMEOUT_MS=120000

# Google Gemini API (Fallback AI Provider)
GOOGLE_API_KEY=your-google-api-key
GOOGLE_MODEL=gemini-2.0-flash-exp
GEMINI_CONTENT_TIMEOUT_MS=120000

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe (For Payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_PRICE_MONTHLY=price_your-monthly-price-id
STRIPE_PRICE_YEARLY=price_your-yearly-price-id
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret  # For webhook verification

# App URLs
APP_BASE_URL=http://localhost:3000
APP_BASE_URL=http://localhost:3000

# YouTube API (For Video Search - Optional but Recommended)
YOUTUBE_API_KEY=your-youtube-api-key
# Note: Image search works without API keys (uses scraping)
# Video search falls back to scraping if API key not provided

# Pixabay API (For Image Search - Optional)
PIXABAY_API_KEY=your-pixabay-api-key
```

### Getting API Keys

#### OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy and add to `OPENAI_API_KEY`

#### Google Gemini API Key
1. Visit https://aistudio.google.com/app/apikey
2. Create a new API key
3. Copy and add to `GOOGLE_API_KEY`

#### MongoDB
- **Local**: Install MongoDB locally or use Docker
- **Cloud**: Sign up at https://www.mongodb.com/cloud/atlas

#### YouTube API Key (For Video Search - Optional but Recommended)
1. Visit https://console.cloud.google.com
2. Create a new project or select existing one
3. Enable YouTube Data API v3:
   - Go to APIs & Services → Library
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → API Key
   - Copy the API key to `YOUTUBE_API_KEY`
5. **Note**: Video search will automatically fallback to web scraping if API key is not provided or quota is exceeded

#### Stripe (For Payments)
1. Sign up at https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Create products and prices in Dashboard → Products
4. Copy price IDs to `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY`

## 💻 Development

### Development Scripts

```bash
# Start development server (single command)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run TypeScript type checking
npx tsc --noEmit

# Run linting
npm run lint

# Format code
npm run format
```

### Backend Development

All backend tasks are available through the root npm scripts:

```bash
# Development (with hot reload)
npm run dev:backend

# Build TypeScript output to dist/backend
npm run build:backend

# Run compiled production build
npm run start:backend

# Seed database (with user ID)
npm run seed -- <user-id>

# Get user ID by email
npm run get-user-id -- <email>

# Fix course index script
npm run fix-index

# Image search setup helper
npm run setup:image-search
```

### Frontend Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Format code
npm run format
```

The application is now a unified Next.js 14 monolithic application. All routes are served from the `app/` directory, and the application runs with a single `npm run dev` command.

### Project Structure

```
ai-course-generator/
├── app/                            # Next.js App Router
│   ├── api/                        # API Route Handlers
│   ├── components/                 # React components
│   ├── lib/                        # Frontend utilities
│   ├── dashboard/                  # Dashboard pages
│   ├── courses/                    # Course pages
│   ├── login/                      # Login page
│   ├── register/                   # Register page
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Home page
├── src/                            # Shared code
│   ├── models/                     # Mongoose models
│   ├── server/                     # Server-side code
│   │   ├── services/               # Business logic
│   │   ├── db/                     # Database connection
│   │   ├── auth/                   # Authentication
│   │   └── http/                   # HTTP adapters
│   └── utils/                      # Utility functions
├── public/                         # Static assets (images, PDFs)
├── scripts/                        # Utility scripts
├── next.config.js                  # Next.js configuration
├── tsconfig.json                   # TypeScript settings
├── package.json                    # Dependencies and scripts
└── README.md
```

## 📡 API Documentation

### Authentication Endpoints

#### POST `/auth/register`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "plan": "free"
  }
}
```

#### POST `/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

### Course Generation

#### POST `/generate/outline`
Generate a course outline using AI.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "topic": "Introduction to Python Programming",
  "language": "en",
  "subtopics": ["Variables", "Functions", "Classes"]
}
```

**Response:**
```json
{
  "success": true,
  "courseId": "course-id",
  "outline": {
    "title": "Introduction to Python Programming",
    "summary": "A comprehensive course...",
    "modules": [
      {
        "order": 1,
        "title": "Getting Started",
        "lessons": [...]
      }
    ]
  }
}
```

#### POST `/generate/content`
Generate lesson content.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "courseId": "course-id",
  "moduleIndex": 0,
  "lessonIndex": 0,
  "language": "en"
}
```

### AI Tutor

#### POST `/chat`
Chat with AI tutor.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "message": "What is a variable?",
  "courseId": "course-id",
  "moduleTitle": "Getting Started",
  "lessonTitle": "Introduction",
  "conversationHistory": []
}
```

### Courses

#### GET `/courses`
Get all courses for the authenticated user.

#### GET `/courses/:id`
Get a specific course by ID.

#### POST `/courses`
Create a new empty course.

#### PUT `/courses/:id`
Update a course.

#### DELETE `/courses/:id`
Delete a course.

#### GET `/courses/:id/share`
Get public course view (no auth required).

### Progress & Analytics

#### GET `/progress/:courseId`
Get progress for a course.

#### POST `/progress/complete-lesson`
Mark a lesson as complete.

#### GET `/dashboard/stats`
Get user dashboard statistics.

### Quizzes

#### POST `/quiz/submit`
Submit quiz answers.

### Payments

#### GET `/payments/plans`
Get available subscription plans.

#### POST `/payments/checkout`
Create Stripe checkout session.

#### POST `/payments/confirm`
Confirm payment and update user plan.

### Certificates

#### GET `/certificates/:courseId`
Generate and download course completion certificate.

## 🎨 Features in Detail

### AI Course Generation

The platform uses advanced AI (OpenAI GPT-4o with Gemini fallback) to generate:

- **Course Outlines**: 6-8 modules with structured learning paths
- **Lesson Content**: 800-1200 words of comprehensive theory
- **Examples**: Real-world examples with code snippets
- **Exercises**: Progressive exercises from beginner to advanced
- **Quizzes**: 4-6 multiple-choice questions with explanations
- **Key Takeaways**: Summary points for each lesson

### AI Tutor Chat

Available for Pro users, the AI tutor provides:

- Context-aware responses based on current lesson
- 24/7 availability
- Multi-language support
- Educational guidance and explanations
- Conversation history tracking

### Image & Video Integration

The platform automatically searches for and integrates relevant educational media to enhance course content.

#### Image Search Implementation

**Primary Method: Google Images via g-i-s Library**
- Uses the [`g-i-s`](https://www.npmjs.com/package/g-i-s) npm package for Google Image Search scraping
- No API key required - uses web scraping approach
- Extracts image URLs, thumbnails, and metadata

**Fallback Methods (Multi-layer Strategy)**
1. **Custom Google Images Scraper**: Direct HTML scraping with multiple strategies to bypass blocking
   - Multiple User-Agent headers
   - Referer-based requests
   - Advanced pattern matching for image URL extraction
   - Rate limit handling

2. **Bing Images**: Alternative image source via Bing Images search
   - Direct HTML scraping from Bing Images
   - Pattern-based URL extraction
   - Proxy URL handling for expired links

3. **Alternative Image Sources**: Fallback to other educational image sources when primary methods fail

**Libraries Used:**
- `g-i-s` - Google Image Search scraping library
- `axios` - HTTP client for making requests
- `cheerio` - HTML parsing and manipulation

**Image Filtering & Validation:**
- Educational appropriateness checks
- Domain-based filtering (prioritizes .edu, Wikipedia, etc.)
- File type validation (PNG, JPG, JPEG, WebP, GIF)
- SVG blocking for compatibility
- Content relevance scoring

**Implementation Details:**
```typescript
// Primary: g-i-s library
const gis = require('g-i-s');
gis(query, (error, results) => {
  // Process Google Images results
});

// Fallback: Custom scraping
const response = await axios.get(googleImagesUrl, {
  headers: { 'User-Agent': '...' }
});
const imageUrls = extractImageUrls(html);
```

#### Video Search Implementation

**Primary Method: YouTube Data API v3**
- Official YouTube Data API for reliable video search
- Requires `YOUTUBE_API_KEY` environment variable
- Enhanced queries with educational keywords: `{topic} tutorial education learning course lesson`
- Video filtering for educational relevance
- Metadata extraction (title, description, thumbnail, duration, view count)

**Fallback Method: YouTube Search Scraping**
- Web scraping from YouTube search results page
- Uses `cheerio` for HTML parsing
- Extracts video data from embedded JSON in page HTML
- Validates educational relevance before including videos
- No API key required

**Quota Management:**
- Intelligent quota tracking system
- Automatic fallback when API quota is exceeded
- Periodic quota status checks
- Strategy selection based on quota availability

**Libraries Used:**
- `axios` - HTTP client for API requests and scraping
- `cheerio` - HTML parsing for web scraping fallback
- `@googleapis/youtube` (via YouTube Data API v3)

**Video Validation:**
- Educational keyword matching
- Title and description relevance checking
- Filters out non-educational content (music videos, entertainment, etc.)
- Prioritizes tutorial, course, and lesson content

**Implementation Details:**
```typescript
// Primary: YouTube Data API v3
const response = await axios.get(
  'https://www.googleapis.com/youtube/v3/search',
  {
    params: {
      part: 'snippet',
      q: enhancedQuery,
      type: 'video',
      maxResults: 10,
      key: YOUTUBE_API_KEY
    }
  }
);

// Fallback: YouTube Search Scraping
const $ = cheerio.load(response.data);
const videoData = extractVideoDataFromHTML($);
```

**Automatic Media Enhancement:**
- Images are automatically searched during lesson content generation
- Videos are fetched and embedded in lessons
- AI generates search prompts based on lesson context
- Multiple search strategies tried until success
- Context-aware image/video selection

### Progress Tracking

- Completion percentage per course
- Quiz scores and analytics
- Learning time tracking
- Visual progress charts
- Certificate generation upon completion

### Course Sharing

- Generate shareable public links
- No account required to view shared courses
- Customizable visibility settings

## 💎 Subscription Plans

### Free Student Plan
- ✅ 1 course maximum
- ✅ 2 modules per course
- ✅ AI-powered lessons
- ✅ Basic study materials
- ✅ Course sharing
- ❌ AI Tutor (Not available)
- ❌ Video integration (Not available)
- ❌ Certificates (Not available)

### Pro Learner (Monthly)
- 💰 $9/month
- ✅ Everything in Free
- ✅ Unlimited courses
- ✅ Unlimited modules
- ✅ 24/7 AI Study Tutor
- ✅ Visual learning aids
- ✅ Video lessons included
- ✅ PDF certificates with QR codes
- ✅ Detailed progress tracking

### Yearly Pro
- 💰 $99/year (Save $18)
- ✅ Everything in Monthly Pro
- ✅ 2 months free
- ✅ Early access to new features
- ✅ Premium course templates
- ✅ Advanced learning analytics

## 📚 Documentation

Comprehensive documentation is available in the `/all_doc` folder:

- **[Start Here](./all_doc/START_HERE.md)** - Quick start guide
- **[Environment Setup](./all_doc/ENV_SETUP_AI.md)** - Detailed environment configuration
- **[Authentication Setup](./all_doc/AUTH_SETUP.md)** - Auth system documentation
- **[Implementation Summary](./all_doc/IMPLEMENTATION_SUMMARY.md)** - Technical overview
- **[API Reference](./all_doc/CONTENT_API_REFERENCE.md)** - API documentation
- **[Testing Guide](./all_doc/QUICK_TEST_GUIDE.md)** - Testing instructions
- And many more...

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OpenAI for GPT-4o API
- Google for Gemini API
- MongoDB for database
- Stripe for payment processing
- Next.js and React communities

## 📞 Support

For support, please open an issue in the repository or contact the development team.

---

**Made with ❤️ by the AI Course Generator Team**
# ai_course
