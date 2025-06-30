# Acquainted - Relationship Intelligence Assistant

A modern web application for managing relationships and never missing important dates. Built with Next.js, React, TypeScript, and Supabase.

## 🌟 Features

### 👥 Contact Management
- **Create & Edit Contacts**: Add detailed contact information including names, birthdays, and preferences
- **Contact Search**: Real-time search with highlighting
- **Contact Details**: View comprehensive contact information with favorites and preferences
- **Notes System**: Add and manage notes for each contact

### 📅 Event Management
- **Calendar Integration**: Visual calendar with event indicators
- **Event Creation**: Add custom events and link them to contacts
- **Birthday Tracking**: Automatic birthday events from contact data
- **Event Types**: Support for birthdays, anniversaries, and custom events
- **Date Selection**: Easy event creation with contact association

### 📊 Dashboard & Analytics
- **Overview Dashboard**: Quick stats and insights
- **Contact Statistics**: Total contacts and upcoming birthdays
- **Calendar View**: Monthly calendar with event indicators
- **Event List**: View events for any selected date

### 🔐 Authentication & Security
- **User Authentication**: Secure login and signup with Supabase Auth
- **Data Privacy**: Each user's data is isolated and secure
- **Session Management**: Automatic session handling

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on desktop and mobile
- **Modern Interface**: Clean, professional design with smooth animations
- **Accessibility**: Proper focus states and keyboard navigation
- **Loading States**: Smooth loading experiences throughout the app

## 🚀 Tech Stack

### Frontend
- **Next.js 14**
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **date-fns** - Date manipulation library

### Backend & Database
- **Supabase**
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Authentication
  - Storage

## 📁 Project Structure

```
acquainted/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── dashboard/   # Dashboard page
│   │   │   ├── contacts/    # Contact management pages
│   │   │   ├── login/       # Authentication pages
│   │   │   └── signup/
│   │   ├── components/      # Reusable components
│   │   └── lib/            # Utilities and configurations
│   ├── public/             # Static assets
│   └── package.json
```

## 🐛 Known Issues

- None currently reported

