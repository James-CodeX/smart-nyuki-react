# Smart Nyuki React Database Schema

This document provides a comprehensive overview of the Smart Nyuki React database schema.

## Database Information

- **Project Name:** Smart-Nyuki-React
- **Region:** eu-central-1
- **Status:** ACTIVE_HEALTHY
- **Postgres Version:** 15.8.1.054

## Tables

### 1. profiles

User profile information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | | Primary key, linked to auth.users |
| username | varchar | true | | Unique username |
| first_name | varchar | true | | User's first name |
| last_name | varchar | true | | User's last name |
| avatar_url | text | true | | URL to user's avatar |
| company | varchar | true | | User's company |
| experience_level | varchar | true | | User's experience level |
| bio | text | true | | User's biography |
| location | varchar | true | | User's location |
| website | varchar | true | | User's website |
| social_links | jsonb | true | | User's social media links |
| preferences | jsonb | true | | User's preferences |
| role | varchar | true | 'beekeeper' | User's role |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Update timestamp |

**Primary Key:** id
**Row-Level Security:** Enabled

### 2. apiaries

Apiary information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| name | varchar | false | | Apiary name |
| location | varchar | true | | Apiary location |
| latitude | numeric | true | | Latitude coordinate |
| longitude | numeric | true | | Longitude coordinate |
| elevation | numeric | true | | Elevation |
| notes | text | true | | Notes about the apiary |
| image_url | text | true | | URL to apiary image |
| user_id | uuid | false | | Owner user ID |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Update timestamp |

**Primary Key:** id
**Row-Level Security:** Enabled

### 3. hives

Beehive information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| hive_id | text | false | | Primary key |
| name | varchar | false | | Hive name |
| apiary_id | uuid | false | | Reference to apiaries.id |
| type | varchar | true | | Hive type |
| status | varchar | false | 'active' | Hive status |
| installation_date | date | true | | Date hive was installed |
| queen_introduced_date | date | true | | Date queen was introduced |
| queen_type | varchar | true | | Type of queen |
| queen_marked | boolean | true | false | Whether queen is marked |
| queen_marking_color | varchar | true | | Color used to mark queen |
| notes | text | true | | Notes about the hive |
| image_url | text | true | | URL to hive image |
| user_id | uuid | false | | Owner user ID |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Update timestamp |
| is_registered | boolean | true | true | Whether hive is registered |
| alerts_enabled | boolean | true | true | Whether alerts are enabled |

**Primary Key:** hive_id
**Row-Level Security:** Enabled

### 4. inspections

Hive inspection records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| inspection_date | timestamptz | false | now() | Date of inspection |
| weight | numeric | true | | Hive weight |
| temperature | numeric | true | | Temperature |
| humidity | numeric | true | | Humidity |
| weather_conditions | varchar | true | | Weather conditions |
| hive_strength | integer | true | | Hive strength (1-10) |
| queen_seen | boolean | true | false | Whether queen was seen |
| eggs_seen | boolean | true | false | Whether eggs were seen |
| larvae_seen | boolean | true | false | Whether larvae were seen |
| queen_cells_seen | boolean | true | false | Whether queen cells were seen |
| disease_signs | boolean | true | false | Whether disease signs were seen |
| disease_details | text | true | | Details about diseases |
| varroa_check | boolean | true | false | Whether varroa check was done |
| varroa_count | integer | true | | Varroa mite count |
| honey_stores | integer | true | | Honey stores level (0-10) |
| pollen_stores | integer | true | | Pollen stores level (0-10) |
| added_supers | integer | true | 0 | Number of supers added |
| removed_supers | integer | true | 0 | Number of supers removed |
| feed_added | boolean | true | false | Whether feed was added |
| feed_type | varchar | true | | Type of feed added |
| feed_amount | varchar | true | | Amount of feed added |
| medications_added | boolean | true | false | Whether medications were added |
| medication_details | text | true | | Details about medications |
| notes | text | true | | Notes about the inspection |
| images | jsonb | true | | Image URLs |
| user_id | uuid | false | | User who performed inspection |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Update timestamp |
| hive_id | text | false | | Reference to hives.hive_id |

**Primary Key:** id
**Row-Level Security:** Enabled

### 5. metrics

Hive metrics data.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| type | varchar | false | | Metric type |
| value | numeric | false | | Metric value |
| timestamp | timestamptz | false | | Timestamp of measurement |
| unit | varchar | false | | Unit of measurement |
| user_id | uuid | false | | User ID |
| created_at | timestamptz | false | now() | Creation timestamp |
| hive_id | text | false | | Reference to hives.hive_id |

**Primary Key:** id
**Row-Level Security:** Enabled

### 6. alerts

Alert notifications for hives.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| type | varchar | false | | Alert type |
| message | varchar | false | | Alert message |
| created_at | timestamptz | false | now() | Creation timestamp |
| is_read | boolean | false | false | Whether alert has been read |
| severity | varchar | false | | Alert severity |
| resolved_at | timestamptz | true | | When alert was resolved |
| user_id | uuid | false | | User ID |
| hive_id | text | false | | Reference to hives.hive_id |

