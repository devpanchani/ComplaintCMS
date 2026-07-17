# 🚀 AI-Powered Complaint Management System

A sophisticated institutional grievance management platform built with **React, Vite, Tailwind CSS (v4), and OpenRouter AI.**

## ✨ Key Features
- **🤖 Advanced AI Integration**: Automated complaint classification, sentiment analysis, and intelligent auto-response drafting powered by state-of-the-art AI models (GPT-4o via OpenRouter).
- **☁️ Cloud Backend**: Real-time data persistence powered by **Supabase (PostgreSQL)** for cross-device syncing.
- **🔔 Notification Engine**: In-app notification center for students and admins with auto-escalation for pending cases.
- **📊 Strategic Analytics**: Macro-level insight dashboard to identify root causes and systemic bottlenecks.
- **🎨 Premium UI**: Modern glassmorphism design with glowing orbs, smooth animations, and highly responsive layouts for both mobile and desktop.
- **🛡️ Strict Validation**: Real-time form validation for emails, phone numbers, and required fields.

## 🛠️ Tech Stack
- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS v4 + Custom Vanilla CSS for animations
- **Database**: Supabase (PostgreSQL)
- **AI Engine**: OpenRouter API (`openai/gpt-4o`)
- **Icons**: Lucide React
- **Charts**: Recharts

## 📥 Setup Instructions

### 1. Clone the repository:
```bash
git clone https://github.com/devpanchani/ComplaintCMS.git
cd ComplaintCMS
```

### 2. Install dependencies:
```bash
npm install
```

### 3. Configure Environment Variables:
Copy the template file to create your own `.env` file:
```bash
cp .env.example .env
```
Then, edit the `.env` file and insert your actual API keys:
```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
*(Note: Never commit your real `.env` file to GitHub!)*

### 4. Run the development server:
```bash
npm run dev
```

## 📜 Business Logic
- **Triage**: Complaints are automatically analyzed upon submission to assign priority based on emotional tone.
- **SLA**: Tickets pending for more than 48 hours are automatically escalated to Admin alerts.
- **Security**: Admin features are restricted to verified accounts.

## 👥 Demo Accounts
To test the admin features, you can log in via the Admin Panel using the following credentials:
- **Admin**: `admin@cms.com` / `admin123`
- **User**: `john@example.com` / `user123`
