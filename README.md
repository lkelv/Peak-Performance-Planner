# Peak Performance Planner
Made by Kelvin, Yeeheng, Tom, Eric, Jonathan and Zhehan

**Peak Performance Planner** is a visual productivity tool that turns goal-setting into a **3D mountain climbing journey**.

Instead of traditional to-do lists, your progress is represented by climbing a mountain. Each milestone pushes you higher up the path. When every milestone is completed, you reach the **summit**.

The goal is to make productivity feel **motivating, visual, and rewarding**.

# Try our Website!
https://peak-performance-planner.vercel.app
To login:
- Email: test@demo.com
- Password: demo67

# How to set up and use locally
```
cd ppp
```
```
npm i
```
```
npm run dev
```

Add a `.env` file in directory `ppp`, which requires
```
VITE_SUPABASE_URL=https://tkkstayfjrykqxwixjah.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRra3N0YXlmanJ5a3F4d2l4amFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MzgwMTYsImV4cCI6MjA4OTAxNDAxNn0.QgF9rqp18qCwV8T8vKG8DAfEi746ouEKgfLN0-GVaOs
```


---

# Concept

Peak Performance Planner transforms productivity into a **visual metaphor**:

Rather than simply ticking tasks off a list, users **see their progress physically represented** in a dynamic 3D environment.

---

# Features

## Goal Setup
Users define a main goal and estimate the total time required.

Example:
- "Complete Semester 1"
- "Build Startup MVP"
- "Prepare for Final Exams"

---

## Milestones
Break large goals into smaller steps.

Each milestone becomes a **checkpoint flag on the mountain path**.

Completing milestones moves the climber further up the mountain.

---

## Interactive 3D Environment

The mountain environment is built using **React Three Fiber (Three.js for React)**.

The world includes:

- Procedurally repeating mountain sections
- A climbing avatar
- Cloud transitions between sections
- Background mountains and forests
- Dynamic camera movement
- Summit peak reveal

The world scrolls downward while the avatar remains fixed, creating the illusion of climbing upward.

---

## Dynamic Sky & Lighting

The environment reacts to **real-world time**.

Includes:

- Moving sun and moon
- Dynamic sky colors
- Day → dusk → night transitions
- Hemisphere and directional lighting adjustments

---

## Cloud Transitions

Cloud banks appear periodically as the mountain regenerates new terrain.

This hides section recycling and keeps the climb feeling seamless.

---

## Summit Event

When all milestones are completed:

1. The final **summit mountain section** appears
2. The avatar climbs the final path
3. Fireworks celebrate reaching the peak

---

## Focus Timer

Each goal includes a timer based on estimated hours.

The timer helps maintain focus while working through milestones.

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite

## 3D Engine

- Three.js
- React Three Fiber
- @react-three/drei

## Backend

- Supabase
  - Authentication
  - Session management

# Functionality
Press H - Toggle UI


# Authors
Made by Kelvin, Yeeheng, Tom, Eric, Jonathan and Zhehan
