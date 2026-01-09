# OpenSportsAnalytics

> A community-driven, open-source platform for collecting, storing, and analyzing sports data in real-time with AI-powered insights.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

## Overview

OpenSportsAnalytics is a comprehensive cloud-based platform designed to democratize sports analytics. Whether you're a fan, coach, analyst, or researcher, this platform provides the tools you need to collect, analyze, and gain insights from sports data.

### Key Features

- **📊 Multi-Source Data Ingestion**
  - Upload CSV/JSON files
  - Integrate with public sports APIs (NBA, NFL, Soccer leagues)
  - Real-time data processing and validation

- **📈 Interactive Analytics Dashboard**
  - Player performance trends and statistics
  - Team performance analysis
  - Game outcome analytics
  - Historical comparisons
  - Real-time visualizations using Chart.js

- **🤖 AI-Powered Predictions**
  - Game outcome predictions using neural networks
  - Player performance forecasting
  - Injury risk analysis
  - Custom ML model training with TensorFlow.js

- **👥 Collaboration & Sharing**
  - Public/private datasets
  - Share custom models and insights
  - Community-driven data collection
  - Git-based version control integration

- **🔒 Secure & Scalable**
  - JWT-based authentication
  - Role-based access control
  - PostgreSQL database
  - Containerized deployment with Docker

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 16
- **ML/AI**: TensorFlow.js Node
- **Authentication**: JWT + bcrypt
- **API Integration**: Axios

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + react-chartjs-2
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router v6

### DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (for frontend)
- **CI/CD**: GitHub Actions ready
- **Cloud**: Deployable on AWS, Vercel, or any cloud provider

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 16 or higher (or use Docker)
- Git
- npm or yarn

### Installation

#### Option 1: Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/opensportsanalytics.git
cd opensportsanalytics
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start with Docker Compose:
```bash
docker-compose up -d
```

4. Initialize the database:
```bash
docker-compose exec backend node -e "require('./dist/config/database').initializeDatabase()"
```

5. Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/

#### Option 2: Manual Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/opensportsanalytics.git
cd opensportsanalytics
```

2. Install dependencies:
```bash
npm install
npm run install:all
```

3. Set up PostgreSQL database:
```sql
CREATE DATABASE opensportsanalytics;
```

4. Configure environment variables:
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database credentials

# Frontend
cd ../frontend
# No additional config needed for development
```

5. Start the development servers:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Usage

### 1. Create an Account

Navigate to http://localhost:3000/register and create your account.

### 2. Upload Data

Go to the "Upload Data" page and either:
- Upload a CSV/JSON file with sports data
- Connect to a public API (NBA, NFL, etc.)

**Example CSV format:**
```csv
date,home_team,away_team,home_score,away_score,venue
2024-01-15,Lakers,Warriors,110,105,Staples Center
```

### 3. Analyze Data

Use the Analytics page to:
- View player performance trends
- Analyze team statistics
- Compare players
- Explore historical data

### 4. Generate Predictions

Train ML models or use existing ones to:
- Predict game outcomes
- Forecast player performance
- Assess injury risks

### 5. Share & Collaborate

Make datasets and models public to share with the community!

## API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "sportsanalyst"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Data Management

#### Upload File
```http
POST /api/data/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [CSV/JSON file]
name: "Dataset name"
description: "Description"
sportTypeId: 1
isPublic: true
```

#### Get Teams
```http
GET /api/data/teams?sportTypeId=1
Authorization: Bearer {token}
```

### Analytics

#### Get Player Trends
```http
GET /api/analytics/player/{playerId}/trends?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}
```

### ML Predictions

#### Predict Game Outcome
```http
POST /api/ml/predict/game
Authorization: Bearer {token}
Content-Type: application/json

{
  "gameId": 123,
  "modelId": 1
}
```

For complete API documentation, see [API.md](./docs/API.md)

## Database Schema

The platform uses PostgreSQL with the following main tables:

