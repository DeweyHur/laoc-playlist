#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Resetting remote database schema...${NC}"

# Confirm with user
read -p "Do you want to reset the remote database? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}Operation cancelled${NC}"
    exit 1
fi

echo -e "${GREEN}Resetting remote database...${NC}"

# First, merge the schema files
./scripts/merge-schema.sh

# Reset and push to the remote database
supabase db reset --linked
supabase db push

echo -e "${GREEN}Remote database reset complete!${NC}"
echo "Note: No test accounts were created." 