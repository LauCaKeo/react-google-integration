#!/bin/bash

# React Google Integration - Development Start Script
echo "🚀 Starting React Google Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Pre-flight checks...${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Environment file (.env) not found${NC}"
    echo -e "${YELLOW}📝 Copying .env.example to .env...${NC}"
    cp .env.example .env
    echo -e "${RED}🛑 Please configure your .env file with actual credentials${NC}"
    echo -e "${BLUE}📚 See QUICK_SETUP.md for configuration guide${NC}"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}✅ Starting backend server on port 3001...${NC}"
# Start backend in background
node server.js &
BACKEND_PID=$!

# Give backend time to start
sleep 3

echo -e "${GREEN}✅ Starting React development server on port 3000...${NC}"
# Start frontend
npm start &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}🎉 Application is starting up!${NC}"
echo -e "${BLUE}Frontend: ${NC}http://localhost:3000"
echo -e "${BLUE}Backend:  ${NC}http://localhost:3001/api/health"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo -e "${BLUE}• Quick Setup: ${NC}./QUICK_SETUP.md"
echo -e "${BLUE}• Full Guide:  ${NC}./README.md"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop both servers${NC}"

# Function to cleanup processes
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ All servers stopped${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for processes
wait