**Primary Key:** id
**Row-Level Security:** Enabled

### 7. inspection_findings

Detailed findings from inspections.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| inspection_id | uuid | false | | Reference to inspections.id |
| queen_sighted | boolean | false | false | Whether queen was sighted |
| brood_pattern | integer | false | | Brood pattern quality (0-5) |
| honey_stores | integer | false | | Honey stores level (0-5) |
| population_strength | integer | false | | Population strength (0-5) |
| temperament | integer | false | | Hive temperament (0-5) |
| diseases_sighted | boolean | false | false | Whether diseases were sighted |
| varroa_count | integer | true | | Varroa mite count |
| notes | text | true | | Additional notes |
| user_id | uuid | false | | User who recorded findings |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Update timestamp |

**Primary Key:** id
**Row-Level Security:** Enabled

### 8. hive_production_data

Production data for hives.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| apiary_id | uuid | false | | Reference to apiaries.id |
| date | date | false | | Production date |
| amount | numeric | false | | Production amount |
| quality | varchar | true | | Quality rating |
| type | varchar | false | | Production type |
| notes | text | true | | Additional notes |
| created_by | uuid | false | | User who created record |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Update timestamp |
| projected_harvest | numeric | true | | Projected harvest amount |
| weight_change | numeric | true | | Weight change |
| user_id | uuid | false | | User ID |
| hive_id | text | false | | Reference to hives.hive_id |

**Primary Key:** id
**Row-Level Security:** Enabled

### 9. metrics_time_series_data

Time series metrics data.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| time | time | false | now() | Time of day |
| timestamp | timestamptz | false | now() | Full timestamp |
| temp_value | numeric | true | | Temperature value |
| hum_value | numeric | true | | Humidity value |
| sound_value | numeric | true | | Sound level value |
| weight_value | numeric | true | | Weight value |
| created_at | timestamptz | false | now() | Creation timestamp |
| hive_id | text | false | | Reference to hives.hive_id |

**Primary Key:** id
**Row-Level Security:** Enabled

### 10. production_summary

Summary of production data.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| apiary_id | uuid | false | | Reference to apiaries.id |
| year | integer | false | | Year of production |
| month | integer | true | | Month of production |
| total_production | numeric | false | | Total production amount |
| change_percent | numeric | true | | Percent change from previous period |
| avg_production | numeric | true | | Average production |
| created_at | timestamptz | false | now() | Creation timestamp |
| user_id | uuid | false | | User ID |
| month_number | integer | true | month | Month number (generated) |

**Primary Key:** id
**Row-Level Security:** Enabled

### 11. apiary_sharing

Apiary sharing permissions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| apiary_id | uuid | false | | Reference to apiaries.id |
| owner_id | uuid | false | | Owner user ID |
| user_id | uuid | false | | Shared with user ID |
| permission | permission_level | false | | Permission level (view/edit/manage) |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Update timestamp |
| invitation_status | invitation_status | false | 'pending' | Status (pending/accepted/rejected/expired) |
| invitation_token | varchar | true | | Invitation token |
| expires_at | timestamptz | true | | Expiration timestamp |

**Primary Key:** id
**Row-Level Security:** Enabled

### 12. user_preferences

User interface preferences.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| user_id | uuid | true | | Reference to auth.users.id |
| theme | varchar | false | 'system' | UI theme preference |
| language | varchar | false | 'en' | Language preference |
| font_size | varchar | false | 'medium' | Font size preference |
| high_contrast | boolean | false | false | High contrast mode |
| temperature_unit | varchar | false | 'celsius' | Temperature unit preference |
| weight_unit | varchar | false | 'kg' | Weight unit preference |
| date_format | varchar | false | 'MM/DD/YYYY' | Date format preference |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Update timestamp |

**Primary Key:** id
**Row-Level Security:** Enabled

### 13. notification_preferences

User notification preferences.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| user_id | uuid | true | | Reference to auth.users.id |
| email_notifications | boolean | false | true | Email notifications enabled |
| sms_notifications | boolean | false | false | SMS notifications enabled |
| push_notifications | boolean | false | true | Push notifications enabled |
| quiet_hours_start | varchar | true | | Quiet hours start time |
| quiet_hours_end | varchar | true | | Quiet hours end time |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Update timestamp |

**Primary Key:** id
**Row-Level Security:** Enabled

### 14. alert_thresholds

User-defined alert thresholds.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| user_id | uuid | true | | Reference to auth.users.id |
| temperature_min | numeric | false | 10.0 | Minimum temperature threshold |
| temperature_max | numeric | false | 40.0 | Maximum temperature threshold |
| humidity_min | numeric | false | 30.0 | Minimum humidity threshold |
| humidity_max | numeric | false | 80.0 | Maximum humidity threshold |
| sound_min | numeric | false | 30.0 | Minimum sound threshold |
| sound_max | numeric | false | 90.0 | Maximum sound threshold |
| weight_min | numeric | false | 10.0 | Minimum weight threshold |
| weight_max | numeric | false | 100.0 | Maximum weight threshold |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Update timestamp |