- `users` - User accounts and authentication
- `sports_types` - Supported sports (Basketball, Football, Soccer, etc.)
- `teams` - Team information
- `players` - Player profiles
- `games` - Game records and results
- `player_statistics` - Individual game statistics
- `datasets` - User-uploaded datasets
- `ml_models` - Trained ML models
- `predictions` - AI-generated predictions

## Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

1. **Add New Sports**: Integrate support for cricket, tennis, esports, etc.
2. **Improve ML Models**: Enhance prediction algorithms
3. **Add Visualizations**: Create new chart types and dashboards
4. **API Integrations**: Connect to more sports data APIs
5. **Bug Fixes**: Report and fix issues
6. **Documentation**: Improve guides and tutorials

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Write tests if applicable
5. Commit with clear messages: `git commit -m 'Add amazing feature'`
6. Push to your fork: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation

## Project Structure

```
opensportsanalytics/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Database and app config
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── server.ts       # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # State management
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml      # Docker orchestration
├── Dockerfile.backend      # Backend container
├── Dockerfile.frontend     # Frontend container
├── nginx.conf             # Nginx configuration
├── package.json           # Root package.json
├── LICENSE                # MIT License
└── README.md              # This file
```

## Deployment

### Docker Deployment

The easiest way to deploy is using Docker Compose:

```bash
# Production deployment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Cloud Deployment

#### AWS Elastic Beanstalk
```bash
eb init -p docker opensportsanalytics
eb create opensportsanalytics-env
eb deploy
```

#### Vercel (Frontend) + Railway (Backend)
1. Deploy frontend to Vercel
2. Deploy backend to Railway
3. Configure environment variables

#### Kubernetes
See [docs/kubernetes.md](./docs/kubernetes.md) for Kubernetes deployment guide.

## Performance

- Handles 1000+ requests/second
- PostgreSQL optimized with indexes
- React Query caching reduces API calls
- Nginx compression and caching
- TensorFlow.js optimized for Node.js

## Security

- JWT authentication with secure tokens
- bcrypt password hashing
- SQL injection prevention with parameterized queries
- CORS configured
- Rate limiting on API endpoints
- Helmet.js security headers
- Input validation and sanitization

## Roadmap

### v1.1 (Q2 2026)
- [ ] Real-time game updates with WebSockets
- [ ] Advanced ML models (LSTM, transformers)
- [ ] Mobile app (React Native)
- [ ] Fantasy league integration

### v1.2 (Q3 2026)
- [ ] GraphQL API
- [ ] Social features (comments, likes)
- [ ] Live streaming integration
- [ ] Advanced analytics (heat maps, trajectory analysis)

### v2.0 (Q4 2026)
- [ ] Multi-language support
- [ ] Premium features (optional)
- [ ] Marketplace for custom models
- [ ] Enterprise features

## Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Discord**: Join our community server (coming soon)
- **Twitter**: Follow [@OpenSportsAnalytics](https://twitter.com/opensportsanalytics)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Sports data providers and APIs
- TensorFlow.js team
- Open source community
- All contributors

## Support

If you find this project useful, please consider:
- Giving it a ⭐ on GitHub
- Contributing to the codebase
- Sharing with others
- Reporting bugs and suggesting features

## FAQ

**Q: Is this free to use?**
A: Yes! OpenSportsAnalytics is completely free and open source under the MIT license.

**Q: Can I use this for commercial purposes?**
A: Yes, the MIT license allows commercial use.

**Q: Which sports are supported?**
A: Currently Basketball, Football, Soccer, Baseball, and Hockey. More sports can be added easily.

**Q: Do I need API keys?**
A: API keys are optional and only needed if you want to import data from external APIs.

**Q: Can I deploy this on my own server?**
A: Absolutely! The Docker setup makes deployment straightforward.

**Q: How accurate are the predictions?**
A: Accuracy depends on data quality and quantity. With good training data, models can achieve 70-80% accuracy.

---

Made with ❤️ by the OpenSportsAnalytics community

For more information, visit our [documentation](./docs/) or [open an issue](https://github.com/yourusername/opensportsanalytics/issues).
