# Smart Nyuki Database Schema Documentation

This document provides a comprehensive overview of the database structure for the Smart Nyuki beekeeping application. The database is built on PostgreSQL with Supabase as the backend service.

## Schemas Overview

| Schema Name | Size | Table Count | Description |
|-------------|------|-------------|-------------|
| public | 1376 kB | 18 | Main application data |
| auth | 952 kB | 16 | Authentication and user management |
| storage | 144 kB | 5 | File storage system |
| realtime | 56 kB | 3 | Real-time data handling |
| vault | 24 kB | 1 | Secure information storage |
| supabase_migrations | 112 kB | 1 | Database migration tracking |
| extensions | 0 bytes | 0 | PostgreSQL extensions |
| graphql | 0 bytes | 0 | GraphQL API support |
| graphql_public | 0 bytes | 0 | Public GraphQL interface |

## Public Schema (Application Data)

### Profiles Table

Primary user profile information linked to authentication.

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | uuid | NO | | Primary Key, Foreign Key to auth.users |
| username | character varying | YES | | User's chosen username |
| first_name | character varying | YES | | User's first name |
| last_name | character varying | YES | | User's last name |
| avatar_url | text | YES | | URL to user's profile picture |
| company | character varying | YES | | Company or organization name |
| experience_level | character varying | YES | | Level of beekeeping experience |
| bio | text | YES | | User biography |
| location | character varying | YES | | User's location |
| website | character varying | YES | | User's website URL |
| social_links | jsonb | YES | | JSON object of social media links |
| preferences | jsonb | YES | | User preferences as JSON |
| role | character varying | YES | 'beekeeper' | User role in the system |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |
| updated_at | timestamp with time zone | NO | now() | Last update timestamp |

### Apiaries Table

Represents beekeeping locations containing multiple hives.

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| name | character varying | NO | | Apiary name |
| location | character varying | YES | | Physical location description |
| latitude | numeric | YES | | GPS latitude coordinate |
| longitude | numeric | YES | | GPS longitude coordinate |
| elevation | numeric | YES | | Elevation in meters |
| notes | text | YES | | General notes about the apiary |
| image_url | text | YES | | URL to apiary image |
| user_id | uuid | NO | | Foreign Key to auth.users |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |
| updated_at | timestamp with time zone | NO | now() | Last update timestamp |

### Hives Table

Individual beehives within apiaries.

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| hive_id | text | NO | | Primary Key, unique identifier |
| name | character varying | NO | | Hive name |
| apiary_id | uuid | NO | | Foreign Key to apiaries |
| type | character varying | YES | | Hive type (Langstroth, etc.) |
| status | character varying | NO | 'active' | Hive status |
| installation_date | date | YES | | When the hive was installed |
| queen_introduced_date | date | YES | | When the queen was introduced |
| queen_type | character varying | YES | | Type of queen |
| queen_marked | boolean | YES | false | Whether queen is marked |
| queen_marking_color | character varying | YES | | Color used to mark queen |
| notes | text | YES | | General notes |
| image_url | text | YES | | URL to hive image |
| user_id | uuid | NO | | Foreign Key to auth.users |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |
| updated_at | timestamp with time zone | NO | now() | Last update timestamp |
| is_registered | boolean | YES | true | Registration status |

### Inspections Table

