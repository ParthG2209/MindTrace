# MindTrace

**AI-Powered Mentor Evaluation System**

An explainable evaluation platform that analyzes teaching sessions using advanced LLMs. Upload videos, get detailed feedback across multiple dimensions (clarity, structure, correctness, pacing, communication), and receive actionable insights to improve teaching quality.

---

## Overview

MindTrace transforms teaching evaluation by providing:
- **AI-Powered Analysis**: Multi-dimensional evaluation using Google Gemini & Groq LLMs
- **Explainable Insights**: Evidence-based feedback with specific problematic phrases
- **Smart Rewrites**: AI-generated improvements for unclear explanations
- **Coherence Checking**: Detects contradictions, topic drift, and logical gaps
- **Visual Analytics**: Interactive charts and performance tracking

---

## Architecture

### Backend (FastAPI + Python)
```
backend/
├── main.py                          # FastAPI application entry point
├── config.py                        # Configuration & environment variables
├── db.py                           # MongoDB async client setup
├── requirements.txt                # Python dependencies
├── requiremnets.txt               # Legacy requirements file
├── Dockerfile                      # Docker container configuration
├── .gitignore                     # Git ignore rules
│
├── models/                         # Pydantic data models
│   ├── __init__.py                # Model exports
│   ├── mentor.py                  # Mentor model (profile, stats)
│   ├── session.py                 # Session model (video, status)
│   ├── transcript.py              # Transcript model (segments)
│   ├── evaluation.py              # Evaluation model (scores, metrics)
│   ├── evidence.py                # Evidence model (problematic phrases)
│   ├── rewrite.py                 # Rewrite model (improvements)
│   └── coherence.py               # Coherence model (contradictions, gaps)
│
├── routes/                         # API endpoint handlers
│   ├── __init__.py                # Route exports
│   ├── mentors.py                 # CRUD operations for mentors
│   ├── sessions.py                # Session upload & management
│   ├── evaluations.py             # Evaluation orchestration
│   ├── evidence.py                # Evidence extraction endpoints
│   ├── rewrites.py                # Rewrite generation endpoints
│   └── coherence.py               # Coherence checking endpoints
│
├── services/                       # Business logic layer
│   ├── __init__.py                # Service exports
│   ├── llm_evaluator.py           # Core LLM-based evaluation
│   ├── evidence_extractor.py      # Extract problematic phrases
│   ├── explanation_rewriter.py    # Generate improved explanations
│   ├── coherence_checker.py       # Detect logical issues
│   ├── transcription.py           # Video-to-text conversion
│   ├── segmentation.py            # Logical segment detection
│   └── scoring.py                 # Score aggregation & metrics
│
├── utils/                          # Utility functions
│   ├── __init__.py                # Utility exports
│   ├── llm_client.py              # Unified LLM interface (Gemini/Groq)
│   ├── file_handler.py            # File upload/storage handling
│   └── auth.py                    # Firebase authentication helpers
│
├── middleware/                     # HTTP middleware
│   ├── __init__.py
│   └── auth.py                    # Authentication middleware
│
├── scripts/                        # Utility scripts
│   ├── __init__.py
│   ├── load_demo_data.py          # Load sample data for testing
│   └── test_new_features.py       # Feature integration tests
│
├── tests/                          # Unit tests
│   └── __init__.py
│
└── test_api.py                     # API endpoint tests
### Frontend (React + TailwindCSS)
```
frontend/
├── public/
│   └── index.html                  # HTML entry point
│
├── src/
│   ├── index.jsx                   # React entry point
│   ├── App.jsx                     # Main app component & routing
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── MentorCard.jsx          # Mentor display card
│   │   ├── SessionCard.jsx         # Session display card
│   │   ├── MetricCard.jsx          # Score metric card
│   │   ├── SegmentList.jsx         # Expandable segment list
│   │   ├── ExplanationGraph.jsx    # D3.js flow visualization
│   │   ├── EvidencePanel.jsx       # Evidence extraction UI
│   │   ├── RewriteComparison.jsx   # Original vs improved comparison
│   │   └── CoherenceIssuesViewer.jsx # Coherence issues display
│   │
│   ├── components/ui/              # Base UI components (shadcn/ui)
│   │   ├── button.jsx              # Button component
│   │   ├── input.jsx               # Input component
│   │   ├── label.jsx               # Label component
│   │   ├── checkbox.jsx            # Checkbox component
│   │   ├── sparkles.jsx            # Sparkle animation effect
│   │   ├── animated-hero.jsx       # Animated hero section
│   │   ├── container-scroll-animation.jsx # Scroll animation
│   │   ├── animated-characters-login-page.jsx # Login with animations
│   │   ├── mindtrace-footer.jsx    # Custom footer
│   │   └── modern-animated-footer.jsx # Animated footer base
│   │
│   ├── pages/                      # Page components
│   │   ├── LandingPage.jsx         # Marketing landing page
│   │   ├── MentorDashboard.jsx     # Legacy mentor dashboard
│   │   ├── SessionsPage.jsx        # Legacy sessions page
│   │   ├── SessionDetailPage.jsx   # Legacy session detail
│   │   ├── DemoOne.jsx             # Demo login page
│   │   │
│   │   └── Dashboard/              # Main dashboard pages
│   │       ├── DashboardHome.jsx   # Dashboard overview
│   │       ├── MentorsPage.jsx     # Mentor management
│   │       ├── SessionsPage.jsx    # Session management
│   │       ├── SessionDetailPage.jsx # Detailed session view
│   │       ├── AnalyticsPage.jsx   # Performance analytics
│   │       ├── ProfilePage.jsx     # User profile
│   │       └── SettingsPage.jsx    # Application settings
│   │
│   ├── layouts/                    # Layout components
│   │   └── DashboardLayout.jsx     # Sidebar + header layout
│   │
│   ├── api/                        # API client
│   │   └── client.js               # Axios HTTP client + endpoints
│   │
│   ├── lib/                        # Utility libraries
│   │   ├── firebase.js             # Firebase configuration
│   │   └── utils.js                # Utility functions (cn, etc.)
│   │
│   ├── styles/                     # Global styles
│   │   └── index.css               # Tailwind + custom CSS
│   │
│   └── ui/                         # Duplicate UI components (legacy)
│       ├── animated-characters-login-page.jsx
│       ├── button.jsx
│       ├── checkbox.jsx
│       ├── input.jsx
│       └── label.jsx
│
├── package.json                    # NPM dependencies & scripts
├── package-lock.json               # NPM lock file
├── tailwind.config.js              # Tailwind configuration
├── postcss.config.js               # PostCSS configuration
├── jsconfig.json                   # JavaScript configuration
├── Dockerfile                      # Docker container configuration
├── nginx.conf                      # Nginx web server config
└── .gitignore                     # Git ignore rules

