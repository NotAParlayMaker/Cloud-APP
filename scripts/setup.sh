#!/bin/bash

# OpenSportsAnalytics Setup Script

set -e

echo "🏀 OpenSportsAnalytics Setup"
echo "=============================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed"

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Create environment files
echo ""
echo "🔧 Setting up environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "⚠️  .env file already exists"
fi

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env file"
else
    echo "⚠️  backend/.env file already exists"
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p backend/uploads
mkdir -p backend/models
echo "✅ Directories created"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env files with database credentials"
echo "2. Start PostgreSQL database"
echo "3. Run 'npm run dev' to start development servers"
echo ""
echo "Or use Docker:"
echo "  docker-compose up -d"
echo ""
echo "Happy coding! 🚀"
