# 🎓 CourseForge

> **Turn YouTube into a structured, personal LMS university.**

CourseForge transforms any YouTube video or full playlist into an interactive, structured course workspace. Organize modules, take timestamped Markdown notes per lesson, track step-by-step visual roadmaps, and auto-resume right where you left off.

---

## 🌟 Key Features

- 📺 **Native YouTube Integration**: Smooth YouTube IFrame player with native controls, quality selection, and speed persistence.
- ⚡ **Auto-Completion & Auto-Advance**: Completing a video automatically marks it done, triggers celebrations, and advances to the next lesson.
- ⏱ **Video-Wise Timestamped Notes**: Capture Markdown notes tied directly to exact video timestamps. Click any timestamp link to instantly jump to that moment in the video.
- 🗺 **Interactive Visual Roadmap**: Milestone node-based flowchart to visualize curriculum progression across modules.
- 🔄 **Automatic Resume & Memory**: Automatically saves your last watched video and playback position per course.
- 🔐 **Supabase Backend Sync**: Cloud sync with PostgreSQL schema, Row-Level Security (RLS), and OAuth authentication (Google, GitHub, Magic Links).
- 🔌 **Companion Chrome Extension**: Import any YouTube video or playlist straight into CourseForge with a single click while browsing YouTube.
- ⚡ **Zero-Latency Offline Cache**: Works completely locally with local storage fallback when unauthenticated.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Astro](https://astro.build/) |
| **UI Components** | [React 19](https://react.dev/) |
| **Styling** | Vanilla CSS Design System + [Tailwind CSS](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Backend & Auth** | [Supabase](https://supabase.com/) (PostgreSQL + RLS + Auth) |
| **Player SDK** | YouTube IFrame Player API |
| **Extension** | Manifest V3 Chrome Extension |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js** v18+ 
- **pnpm** (recommended) or `npm` / `yarn`

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/Bittu-the-coder/CourseForge.git
cd CourseForge

# Install dependencies
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Setup Supabase Database Schema

Run the SQL migration script located at `supabase/migrations/001_schema.sql` in your Supabase SQL Editor:
- Creates `profiles`, `courses`, `modules`, `videos`, `user_video_progress`, and `notes` tables.
- Enables Row Level Security (RLS) policies for user data isolation.

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

---

## 🔌 Installing the Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked** and select the `extension/` directory inside this repository.
4. Browse any YouTube video or playlist and click the **CourseForge** extension icon to import it into your LMS with 1 click!

---

## 📦 Deployment on Vercel

CourseForge includes pre-configured `vercel.json` settings:

```bash
# Build for production
pnpm build
```

Deploy directly via Vercel CLI or connect your GitHub repository on [Vercel](https://vercel.com/):
- **Framework Preset**: `Astro`
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for details.

Made with ❤️ by [Bittu-the-coder](https://github.com/Bittu-the-coder)
