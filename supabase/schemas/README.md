# Database Schema

This directory contains the organized database schema for the LAOC Playlist application. The schema is split into multiple files for better organization and maintainability.

## File Structure

1. `01_types.sql` - Custom types and enums used throughout the schema
2. `02_functions.sql` - Utility functions and triggers
3. `03_users.sql` - User-related tables and policies
4. `04_playlists.sql` - Playlist and video management tables
5. `05_performances.sql` - Performance and role management tables
6. `06_views.sql` - Database views for common queries

## Installation

The files should be executed in numerical order to ensure proper dependency resolution. For example:

```bash
psql -f 01_types.sql
psql -f 02_functions.sql
psql -f 03_users.sql
psql -f 04_playlists.sql
psql -f 05_performances.sql
psql -f 06_views.sql
```

## Schema Overview

### Users and Authentication
- User profiles with instrument preferences
- Role-based access control
- Development mode support

### Playlists
- User-created playlists
- YouTube video integration
- Order management for videos

### Performances
- Regular performance management
- Video role assignments
- Participant tracking

### Views
- User profiles with email information
- Performance participant details

## Security

All tables have Row Level Security (RLS) enabled with appropriate policies to ensure:
- Users can only access their own data
- Admins and development users have additional privileges
- Public access is restricted to viewing only 