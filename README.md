📄 Smart Resume Screener          Watch Demo Video: 👉 https://www.youtube.com/watch?v=UbisAvrGNdg
Complete API documentation link - https://drive.google.com/file/d/1HkE6C80QHgKz3duigwAl2g-U1vWYmKzN/view
📚 Project Overview
The Smart Resume Screener is a full-stack, AI-powered platform that automates resume analysis and matching against job descriptions.
It uses advanced NLP techniques, semantic search, text similarity models, and Spring Boot microservices to generate detailed ATS-style fit scores, skill matches, and candidate summaries.

🔵 Important:
While OpenAI is used only for final summary generation (strengths/weaknesses), the core analysis — including skill extraction, experience calculation, education parsing, and semantic scoring — is fully built using custom NLP and ML models (spaCy, Sentence-Transformers, TF-IDF).

---
Architecture
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/8c4e7354-c799-4f9a-b1f7-8554a1d62290" />
---


⚙️ Project Architecture

Component	Tech Stack	Hosting
Frontend	React.js (Vite + Axios)	Vercel
Backend	Spring Boot	Render
AI Microservice	FastAPI + spaCy + Sentence-Transformers + OpenAI (for summary only)	Render
Database	PostgreSQL	Render
🖥️ Frontend (React.js)
Framework: React.js + Axios

Deployment: Vercel

Features:

Upload resumes and job descriptions

View ATS fit score, matched skills, experience, education

Real-time dashboard updates via WebSocket

Beautiful charts and popover summaries

🔗 Live Frontend:
👉 https://resume-ai-frontend-nr4m.vercel.app

🏗️ Backend (Spring Boot)
Authentication:

JWT-based signup/login

Resume Upload:

Receives resume + job description from frontend

Forwards them to the AI Microservice for analysis

Database:

Stores analysis and candidate information in PostgreSQL

WebSocket:

Broadcasts real-time analysis updates to dashboard

Dockerized:

Lightweight production Docker build

🐳 Dockerfile for Spring Boot Backend
dockerfile
Copy
Edit
FROM openjdk:21-jdk-slim
COPY target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
✅ Optimized lightweight image
✅ Cloud-native ready for AWS, Azure, Render, etc.

🔗 Live Backend:
👉 https://smart-resume-backend-6ggk.onrender.com

🧠 AI Microservice (FastAPI)
Framework: FastAPI

Main Analysis Done By:

spaCy NLP: Entity Recognition (Skills, Contact, Education)

SkillNER: Deep skill extraction

Sentence-Transformers: Semantic similarity between resume & JD

TF-IDF: Text-based keyword similarity

OpenAI GPT-4o-mini:

Used only to generate candidate summaries and strengths/weaknesses based on already extracted information.

Security:

CORS middleware enabled

🔗 Live AI Microservice:
👉 https://smart-resume-ai-2.onrender.com

🔥 AI Microservice API Endpoints

Method	Endpoint	Description
POST	/api/v1/analyze	Upload resume + job description, return full ATS analysis
GET	/api/v1/ping	Health check endpoint
📄 POST /api/v1/analyze (Request & Response)
Request
Form-Data:

resume (File) — PDF or DOCX file

job_description (String) — Job description text

Response
json
Copy
Edit
{
  "candidateName": "John Doe",
  "candidateEmail": "john.doe@example.com",
  "phoneNumber": "1234567890",
  "workExperiences": [...],
  "overallFitScore": 82.5,
  "semanticScore": 88.0,
  "tfidfScore": 72.0,
  "skillScore": 75.0,
  "experienceScore": 90.0,
  "educationScore": 100.0,
  "matchedSkills": ["python", "aws", "react"],
  "missingSkills": ["graphql"],
  "experience": "2.5 years",
  "educationDetails": [...],
  "fitCategory": "Very Good",
  "summary": "...",
  "strengths": ["Proficient in Python", "Experience with AWS", "Strong frontend skills"],
  "weaknesses": ["Limited GraphQL experience", "...", "..."],
  "fitExplanation": "Candidate matches key skills and experience but lacks GraphQL expertise."
}
🛠️ Core AI/NLP Technologies

Library	Usage
spaCy (en_core_web_md)	Resume entity extraction
SkillNER	Deep skill extraction from text
Sentence-Transformers (all-mpnet-base-v2)	Semantic similarity scoring
TF-IDF (scikit-learn)	Text keyword matching
OpenAI GPT-4o-mini	Summary + strengths/weaknesses generation ONLY (post-analysis)
🚀 Full System Workflow
User uploads resume + job description via frontend.

Backend sends the files to AI Microservice for deep NLP analysis.

AI Service:

Parses education, experience, and contact info.

Extracts and normalizes skills.

Calculates ATS fit score (semantic + TF-IDF + skill + experience + education).

Calls OpenAI only after scoring to generate human-readable summaries.

Backend saves analysis result to PostgreSQL.

Frontend updates dashboard in real-time using WebSocket and displays rich visualizations.

📦 Production Deployment Summary

Layer	Platform
Frontend	Vercel
Backend (Spring Boot)	Render
AI Microservice (FastAPI)	Render
Database (PostgreSQL)	Render
Docker	Used for backend containerization
📹 Live Demonstration
🔗 Watch Demo Video:
👉 https://www.youtube.com/watch?v=UbisAvrGNdg

💡 Highlights
✅ Custom-built AI/NLP pipelines (not OpenAI-dependent)
✅ End-to-end deployed, cloud-native architecture
✅ Fully Dockerized backend for scalable deployment
✅ Live real-time dashboard updates
✅ Highly accurate resume-to-job matching

🙌 Future Enhancements
Fine-tune scoring algorithms

Recommend keywords missing from resume

Interview question generation based on resume gaps

Admin panel for multi-candidate management

📬 Contact
Built with ❤️ by Prabhath Palakurthi.