---

## Features

### 1. Core Evaluation System
- **Multi-Dimensional Scoring**: Evaluates teaching across 5 key metrics
  - Clarity (25% weight)
  - Structure (20% weight)
  - Correctness (25% weight)
  - Pacing (15% weight)
  - Communication (15% weight)
- **Segment-by-Segment Analysis**: Breaks down sessions into logical teaching units
- **Automated Transcription**: Converts video to timestamped text segments

### 2. Explainable AI Features
- **Evidence Extraction**: Identifies exact problematic phrases with character-level precision
- **Issue Classification**: Categorizes problems by severity (minor, moderate, major)
- **Alternative Phrasing**: Suggests better ways to express unclear concepts
- **Contextual Feedback**: Explains why specific phrases are problematic

### 3. Explanation Rewriting
- **AI-Powered Rewrites**: Generates improved versions of low-scoring explanations
- **Improvement Tracking**: Shows specific changes and estimated score improvements
- **Multiple Versions**: Can generate alternative rewrites for comparison
- **Confidence Scoring**: Indicates reliability of suggested improvements

### 4. Coherence Analysis
- **Contradiction Detection**: Finds statements that conflict with each other
- **Topic Drift Identification**: Detects when explanations stray off-topic
- **Logical Gap Analysis**: Identifies missing steps or unexplained concepts
- **Session-Wide Coherence Score**: Overall measure of logical consistency

### 5. Visual Analytics
- **Performance Dashboards**: Real-time metrics and trends
- **Explanation Flow Graphs**: Visual representation of teaching quality progression
- **Comparative Analytics**: Track mentor performance over time
- **Interactive Charts**: Drill down into specific metrics and segments

---

## Technology Stack

### Backend
- **Framework**: FastAPI (async Python web framework)
- **Database**: MongoDB (with Motor async driver)
- **LLM Integration**: 
  - Google Gemini 2.5 Flash (primary, free)
  - Groq LLaMA 3.1 70B (secondary, free)
- **Authentication**: Firebase Auth (optional)
- **Validation**: Pydantic v2
- **HTTP Client**: httpx (async)

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **Styling**: TailwindCSS 3
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts + D3.js
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Authentication**: Firebase SDK

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
REACT_APP_API_URL=http://localhost:8000

# Firebase Configuration (optional)
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. **Start development server**
```bash
npm start
```

The application will open at `http://localhost:3000`

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

### Evidence

**Extract Evidence**
```http
POST /api/evidence/extract/{evaluation_id}
```

**Get Evidence**
```http
GET /api/evidence/{evaluation_id}
```

**Get Evidence by Metric**
```http
GET /api/evidence/{evaluation_id}/metric/{metric_name}
```