Records of hive inspections.

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| hive_id | text | NO | | Foreign Key to hives |
| inspection_date | timestamp with time zone | NO | now() | When inspection occurred |
| weight | numeric | YES | | Hive weight measurement |
| temperature | numeric | YES | | Temperature during inspection |
| humidity | numeric | YES | | Humidity during inspection |
| weather_conditions | character varying | YES | | Weather conditions |
| hive_strength | integer | YES | | Strength rating (1-10) |
| queen_seen | boolean | YES | false | Whether queen was spotted |
| eggs_seen | boolean | YES | false | Whether eggs were spotted |
| larvae_seen | boolean | YES | false | Whether larvae were spotted |
| queen_cells_seen | boolean | YES | false | Whether queen cells were spotted |
| disease_signs | boolean | YES | false | Signs of disease present |
| disease_details | text | YES | | Disease details if present |
| varroa_check | boolean | YES | false | Whether varroa mites were checked |
| varroa_count | integer | YES | | Count of varroa mites |
| honey_stores | integer | YES | | Honey stores rating |
| pollen_stores | integer | YES | | Pollen stores rating |
| added_supers | integer | YES | 0 | Number of supers added |
| removed_supers | integer | YES | 0 | Number of supers removed |
| feed_added | boolean | YES | false | Whether feed was added |
| feed_type | character varying | YES | | Type of feed added |
| feed_amount | character varying | YES | | Amount of feed added |
| medications_added | boolean | YES | false | Whether medications were added |
| medication_details | text | YES | | Details of medications |
| notes | text | YES | | General inspection notes |
| images | jsonb | YES | | JSON array of image URLs |
| user_id | uuid | NO | | Foreign Key to auth.users |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |
| updated_at | timestamp with time zone | NO | now() | Last update timestamp |

### Metrics Table

Core metrics data for hives.

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| hive_id | text | NO | | Foreign Key to hives |
| type | character varying | NO | | Metric type |
| value | numeric | NO | | Metric value |
| timestamp | timestamp with time zone | NO | | When metric was recorded |
| unit | character varying | NO | | Unit of measurement |
| user_id | uuid | NO | | Foreign Key to auth.users |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |

### Metrics Time Series Data Table

Time-series data for hive monitoring.

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| hive_id | text | NO | | Foreign Key to hives |
| time | character varying | NO | | Time representation |
| timestamp | timestamp with time zone | NO | | Precise timestamp |
| temp_value | numeric | YES | | Temperature value |
| hum_value | numeric | YES | | Humidity value |
| sound_value | numeric | YES | | Sound level value |
| weight_value | numeric | YES | | Weight value |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |

### Alerts Table

System-generated alerts for hives.

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| hive_id | text | NO | | Foreign Key to hives |
| type | character varying | NO | | Alert type |
| message | character varying | NO | | Alert message |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |
| is_read | boolean | NO | false | Whether alert was read |
| severity | character varying | NO | | Alert severity level |
| resolved_at | timestamp with time zone | YES | | When alert was resolved |
| user_id | uuid | NO | | Foreign Key to auth.users |

### Hive Production Data Table

Records of honey and other hive products.

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| hive_id | text | NO | | Foreign Key to hives |
| apiary_id | uuid | NO | | Foreign Key to apiaries |
| date | date | NO | | Production date |
| amount | numeric | NO | | Amount produced |
| quality | character varying | YES | | Quality rating |
| type | character varying | NO | | Product type (honey, wax, etc.) |
| notes | text | YES | | Production notes |
| created_by | uuid | NO | | User who created record |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |
| updated_at | timestamp with time zone | NO | now() | Last update timestamp |
| projected_harvest | numeric | YES | | Projected future harvest |
| weight_change | numeric | YES | | Weight change since last measurement |
| user_id | uuid | NO | | Foreign Key to auth.users |

### Production Summary Table

Aggregated production data by apiary.

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary Key |
| apiary_id | uuid | NO | | Foreign Key to apiaries |
| year | integer | NO | | Year of summary |
| month | integer | YES | | Month of summary |
| month_number | integer | YES | | Numerical month (1-12) |
| total_production | numeric | NO | | Total production amount |
| change_percent | numeric | YES | | Percent change from previous period |
| avg_production | numeric | YES | | Average production per hive |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |
| user_id | uuid | NO | | Foreign Key to auth.users |

### User Preferences Table

