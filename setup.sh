#!/bin/bash

echo "===================================================="
echo "Delhi Municipal Corporation AI Helpline — SETUP"
echo "===================================================="

# Check Homebrew
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Redis
echo "Installing Redis..."
brew install redis

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "✅ Created .env file from example."
fi

# Make scripts executable
chmod +x start.sh stop.sh

echo ""
echo "===================================================="
echo "SETUP COMPLETE!"
echo "===================================================="
echo "Next steps:"
echo "  1. Edit the .env file and add your API keys:"
echo "     - TWILIO_ACCOUNT_SID"
echo "     - TWILIO_AUTH_TOKEN"
echo "     - TWILIO_PHONE_NUMBER"
echo "     - GROQ_API_KEY"
echo "     - BASE_URL (your ngrok URL)"
echo ""
echo "  2. Start the system:"
echo "     bash start.sh"
echo "===================================================="