### Rewrites

**Generate Rewrites**
```http
POST /api/rewrites/session/{session_id}
```

**Get Rewrites**
```http
GET /api/rewrites/{session_id}
```

**Get Rewrite Comparison**
```http
GET /api/rewrites/{session_id}/comparison
```

### Coherence

**Check Coherence**
```http
POST /api/coherence/check/{session_id}
```

**Get Coherence Report**
```http
GET /api/coherence/{session_id}
```

**Get Contradictions**
```http
GET /api/coherence/{session_id}/contradictions
```

**Get Logical Gaps**
```http
GET /api/coherence/{session_id}/gaps
```

---

## Usage Guide

### 1. Add a Mentor

1. Navigate to the Dashboard
2. Click "Mentors" in the sidebar
3. Click "Add Mentor" button
4. Fill in mentor details:
   - Name
   - Email
   - Expertise areas (comma-separated)
   - Bio (optional)
5. Click "Add Mentor"

### 2. Upload Teaching Session

1. Select a mentor from the Mentors page
2. Click "Upload Session"
3. Fill in session details:
   - Title (e.g., "Python Decorators Explained")
   - Topic (e.g., "Python Programming")
   - Video file (MP4, MOV, AVI, MKV - max 500MB)
4. Click "Upload"

### 3. Run Evaluation

1. Navigate to Sessions
2. Click on an uploaded session
3. Click "Start Evaluation"
4. Wait for processing (transcription + analysis)
5. View results when status shows "Completed"

### 4. Explore Results

**Overview Tab**
- Overall score and metric breakdown
- Explanation flow visualization
- Strengths and areas for improvement

**Segments Tab**
- Detailed segment-by-segment scores
- Expand segments to see individual metric feedback

**Evidence Tab**
- Extract specific problematic phrases
- View issue explanations and suggestions
- Filter by metric or segment

**Rewrites Tab**
- Generate improved explanations
- Compare original vs. rewritten versions
- See estimated score improvements

**Coherence Tab**
- Check for contradictions
- Identify topic drift
- Find logical gaps in explanations

---

## LLM Configuration

### Unified LLM Client

The system uses a unified client that supports multiple LLM providers with intelligent routing:

**Default Configuration**
```python
# config.py
LLM_STRATEGY = "hybrid"  # Uses both Gemini and Groq
GOOGLE_API_KEY = "your_gemini_key"
GROQ_API_KEY = "your_groq_key"
FALLBACK_TO_MOCK = True  # Use mock responses if APIs fail
```

**Task Routing**
- **Evaluation**: Gemini (frequent, needs accuracy)
- **Evidence**: Gemini (needs precision)
- **Rewrite**: Groq (needs speed)
- **Coherence**: Groq (complex reasoning)

### Obtaining API Keys

**Google Gemini** (Free)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and add to `.env`

**Groq** (Free)
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up for an account
3. Generate API key
4. Copy and add to `.env`

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

## Testing

### Backend Tests

```bash
cd backend
pytest
```

### Test New Features

```bash
cd backend
python scripts/test_new_features.py
```

Tests:
- LLM client functionality
- Evidence extraction
- Explanation rewriting
- Coherence checking
- Full analysis pipeline

### Frontend Tests

```bash
cd frontend
npm test
```

---

## Docker Deployment

### Using Docker Compose

1. **Build and start services**
```bash
docker-compose up -d
```

2. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Individual Container Deployment

**Backend**
```bash
cd backend
docker build -t mindtrace-backend .
docker run -p 8000:8000 --env-file .env mindtrace-backend
```

**Frontend**
```bash
cd frontend
docker build -t mindtrace-frontend .
docker run -p 3000:80 mindtrace-frontend
```

---

## Project Structure Details

### Data Models

**Mentor**
- Profile information
- Expertise areas
- Performance statistics

**Session**
- Video metadata
- Processing status
- Associated evaluations

**Evaluation**
- Overall score (1-10)
- 5 metric scores
- Segment-level evaluations

**Evidence**
- Problematic phrase
- Character position
- Issue explanation
- Suggested improvement

**Rewrite**
- Original text
- Improved version
- List of improvements
- Estimated score gain

**Coherence**
- Contradictions
- Topic drifts
- Logical gaps
- Overall coherence score

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
- Verify API keys are correct
- Check rate limits
- Enable FALLBACK_TO_MOCK for testing

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

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- **LLM Providers**: Google Gemini, Groq
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts, D3.js
- **Authentication**: Firebase

---

## Contact

For questions or support, please open an issue on GitHub.

---

## Roadmap

- Real-time video streaming analysis
- Multi-language support
- Advanced analytics dashboard
- Mobile application
- Integration with learning management systems
- Custom evaluation criteria configuration
- Collaborative feedback features