**Primary Key:** id
**Row-Level Security:** Enabled

### 15. sharing_preferences

User sharing preferences.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| user_id | uuid | true | | Reference to auth.users.id |
| default_sharing_permission | varchar | false | 'view' | Default permission level |
| allow_data_analytics | boolean | false | true | Allow data analytics |
| share_location | boolean | false | false | Share location data |
| profile_visibility | varchar | false | 'contacts' | Profile visibility setting |
| production_data_visibility | varchar | false | 'private' | Production data visibility |
| activity_tracking | boolean | false | true | Activity tracking enabled |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Update timestamp |

**Primary Key:** id
**Row-Level Security:** Enabled

### 16. backups

Data backup records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| user_id | uuid | true | | Reference to auth.users.id |
| backup_type | varchar | false | | Type of backup |
| status | varchar | false | 'pending' | Backup status |
| file_path | varchar | true | | Path to backup file |
| file_size | integer | true | | Size of backup file |
| created_at | timestamptz | false | now() | Creation timestamp |
| completed_at | timestamptz | true | | Completion timestamp |

**Primary Key:** id
**Row-Level Security:** Enabled

### 17. shared_apiaries

Shared apiary records.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | false | gen_random_uuid() | Primary key |
| apiary_id | uuid | true | | Reference to apiaries.id |
| user_id | uuid | true | | Owner user ID |
| shared_with | uuid | true | | User ID shared with |
| permission | varchar | false | 'view' | Permission level |
| created_at | timestamptz | false | now() | Creation timestamp |
| updated_at | timestamptz | false | now() | Update timestamp |

**Primary Key:** id
**Row-Level Security:** Enabled

## Custom Functions

### 1. check_hive_exists

Checks if a hive exists in the metrics_time_series_data table.

```sql
CREATE OR REPLACE FUNCTION public.check_hive_exists(hive_id_param text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  -- Check if the hive exists in the metrics_time_series_data table
  SELECT EXISTS (
    SELECT 1 FROM metrics_time_series_data
    WHERE hive_id = hive_id_param
    LIMIT 1
  ) INTO result;
  
  -- Return the result as a JSON object
  RETURN jsonb_build_object('exists', result);
END;
$$;
```

### 2. get_latest_metrics_for_dashboard

Retrieves the latest metrics for each hive for the dashboard.

```sql
CREATE OR REPLACE FUNCTION public.get_latest_metrics_for_dashboard()
RETURNS TABLE (
  hive_id text,
  timestamp timestamptz,
  temp_value numeric,
  hum_value numeric,
  sound_value numeric,
  weight_value numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH latest_timestamps AS (
    SELECT DISTINCT ON (hive_id) 
      hive_id,
      timestamp
    FROM metrics_time_series_data
    ORDER BY hive_id, timestamp DESC
  )
  SELECT 
    m.hive_id,
    m.timestamp,
    m.temp_value,
    m.hum_value,
    m.sound_value,
    m.weight_value
  FROM metrics_time_series_data m
  JOIN latest_timestamps lt ON m.hive_id = lt.hive_id AND m.timestamp = lt.timestamp
  ORDER BY m.hive_id;
END;
$$;
```

### 3. handle_new_user

Trigger function that creates a new profile when a new user is created.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, first_name, last_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;
```

### 4. handle_updated_at

Trigger function that updates the updated_at column to the current timestamp.

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### 5. update_modified_column

Trigger function that updates the updated_at column to the current timestamp.

```sql
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$;
```

## Triggers

| Trigger Name | Table | Function | Description |
|--------------|-------|----------|-------------|
| set_apiaries_updated_at | apiaries | handle_updated_at | Updates the updated_at column before an update |
| set_apiary_sharing_updated_at | apiary_sharing | handle_updated_at | Updates the updated_at column before an update |
| set_hive_production_data_updated_at | hive_production_data | handle_updated_at | Updates the updated_at column before an update |
| set_inspection_findings_updated_at | inspection_findings | handle_updated_at | Updates the updated_at column before an update |
| set_inspections_updated_at | inspections | handle_updated_at | Updates the updated_at column before an update |
| update_profiles_updated_at | profiles | update_modified_column | Updates the updated_at column before an update |

## Installed Extensions

The database has several extensions installed, including:

- pgcrypto
- pgjwt
- pgsodium
- uuid-ossp
- pg_graphql
- supabase_vault
- pg_stat_statements
- plpgsql

## Row-Level Security (RLS)

Row-Level Security is enabled on all tables to ensure data privacy and access control.

## Database Migrations

The database has undergone numerous migrations to create tables, add indexes, enable RLS policies, and update data structures. The most recent migrations include adding alerts_enabled to hives and creating various helper functions.
