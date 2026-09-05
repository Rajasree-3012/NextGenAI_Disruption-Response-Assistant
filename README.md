 Supply Chain Disruption Assistant

Supply Chain Disruption Assistant is a web-based application developed to help users identify,
monitor, and manage supply chain disruptions. The application uses React, TypeScript, Vite, and 
Tailwind CSS for the frontend, FastAPI and Python for the backend, and SQLite for data storage. 
It provides user authentication and APIs for managing supply chain-related information. The project 
can be run locally with the frontend and backend development servers.


Run the Project

Start the backend:

uvicorn backend.main:app --reload --port 8001

Start the frontend in another terminal:

npm run dev
Backend: http://localhost:8001
Frontend: http://localhost:8000
API Documentation

Once the backend is running:

http://localhost:8000/docs
