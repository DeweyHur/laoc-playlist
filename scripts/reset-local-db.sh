#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Resetting local database...${NC}"

# Stop any running instances
echo -e "${YELLOW}Stopping any running Supabase instances...${NC}"
supabase stop

# Start Supabase
echo -e "${YELLOW}Starting Supabase...${NC}"
supabase start

# Wait for Supabase to be ready
echo -e "${YELLOW}Waiting for Supabase to be ready...${NC}"
sleep 5

# Copy development seed file
echo -e "${YELLOW}Using development seed file...${NC}"
cp supabase/seed/dev_seed.sql supabase/seed.sql

# Reset database with development seed
supabase db reset

# Restore empty seed file
echo -e "${YELLOW}Restoring empty seed file...${NC}"
echo "-- Production seed file
-- This file intentionally left empty to prevent test accounts from being created in production" > supabase/seed.sql

echo -e "${GREEN}Local database reset complete!${NC}"
echo -e "${GREEN}Test accounts created:${NC}"
echo -e "Admin: admin@test.com / admin123"
echo -e "User: user@test.com / user123" 