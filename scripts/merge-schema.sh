#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Merging schema files...${NC}"

# Create complete schema file
cat supabase/schema/01_types.sql > supabase/complete_schema.sql
echo "" >> supabase/complete_schema.sql
cat supabase/schema/02_functions.sql >> supabase/complete_schema.sql
echo "" >> supabase/complete_schema.sql
cat supabase/schema/03_users.sql >> supabase/complete_schema.sql
echo "" >> supabase/complete_schema.sql
cat supabase/schema/04_playlists.sql >> supabase/complete_schema.sql
echo "" >> supabase/complete_schema.sql
cat supabase/schema/05_performances.sql >> supabase/complete_schema.sql
echo "" >> supabase/complete_schema.sql
cat supabase/schema/06_views.sql >> supabase/complete_schema.sql

echo -e "${GREEN}Schema files merged into supabase/complete_schema.sql${NC}"
echo -e "${YELLOW}Note: supabase/complete_schema.sql is not tracked in git.${NC}" 