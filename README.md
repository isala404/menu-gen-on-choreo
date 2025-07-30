# MenuGen - AI-Powered Menu Visualization

MenuGen transforms traditional, text-based restaurant menus into visually rich experiences using generative artificial intelligence. Upload a menu photo and watch as AI generates beautiful images for each dish.


## ✨ Features

- **Lightning Fast Processing**: Get your visual menu in under 90 seconds
- **AI-Powered**: Advanced AI creates perfect dish visualizations using GPT-4o and DALL-E 3
- **Progressive Loading**: See extracted menu items immediately while images generate
- **Responsive Design**: Beautiful UI that works on mobile and desktop
- **Professional Quality**: World-class design with attention to detail

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Go 1.21+
- Docker and Docker Compose
- OpenAI API Key

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/menu-gen-on-choreo.git
cd menu-gen-on-choreo
```

### 2. Start the Database

```bash
docker-compose up -d
```

### 3. Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your OpenAI API key
go mod download
go run .
```

### 4. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
```

### 5. Open the Application

Visit [http://localhost:5173](http://localhost:5173) and start uploading menus!

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Go + Gin + GORM
- **Database**: PostgreSQL 15
- **AI**: OpenAI GPT-4o (OCR) + DALL-E 3 (Image Generation)

### System Design

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   React     │    │   Go API    │    │ PostgreSQL  │
│   Frontend  │◄──►│   Server    │◄──►│  Database   │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │  OpenAI     │
                   │  API        │
                   └─────────────┘
```

### Key Components

- **Upload Zone**: Drag-and-drop interface with real-time feedback
- **Menu Display**: Progressive loading with status updates
- **AI Processing**: Background OCR and image generation
- **BLOB Storage**: All images stored directly in PostgreSQL

## 🎨 Design System

### Color Palette

- **Primary (Deep Plum)**: `#4A2A4A` - Rich, food-inspired primary color
- **Accent (Vibrant Coral)**: `#FF6B6B` - Energetic accent for actions
- **Background (Cream)**: `#FDF8F2` - Warm, organic background
- **Text (Charcoal)**: `#333333` - High-contrast readable text
- **Subtle (Stone)**: `#E0D8D3` - Gentle borders and dividers

### Typography

- **Headings**: Lora (Classic serif for elegance)
- **Body/UI**: Inter (Modern sans-serif for clarity)

## 📁 Project Structure

```
menu-gen-on-choreo/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── lib/             # API client and utilities
│   │   └── ...
│   ├── tailwind.config.js   # Tailwind configuration
│   └── package.json
├── backend/                 # Go backend
│   ├── main.go             # Server entry point
│   ├── handlers.go         # HTTP handlers
│   ├── models.go           # Database models
│   ├── .env                # Environment configuration
│   └── go.mod
├── docker-compose.yml      # PostgreSQL setup
└── README.md
```

## 🔧 Development

### Backend Commands

```bash
cd backend

# Run the server
go run .

# Format code
go fmt ./...

# Check for issues
go vet ./...

# Build for production
go build -o menugen .
```

### Frontend Commands

```bash
cd frontend

# Development server
npm run dev

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=menugen

# SSL Configuration
SSL_ENABLED=false

# OpenAI API Key (required)
OPENAI_API_KEY=your_openai_api_key_here

# Server Port
PORT=8080
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8080
```

## 📊 API Documentation

### Upload Menu

```http
POST /api/menus
Content-Type: multipart/form-data

{
  "image": <file>
}
```

**Response:**
```json
{
  "menu_id": "uuid"
}
```

### Get Menu Status

```http
GET /api/menus/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:01:30Z",
  "items": [
    {
      "id": "uuid",
      "item_text": "Margherita Pizza",
      "item_price": "$18.00",
      "generated_image_data": "base64_encoded_image",
      "generation_prompt": "Professional food photography of margherita pizza...",
      "created_at": "2024-01-01T00:01:00Z"
    }
  ]
}
```

### Status Values

- `PENDING`: Menu uploaded, processing not started
- `PROCESSING`: AI is extracting text and generating images
- `COMPLETED`: All processing finished successfully
- `FAILED`: Processing failed (check error field)

## 🚀 Deployment

### Production Checklist

- [ ] Set `SSL_ENABLED=true` in backend
- [ ] Configure proper SSL certificates
- [ ] Set production database credentials
- [ ] Set `VITE_API_BASE_URL` to production backend URL
- [ ] Enable HTTPS for all traffic
- [ ] Set up monitoring and logging

### Choreo Deployment

This application is designed to be deployed on the Choreo platform:

1. **Database**: Use Choreo's managed PostgreSQL service
2. **Backend**: Deploy as a Choreo service component
3. **Frontend**: Deploy as a Choreo web application

## 🔍 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart the database
docker-compose restart postgres
```

**OpenAI API Errors**
- Verify your API key is valid
- Check your OpenAI account has sufficient credits
- Ensure you have access to GPT-4o and DALL-E 3

**Frontend Build Issues**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**CORS Issues**
- Backend allows all origins by default
- Check if frontend URL matches `VITE_API_BASE_URL`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Andrej Karpathy's MenuGen project
- Built with love for the food and AI communities
- Powered by OpenAI's incredible AI models

---

**Made with ❤️ by the MenuGen Team**
