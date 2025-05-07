#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get database URL from Supabase
DB_URL=$(supabase db remote --show-url)

echo -e "${YELLOW}Resetting remote database schema...${NC}"

# Reset database with empty seed file
supabase db reset --linked

echo -e "${YELLOW}Applying schema files in order...${NC}"

# Apply schema files in order
for file in supabase/schema/{01,02,03,04,05,06}_*.sql; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}Applying $file...${NC}"
        PGPASSWORD=postgres psql "$DB_URL" -f "$file"
    fi
done

echo -e "${GREEN}Remote database reset complete!${NC}"
echo -e "${YELLOW}Note: No test accounts were created.${NC}" 