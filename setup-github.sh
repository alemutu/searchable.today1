#!/bin/bash

# This script helps you set up a new GitHub repository and push your code to it

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up a new GitHub repository for your project...${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git if not already initialized
if [ ! -d .git ]; then
    echo -e "${GREEN}Initializing Git repository...${NC}"
    git init
else
    echo -e "${GREEN}Git repository already initialized.${NC}"
fi

# Add all files to git
echo -e "${GREEN}Adding files to Git...${NC}"
git add .

# Commit changes
echo -e "${GREEN}Committing files...${NC}"
git commit -m "Initial commit"

# Ask for GitHub repository URL
echo -e "${YELLOW}Please create a new repository on GitHub and enter the URL below:${NC}"
echo "Example: https://github.com/yourusername/your-repo.git"
read -p "GitHub repository URL: " repo_url

# Add remote
echo -e "${GREEN}Adding remote repository...${NC}"
git remote add origin $repo_url

# Push to GitHub
echo -e "${GREEN}Pushing code to GitHub...${NC}"
git push -u origin main || git push -u origin master

echo -e "${GREEN}Done! Your code has been pushed to GitHub.${NC}"
echo -e "${YELLOW}If you encountered any errors, make sure:${NC}"
echo "1. You have the correct repository URL"
echo "2. You have the necessary permissions to push to the repository"
echo "3. You have set up your GitHub credentials correctly"