#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping any running Supabase instances...${NC}"
supabase stop

echo -e "${YELLOW}Starting Supabase...${NC}"
supabase start

echo -e "${YELLOW}Waiting for Supabase to be ready...${NC}"
sleep 5

echo -e "${YELLOW}Resetting database with schema and seed data...${NC}"
supabase db reset --local

echo -e "${GREEN}Supabase reset and setup complete!${NC}"
echo -e "${GREEN}Test accounts created:${NC}"
echo -e "Admin: admin@test.com / admin123"
echo -e "User: user@test.com / user123" 