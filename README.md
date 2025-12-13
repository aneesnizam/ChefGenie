# ChefGenie - Smart Recipe Web

A modern recipe application built with Django and React.

## Features
- **Smart Recipe Management**: Browse and manage delicious recipes.
- **Modern UI**: Built with React and TailwindCSS for a responsive experience.
- **Robust Backend**: Powered by Django and Django REST Framework.

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- Node.js (for Frontend)
- Python (for Backend)

### 1. Backend Setup (Django)

Navigate to the Backend folder and start the server:

```bash
cd Backend

# Create and activate virtual environment (Recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the server
python manage.py runserver
```

The backend runs at `http://127.0.0.1:8000/`.

### 2. Frontend Setup (React + Vite)

Open a new terminal, navigate to the Frontend folder and start the application:

```bash
cd Frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will run at `http://localhost:5173/`.
