# Supabase Setup Guide

Follow these steps to enable data storage for the AI Study Guide.

## 1. Create Project
1.  Go to [supabase.com](https://supabase.com) and sign up/log in.
2.  Click **"New Project"**.
3.  Name it `AI Study Guide`.
4.  Set a database password (save it or forget it, you won't need it often).
5.  Choose a region close to you.
6.  Click **"Create new project"**.

## 2. Get Credentials
Once the project is created (takes ~1-2 mins):
1.  Go to **Project Settings** (gear icon at the bottom left).
2.  Go to **API**.
3.  Copy the `Project URL` and `anon` / `public` Key.
    *   You will need to paste these into the app's settings later.

## 3. Create Tables (SQL)
1.  Click the **SQL Editor** icon in the left sidebar.
2.  Paste the following code into the editor and click **Run**.

```sql
-- Create the table for storing study guides and quizzes
create table study_materials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  original_filename text,
  study_guide_content text, -- Markdown content
  quiz_data jsonb,          -- Quiz questions in JSON format
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table study_materials enable row level security;

-- Policy: Users can see their own data
create policy "Users can select their own study materials"
  on study_materials for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own data
create policy "Users can insert their own study materials"
  on study_materials for insert
  with check (auth.uid() = user_id);

-- Policy: Users can delete their own data
create policy "Users can delete their own study materials"
  on study_materials for delete
  using (auth.uid() = user_id);
```

## 4. Auth Settings (Google OAuth)
1.  **Google Cloud Console**:
    *   Go to [console.cloud.google.com](https://console.cloud.google.com/).
    *   Create a New Project.
    *   Go to **APIs & Services** > **OAuth consent screen**.
    *   Select **External** and Create. Fill in app name, email, etc.
    *   Go to **Credentials** > **Create Credentials** > **OAuth client ID**.
    *   Application type: **Web application**.
    *   **Authorized redirect URIs**:
        *   Add: `https://<your-project-ref>.supabase.co/auth/v1/callback`
        *   (Get this URL from Supabase Dashboard > Authentication > Providers > Google).
    *   Copy the **Client ID** and **Client Secret**.

2.  **Supabase Dashboard**:
    *   Go to **Authentication** > **Providers**.
    *   Select **Google**.
    *   Paste the **Client ID** and **Client Secret**.
    *   Turn **Enable Sign in with Google** ON.
    *   Click **Save**.

3.  **URL Configuration**:
    *   Go to **Authentication** > **URL Configuration**.
    *   Add your localhost (`http://localhost:8000`) and/or GitHub Pages URL (`https://<user>.github.io/<repo>`) to **Redirect URLs**.

