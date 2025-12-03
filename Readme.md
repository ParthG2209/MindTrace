# MindTrace

**AI-Powered Mentor Evaluation System**

An explainable evaluation platform that analyzes teaching sessions using advanced LLMs. Upload videos, get detailed feedback across multiple dimensions (clarity, structure, correctness, pacing, communication), and receive actionable insights to improve teaching quality.

[![Frontend](https://img.shields.io/badge/Frontend-Live%20on%20Vercel-00C7B7?style=for-the-badge&logo=vercel)](https://mind-trace-beta.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Deployed%20on%20HuggingFace-FFD21E?style=for-the-badge&logo=huggingface)](https://huggingface.co/spaces/ParthG2209/MindTrace)

---

## Live Demo

- **Frontend Application**: [https://mind-trace-beta.vercel.app/](https://mind-trace-beta.vercel.app/)
- **Backend API**: [https://huggingface.co/spaces/ParthG2209/MindTrace](https://huggingface.co/spaces/ParthG2209/MindTrace)
- **API Documentation**: [Backend URL]/docs

---

## Overview

MindTrace transforms teaching evaluation by providing:
- **AI-Powered Analysis**: Multi-dimensional evaluation using Google Gemini & Groq LLMs
- **Explainable Insights**: Evidence-based feedback with specific problematic phrases
- **Smart Rewrites**: AI-generated improvements for unclear explanations
- **Coherence Checking**: Detects contradictions, topic drift, and logical gaps
- **Visual Analytics**: Interactive charts and performance tracking
- **Real-time Processing**: Automated video transcription and segment analysis

---

## Current Features (Fully Functional)

### Core Evaluation System
- **Multi-Dimensional Scoring**: Evaluates teaching across 5 key metrics
  - Clarity (25% weight)
  - Structure (20% weight)
  - Correctness (25% weight)
  - Pacing (15% weight)
  - Communication (15% weight)
- **Segment-by-Segment Analysis**: Breaks down sessions into logical teaching units
- **Automated Transcription**: Converts video to timestamped text segments using Google Gemini
- **LLM-Powered Evaluation**: Uses Google Gemini 2.5 Flash for accurate, explainable feedback

### Mentor Management
- **Create & Manage Mentors**: Add mentors with expertise, bio, and contact information
- **Performance Tracking**: Track mentor performance over time with trend analysis
- **Session History**: View all sessions associated with each mentor
- **Statistics Dashboard**: Average scores, total sessions, and performance trends

### Session Management
- **Video Upload**: Support for MP4, MOV, AVI, MKV formats (up to 500MB)
- **Session Metadata**: Title, topic, duration, and mentor assignment
- **Status Tracking**: Real-time status updates (Uploaded → Transcribing → Analyzing → Completed)
- **Session Details**: Comprehensive view with evaluation results and visualizations

### Visual Analytics
- **Interactive Dashboard**: Real-time metrics and performance overview
- **Explanation Flow Graphs**: Visual representation of teaching quality progression
- **Performance Charts**: Line charts, bar charts, and area charts using Recharts
- **Score Distribution**: Visualize score ranges and trends
- **Comparative Analytics**: Compare mentor performance across sessions

### Authentication & Security
- **Firebase Authentication**: Email/password and Google OAuth sign-in
- **Protected Routes**: Secure dashboard and evaluation features
- **User Profiles**: Personalized user experience with profile management

---

## Coming Soon (Under Development)

### Evidence Extraction
- 🚧 **Problematic Phrase Detection**: Identify exact text causing low scores
- 🚧 **Character-Level Precision**: Pinpoint issues with start/end positions
- 🚧 **Issue Classification**: Categorize by severity (minor, moderate, major)
- 🚧 **Alternative Phrasing**: Suggest better ways to express concepts
- 🚧 **Contextual Feedback**: Explain why specific phrases are problematic

### Explanation Rewriting
- 🚧 **AI-Powered Rewrites**: Generate improved versions of low-scoring explanations
- 🚧 **Improvement Tracking**: Show specific changes and score improvements
- 🚧 **Multiple Versions**: Generate alternative rewrites for comparison
- 🚧 **Confidence Scoring**: Indicate reliability of suggested improvements
- 🚧 **Before/After Comparison**: Side-by-side view of original vs. rewritten

### Coherence Analysis
- 🚧 **Contradiction Detection**: Find statements that conflict with each other
- 🚧 **Topic Drift Identification**: Detect when explanations stray off-topic
- 🚧 **Logical Gap Analysis**: Identify missing steps or unexplained concepts
- 🚧 **Session-Wide Coherence Score**: Overall measure of logical consistency
- 🚧 **Resolution Suggestions**: Recommendations for fixing coherence issues

### Advanced Analytics
- 🚧 **Predictive Insights**: ML-based predictions for mentor improvement
- 🚧 **Comparative Benchmarking**: Compare against industry standards
- 🚧 **Custom Reports**: Generate PDF reports for stakeholders
- 🚧 **Export Functionality**: Download data in CSV/JSON formats

### UI/UX Enhancements
- 🚧 **Dark Mode Persistence**: Save theme preference across sessions
- 🚧 **Mobile Optimization**: Enhanced responsive design for all devices
- 🚧 **Keyboard Shortcuts**: Power user features for faster navigation
- 🚧 **Accessibility Improvements**: WCAG 2.1 Level AA compliance

---

## Architecture

### Backend (FastAPI + Python)
```
backend/
├── main.py                          # FastAPI application entry point
├── config.py                        # Configuration & environment variables
├── db.py                           # MongoDB async client setup
├── requirements.txt                # Python dependencies
├── Dockerfile                      # Docker container configuration
│
├── models/                         # Pydantic data models
│   ├── mentor.py                  # Mentor profile and stats
│   ├── session.py                 # Session with video metadata
│   ├── transcript.py              # Transcript with segments
│   ├── evaluation.py              # Evaluation scores and metrics
│   ├── evidence.py                # Evidence extraction (Coming Soon)
│   ├── rewrite.py                 # Explanation rewrites (Coming Soon)
│   └── coherence.py               # Coherence analysis (Coming Soon)
│
├── routes/                         # API endpoint handlers
│   ├── mentors.py                 # Mentor CRUD operations
│   ├── sessions.py                # Session management
│   ├── evaluations.py             # Evaluation orchestration
│   ├── evidence.py                # Evidence endpoints (Coming Soon)
│   ├── rewrites.py                # Rewrite endpoints (Coming Soon)
│   └── coherence.py               # Coherence endpoints (Coming Soon)
│
├── services/                       # Business logic layer
│   ├── llm_evaluator.py           # Core LLM-based evaluation
│   ├── transcription.py           # Video-to-text conversion (Gemini)
│   ├── segmentation.py            # Logical segment detection
│   ├── scoring.py                 # Score aggregation & metrics
│   ├── evidence_extractor.py      # Extract problematic phrases (Coming Soon)
│   ├── explanation_rewriter.py    # Generate improvements (Coming Soon)
│   └── coherence_checker.py       # Detect logical issues (Coming Soon)
│
└── utils/                          # Utility functions
    ├── llm_client.py              # Unified LLM interface (Gemini/Groq)
    ├── file_handler.py            # File upload/storage handling
    └── auth.py                    # Firebase authentication helpers
```

### Frontend (React + TailwindCSS)
```
frontend/
├── src/
│   ├── App.jsx                     # Main app component & routing
│   ├── index.jsx                   # React entry point
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── MentorCard.jsx          # Mentor display card
│   │   ├── SessionCard.jsx         # Session display card
│   │   ├── MetricCard.jsx          # Score metric card
│   │   ├── SegmentList.jsx         # Expandable segment list
│   │   ├── ExplanationGraph.jsx    # D3.js flow visualization
│   │   ├── EvidencePanel.jsx       # Evidence UI (Coming Soon)
│   │   ├── RewriteComparison.jsx   # Before/after comparison (Coming Soon)
│   │   └── CoherenceIssuesViewer.jsx # Coherence display (Coming Soon)
│   │
│   ├── pages/Dashboard/            # Dashboard pages
│   │   ├── DashboardHome.jsx       # Overview with stats
│   │   ├── MentorsPage.jsx         # Mentor management
│   │   ├── SessionsPage.jsx        # Session list and upload
│   │   ├── SessionDetailPage.jsx   # Detailed session view
│   │   ├── AnalyticsPage.jsx       # Performance analytics
│   │   ├── ProfilePage.jsx         # User profile
│   │   └── SettingsPage.jsx        # App settings
│   │
│   ├── layouts/                    # Layout components
│   │   └── DashboardLayout.jsx     # Sidebar + header layout
│   │
│   ├── api/                        # API client
│   │   └── client.js               # Axios HTTP client + endpoints
│   │
│   └── lib/                        # Utility libraries
│       ├── firebase.js             # Firebase configuration
│       └── utils.js                # Utility functions
│
└── public/
    └── index.html                  # HTML entry point
```

---

## Technology Stack

### Backend
- **Framework**: FastAPI (async Python web framework)
- **Database**: MongoDB (with Motor async driver)
- **LLM Integration**: 
  - Google Gemini 2.5 Flash (primary, free tier)
  - Groq LLaMA 3.3 70B (secondary, free tier)
- **Video Processing**: Google Gemini for transcription
- **Authentication**: Firebase Auth (optional)
- **Validation**: Pydantic v2
- **HTTP Client**: httpx (async)
- **Deployment**: Hugging Face Spaces

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **Styling**: TailwindCSS 3
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts + D3.js
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Authentication**: Firebase SDK
- **Deployment**: Vercel

---

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or cloud)
- Google API Key (for Gemini)
- Groq API Key (optional)

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
Create a `.env` file:
```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=mindtrace

# LLM Configuration
LLM_STRATEGY=hybrid
GOOGLE_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
FALLBACK_TO_MOCK=true

# JWT (if using custom auth)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=524288000  # 500MB in bytes

# Scoring Weights
WEIGHT_CLARITY=0.25
WEIGHT_STRUCTURE=0.20
WEIGHT_CORRECTNESS=0.25
WEIGHT_PACING=0.15
WEIGHT_COMMUNICATION=0.15
```

5. **Run the server**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file:
```env
REACT_APP_API_URL=https://huggingface.co/spaces/ParthG2209/MindTrace

# Firebase Configuration (optional)
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

4. **Start development server**
```bash
npm start
```

The application will open at `http://localhost:3000`

---

## Quick Start Guide

### 1. Sign Up / Login
- Visit [https://mind-trace-beta.vercel.app/](https://mind-trace-beta.vercel.app/)
- Sign up with email/password or Google OAuth
- Access the dashboard

### 2. Add a Mentor
- Navigate to "Mentors" in the sidebar
- Click "Add Mentor" button
- Fill in mentor details (name, email, expertise, bio)
- Click "Add Mentor"

### 3. Upload Teaching Session
- Click on a mentor or navigate to "Sessions"
- Click "Upload Session" button
- Fill in session details:
  - Select mentor from dropdown
  - Enter session title
  - Enter topic
  - Upload video file (MP4, MOV, AVI, MKV - max 500MB)
- Click "Upload"

### 4. Start Evaluation
- Session status will change to "Uploaded"
- Click on the session to view details
- Click "Start Evaluation" button
- Wait for transcription and analysis (2-5 minutes)
- Status will update automatically: Uploaded → Transcribing → Analyzing → Completed

### 5. View Results
- Once completed, view:
  - Overall score and metric breakdown
  - Explanation flow visualization
  - Segment-by-segment scores
  - Strengths and areas for improvement
  - Detailed feedback for each metric

---

## API Documentation

### Mentors

**Create Mentor**
```http
POST /api/mentors
Content-Type: application/json

{
  "name": "Dr. Sarah Chen",
  "email": "sarah@example.com",
  "expertise": ["Python", "Machine Learning"],
  "bio": "PhD in Computer Science"
}
```

**Get All Mentors**
```http
GET /api/mentors
```

**Get Mentor Stats**
```http
GET /api/mentors/{mentor_id}/stats
```

### Sessions

**Upload Session**
```http
POST /api/sessions
Content-Type: multipart/form-data

mentor_id: string
title: string
topic: string
video: file
```

**Get Sessions**
```http
GET /api/sessions?mentor_id={mentor_id}&status={status}
```

**Get Session Details**
```http
GET /api/sessions/{session_id}
```

### Evaluations

**Start Evaluation**
```http
POST /api/evaluations/sessions/{session_id}/evaluate
```

**Get Evaluation**
```http
GET /api/evaluations/sessions/{session_id}
```

**Get Evaluation Summary**
```http
GET /api/evaluations/{evaluation_id}/summary
```

### Coming Soon Endpoints

**Extract Evidence** (Under Development)
```http
POST /api/evidence/extract/{evaluation_id}
GET /api/evidence/{evaluation_id}
```

**Generate Rewrites** (Under Development)
```http
POST /api/rewrites/session/{session_id}
GET /api/rewrites/{session_id}
```

**Check Coherence** (Under Development)
```http
POST /api/coherence/check/{session_id}
GET /api/coherence/{session_id}
```

---

## Configuration Options

### Scoring Weights

Customize evaluation weights in `backend/config.py`:

```python
WEIGHT_CLARITY = 0.25        # 25%
WEIGHT_STRUCTURE = 0.20      # 20%
WEIGHT_CORRECTNESS = 0.25    # 25%
WEIGHT_PACING = 0.15         # 15%
WEIGHT_COMMUNICATION = 0.15  # 15%
```

### File Upload Limits

```python
MAX_UPLOAD_SIZE = 500 * 1024 * 1024  # 500MB
UPLOAD_DIR = "./uploads"
```

### LLM Settings

```python
# Use only Gemini
LLM_STRATEGY = "gemini"

# Use only Groq
LLM_STRATEGY = "groq"

# Use both with intelligent routing
LLM_STRATEGY = "hybrid"

# Enable mock fallback for testing
FALLBACK_TO_MOCK = True
```

---

## Roadmap

### Phase 1: Core Features (Completed)
- User authentication and profile management
- Mentor CRUD operations
- Video upload and session management
- AI-powered transcription with Google Gemini
- Multi-dimensional evaluation system
- Interactive dashboard with analytics
- Deployment on Vercel and Hugging Face

### Phase 2: Advanced Analysis (In Progress)
- Evidence extraction with problematic phrase detection
- Explanation rewriting with improvement suggestions
- Coherence analysis (contradictions, topic drift, logical gaps)
- Advanced analytics dashboard
- PDF report generation

### Phase 3: Enterprise Features (Planned)
- Real-time video streaming analysis
- Multi-language support (Spanish, French, German, Japanese)
- Team collaboration features
- Custom evaluation criteria configuration
- Integration with LMS platforms (Canvas, Moodle, Blackboard)
- Mobile application (iOS & Android)
- API webhooks for external integrations
- White-label solutions for institutions

---

## Demo Data

Load sample data for testing:

```bash
cd backend
python scripts/load_demo_data.py
```

This creates:
- 5 sample mentors
- 10 sample sessions with varying quality
- Complete evaluations with scores

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

**LLM API Errors**
- Verify API keys are correct in `.env`
- Check rate limits on Google AI Studio / Groq
- Enable FALLBACK_TO_MOCK for testing without API keys

**Video Upload Fails**
- Check file size (max 500MB)
- Verify supported formats: MP4, MOV, AVI, MKV
- Ensure UPLOAD_DIR exists and has write permissions

**Frontend Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**CORS Issues**
- Backend CORS is configured for:
  - `http://localhost:3000`
  - `https://mind-trace-beta.vercel.app`
  - `https://*.vercel.app`
  - Update `main.py` if deploying to different domain

---

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint/Prettier for JavaScript/React code
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## Acknowledgments

- **LLM Providers**: Google Gemini, Groq
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts, D3.js
- **Authentication**: Firebase
- **Deployment**: Vercel, Hugging Face Spaces
- **Icons**: Lucide React

---

## Contact & Support

- **Developer**: Parth Gupta
- **LinkedIn**: [linkedin.com/in/parth-gupta-4598b8324/](https://www.linkedin.com/in/parth-gupta-4598b8324/)
- **GitHub**: [github.com/ParthG2209/MindTrace](https://github.com/ParthG2209/MindTrace)
- **Email**: guptaparth2209@gmail.com

For questions, issues, or feature requests, please open an issue on GitHub.

---

## Project Status

![GitHub last commit](https://img.shields.io/github/last-commit/ParthG2209/MindTrace)
![GitHub issues](https://img.shields.io/github/issues/ParthG2209/MindTrace)
![GitHub pull requests](https://img.shields.io/github/issues-pr/ParthG2209/MindTrace)

**Current Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: Active Development

---

## Star History

If you find MindTrace useful, please consider starring the repository! It helps us understand what features the community values most.

[![Star History Chart](https://api.star-history.com/svg?repos=ParthG2209/MindTrace&type=Date)](https://star-history.com/#ParthG2209/MindTrace&Date)