Individual user preferences.

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| user_id | uuid | NO | | Primary Key, Foreign Key to auth.users |
| theme | character varying | YES | | UI theme preference |
| language | character varying | YES | | Preferred language |
| temperature_unit | character varying | YES | | Preferred temperature unit |
| weight_unit | character varying | YES | | Preferred weight unit |
| time_format | character varying | YES | | Preferred time format |
| date_format | character varying | YES | | Preferred date format |
| notification_enabled | boolean | YES | | Whether notifications are enabled |
| email_notifications | boolean | YES | | Whether email notifications are enabled |
| push_notifications | boolean | YES | | Whether push notifications are enabled |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |
| updated_at | timestamp with time zone | NO | now() | Last update timestamp |

### Alert Thresholds Table

User-defined alert thresholds.

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| user_id | uuid | NO | | Primary Key, Foreign Key to auth.users |
| temp_min | numeric | YES | | Minimum temperature threshold |
| temp_max | numeric | YES | | Maximum temperature threshold |
| humidity_min | numeric | YES | | Minimum humidity threshold |
| humidity_max | numeric | YES | | Maximum humidity threshold |
| weight_change_min | numeric | YES | | Minimum weight change threshold |
| weight_change_max | numeric | YES | | Maximum weight change threshold |
| sound_level_min | numeric | YES | | Minimum sound level threshold |
| sound_level_max | numeric | YES | | Maximum sound level threshold |
| varroa_threshold | integer | YES | | Varroa mite count threshold |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |
| updated_at | timestamp with time zone | NO | now() | Last update timestamp |

### Notification Preferences Table

Controls how users receive notifications.

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| user_id | uuid | NO | | Primary Key, Foreign Key to auth.users |
| inspection_reminders | boolean | YES | | Receive inspection reminders |
| production_alerts | boolean | YES | | Receive production alerts |
| disease_alerts | boolean | YES | | Receive disease alerts |
| weather_alerts | boolean | YES | | Receive weather alerts |
| system_notifications | boolean | YES | | Receive system notifications |
| email_frequency | character varying | YES | | Email notification frequency |
| created_at | timestamp with time zone | NO | now() | Creation timestamp |
| updated_at | timestamp with time zone | NO | now() | Last update timestamp |

### Views

- **metrics_time_series_view**: Provides a consolidated view of time series metrics data
- **apiary_production_summary**: Aggregates production data by apiary

## Auth Schema (Authentication)

The auth schema manages user authentication, session tracking, and identity management.

### Key Tables

- **users**: Core user authentication data (emails, passwords, etc.)
- **sessions**: Active user sessions
- **refresh_tokens**: Tokens used for JWT refresh
- **identities**: External identity providers linked to users
- **mfa_factors**: Multi-factor authentication methods
- **audit_log_entries**: Security audit trail

## Storage Schema

The storage schema manages file uploads and storage, including:

- **buckets**: Storage buckets for organizing files
- **objects**: Stored files with metadata
- **migrations**: Storage system migrations

## Realtime Schema

The realtime schema supports real-time data features:

- **subscription**: Tracks client subscriptions to real-time updates
- **messages**: Stores messages for real-time delivery

## Vault Schema

The vault schema provides secure storage for sensitive information:

- **secrets**: Encrypted storage for sensitive data
- **decrypted_secrets**: View for accessing decrypted secrets

## Relationships

Key relationships between tables include:

1. **Users to Profiles**: One-to-one relationship via the `id` field
2. **Users to Apiaries**: One-to-many relationship
3. **Apiaries to Hives**: One-to-many relationship
4. **Hives to Inspections**: One-to-many relationship
5. **Hives to Metrics**: One-to-many relationship
6. **Hives to Alerts**: One-to-many relationship
7. **Hives to Production Data**: One-to-many relationship
8. **Users to Preferences**: One-to-one relationship

## Row-Level Security (RLS)

The database implements row-level security to ensure users can only access data they own or that has been explicitly shared with them. This is controlled through the `user_id` field in most tables and through the sharing tables for collaborative features.

## Database Migrations

Database schema changes are tracked in the `supabase_migrations.schema_migrations` table. There are currently 75 migrations that have been applied to evolve the schema to its current state.
