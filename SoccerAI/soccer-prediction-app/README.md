# Soccer Prediction Application

A modern web application for analyzing and predicting soccer match outcomes using advanced machine learning and real-time data collection.

## Features

- **Real-time Data Collection**: Automated scraping from major European leagues
- **Advanced Analytics**: Machine learning models with 80-90% accuracy target
- **Interactive Dashboard**: Professional analyst-style interface
- **Team Comparison**: Side-by-side statistical analysis
- **Prediction Tracking**: Performance monitoring and accuracy metrics

## Technology Stack

- **Frontend**: React.js with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Redis caching
- **Machine Learning**: Python with Scikit-learn, XGBoost
- **Data Collection**: Firecrawl, Crawle4AI
- **Deployment**: Docker, CI/CD with GitHub Actions

## League Coverage

- Premier League
- La Liga
- Serie A
- Bundesliga
- Ligue 1

## Project Structure

```
/soccer-prediction-app
├── /frontend          # React application
├── /backend          # Node.js API
├── /data-collection  # Python scrapers
├── /ml-models        # ML pipeline
├── /database         # Database configurations
└── /docs            # Documentation
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+

### Installation

1. Clone the repository
2. Copy environment template: `cp .env.example .env`
3. Start with Docker: `docker-compose up -d`
4. Install frontend dependencies: `cd frontend && npm install`
5. Install backend dependencies: `cd backend && npm install`

## Development

### Backend API
- **Port**: 3001
- **Documentation**: http://localhost:3001/api-docs

### Frontend Application
- **Port**: 3000
- **Development**: http://localhost:3000

### Database
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License
