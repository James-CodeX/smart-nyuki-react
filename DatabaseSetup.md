# Database Setup Documentation

This document outlines the data structure used in the Smart-Nyuki React application. It provides a comprehensive guide for migrating from the current mock data implementation to a proper database in the future.

## Tables Overview

The application uses the following core data models:

1. **Apiaries** - Beekeeping locations that contain multiple hives
2. **Hives** - Individual beehives within apiaries
3. **Metrics** - Time-series data for hive measurements (temperature, humidity, etc.)
4. **Alerts** - Notifications about hive conditions requiring attention
5. **Inspections** - Records of hive inspections, both scheduled and completed
6. **Users** - System users who manage apiaries and hives
7. **HiveMetrics** - Specific time-series data for various metric types
8. **HiveProductionData** - Records of honey production and harvests
9. **ApiarySharing** - Manages access permissions between users for collaborative work

## Table Definitions

### 1. Users

Stores information about system users.

| Column       | Type         | Constraints       | Description                           |
|--------------|--------------|-------------------|---------------------------------------|
| id           | VARCHAR(36)  | PRIMARY KEY       | Unique identifier for the user (UUID) |
| username     | VARCHAR(50)  | UNIQUE, NOT NULL  | User's login name                     |
| email        | VARCHAR(100) | UNIQUE, NOT NULL  | User's email address                  |
| password_hash| VARCHAR(255) | NOT NULL          | Hashed password                       |
| first_name   | VARCHAR(50)  | NOT NULL          | User's first name                     |
| last_name    | VARCHAR(50)  | NOT NULL          | User's last name                      |
| created_at   | TIMESTAMP    | NOT NULL          | When the user account was created     |
| updated_at   | TIMESTAMP    | NOT NULL          | When the user account was last updated|
| role         | VARCHAR(20)  | NOT NULL          | User role (admin, beekeeper, etc.)    |

### 2. Apiaries

Stores information about beekeeping locations.

| Column          | Type         | Constraints                 | Description                               |
|-----------------|--------------|----------------------------|-------------------------------------------|
| id              | VARCHAR(36)  | PRIMARY KEY                | Unique identifier for the apiary (UUID)   |
| name            | VARCHAR(100) | NOT NULL                   | Name of the apiary                        |
| location        | VARCHAR(255) | NOT NULL                   | Physical location of the apiary           |
| user_id         | VARCHAR(36)  | FOREIGN KEY, NOT NULL      | Owner/creator of the apiary              |
| created_at      | TIMESTAMP    | NOT NULL                   | When the apiary was added to the system   |
| updated_at      | TIMESTAMP    | NOT NULL                   | When the apiary was last updated          |
| latitude        | DECIMAL(10,8)| NULL                       | GPS latitude coordinate                   |
| longitude       | DECIMAL(11,8)| NULL                       | GPS longitude coordinate                  |
| notes           | TEXT         | NULL                       | Additional notes about the apiary         |
| hive_count      | INTEGER      | NOT NULL                   | Number of hives in the apiary             |
| avg_temperature | DECIMAL(5,2) | NULL                       | Average temperature across all hives      |
| avg_humidity    | DECIMAL(5,2) | NULL                       | Average humidity across all hives         |
| avg_sound       | DECIMAL(5,2) | NULL                       | Average sound level across all hives      |
| avg_weight      | DECIMAL(5,2) | NULL                       | Average weight across all hives           |

**Foreign Keys:**
- `user_id` references `Users(id)`

### 3. Hives

Stores information about individual beehives.

| Column           | Type         | Constraints                  | Description                             |
|------------------|--------------|------------------------------|-----------------------------------------|
| id               | VARCHAR(36)  | PRIMARY KEY                 | Unique identifier for the hive (UUID)   |
| name             | VARCHAR(100) | NOT NULL                    | Name or identifier of the hive          |
| apiary_id        | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | Apiary where the hive is located        |
| node_id          | VARCHAR(100) | NULL                        | Hardware node ID for IoT integration    |
| hive_type        | VARCHAR(50)  | NOT NULL                    | Type of hive (Langstroth, etc.)         |
| queen_age        | VARCHAR(50)  | NULL                        | Age of the queen bee                    |
| installation_date| DATE         | NULL                        | When the hive was installed             |
| created_at       | TIMESTAMP    | NOT NULL                    | When the hive was added to the system   |
| updated_at       | TIMESTAMP    | NOT NULL                    | When the hive was last updated          |
| notes            | TEXT         | NULL                        | Additional notes about the hive         |
| status           | VARCHAR(20)  | NOT NULL                    | Current status of the hive              |

**Foreign Keys:**
- `apiary_id` references `Apiaries(id)`

### 4. HiveMetrics

Stores time-series data for various hive measurements separately by type.

| Column     | Type         | Constraints                  | Description                             |
|------------|--------------|------------------------------|-----------------------------------------|
| id         | VARCHAR(36)  | PRIMARY KEY                 | Unique identifier for the metric record |
| hive_id    | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | Hive the metric belongs to              |
| type       | VARCHAR(20)  | NOT NULL                    | Type (temperature, humidity, sound, weight)|
| value      | DECIMAL(8,2) | NOT NULL                    | Measured value                          |
| timestamp  | TIMESTAMP    | NOT NULL                    | When the measurement was taken          |
| unit       | VARCHAR(10)  | NOT NULL                    | Unit of measurement (°C, %, kg, etc.)   |

**Foreign Keys:**
- `hive_id` references `Hives(id)`

**Indexes:**
- Composite index on (`hive_id`, `type`, `timestamp`) for efficient time-series queries
- Index on `timestamp` for date range queries
- Index on `type` for filtering by metric type

### 5. Alerts

Stores notifications about hive conditions requiring attention.

| Column      | Type         | Constraints                  | Description                             |
|-------------|--------------|------------------------------|-----------------------------------------|
| id          | VARCHAR(36)  | PRIMARY KEY                 | Unique identifier for the alert         |
| hive_id     | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | Hive the alert is for                   |
| type        | VARCHAR(20)  | NOT NULL                    | Alert type (temperature, humidity, etc.)|
| message     | VARCHAR(255) | NOT NULL                    | Alert description                       |
| created_at  | TIMESTAMP    | NOT NULL                    | When the alert was generated            |
| is_read     | BOOLEAN      | NOT NULL, DEFAULT FALSE     | Whether the alert has been read         |
| severity    | VARCHAR(20)  | NOT NULL                    | Alert severity (warning, critical, etc.)|
| resolved_at | TIMESTAMP    | NULL                        | When the alert was resolved             |

**Foreign Keys:**
- `hive_id` references `Hives(id)`

### 6. Inspections

Stores records of hive inspections.

| Column      | Type         | Constraints                  | Description                             |
|-------------|--------------|------------------------------|-----------------------------------------|
| id          | VARCHAR(36)  | PRIMARY KEY                 | Unique identifier for the inspection    |
| hive_id     | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | Hive being inspected                    |
| apiary_id   | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | Apiary where the hive is located        |
| user_id     | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | User who performed the inspection       |
| date        | DATE         | NOT NULL                    | Date of the inspection                  |
| type        | ENUM         | NOT NULL                    | Inspection type (see ENUM definition)   |
| status      | ENUM         | NOT NULL                    | Status of the inspection (see ENUM def) |
| notes       | TEXT         | NULL                        | Additional notes about the inspection   |
| created_at  | TIMESTAMP    | NOT NULL                    | When the inspection record was created  |
| updated_at  | TIMESTAMP    | NOT NULL                    | When the inspection was last updated    |

**Foreign Keys:**
- `hive_id` references `Hives(id)`
- `apiary_id` references `Apiaries(id)`
- `user_id` references `Users(id)`

**ENUM Definitions:**
- `type`: 'regular', 'health-check', 'winter-prep', 'varroa-check', 'disease-treatment', 'harvest-evaluation'
- `status`: 'scheduled', 'completed', 'overdue', 'cancelled'

### 7. InspectionFindings

Detailed findings from completed inspections.

| Column              | Type         | Constraints                  | Description                             |
|---------------------|--------------|------------------------------|-----------------------------------------|
| id                  | VARCHAR(36)  | PRIMARY KEY                 | Unique identifier for the findings      |
| inspection_id       | VARCHAR(36)  | FOREIGN KEY, UNIQUE, NOT NULL | Associated inspection                 |
| queen_sighted       | BOOLEAN      | NOT NULL                    | Whether the queen was seen              |
| brood_pattern       | INTEGER      | NOT NULL                    | Brood pattern score (0-5)               |
| honey_stores        | INTEGER      | NOT NULL                    | Honey stores score (0-5)                |
| population_strength | INTEGER      | NOT NULL                    | Population strength score (0-5)         |
| temperament         | INTEGER      | NOT NULL                    | Bee temperament score (0-5)             |
| diseases_sighted    | BOOLEAN      | NOT NULL                    | Whether diseases were observed          |
| varroa_count        | INTEGER      | NULL                        | Count of varroa mites (if measured)     |
| notes               | TEXT         | NULL                        | Additional notes about findings         |

**Foreign Keys:**
- `inspection_id` references `Inspections(id)` ON DELETE CASCADE

### 8. HiveProductionData

Stores honey production data for hives.

| Column      | Type         | Constraints                  | Description                             |
|-------------|--------------|------------------------------|-----------------------------------------|
| id          | VARCHAR(36)  | PRIMARY KEY                 | Unique identifier                        |
| hive_id     | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | Hive the production is for              |
| apiary_id   | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | Apiary the hive belongs to              |
| date        | DATE         | NOT NULL                    | Production/harvest date                  |
| amount      | DECIMAL(8,2) | NOT NULL                    | Amount of honey harvested (kg)           |
| quality     | VARCHAR(20)  | NULL                        | Quality assessment of the honey          |
| type        | VARCHAR(50)  | NOT NULL                    | Type of honey produced                   |
| notes       | TEXT         | NULL                        | Additional notes about the harvest       |
| created_by  | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | User who recorded the production         |
| created_at  | TIMESTAMP    | NOT NULL                    | When the record was created              |
| projected_harvest | DECIMAL(8,2) | NULL                  | Estimated future harvest amount          |
| weight_change     | DECIMAL(5,2) | NULL                  | Daily weight change rate                 |

**Foreign Keys:**
- `hive_id` references `Hives(id)`
- `apiary_id` references `Apiaries(id)`
- `created_by` references `Users(id)`

### 9. MetricsTimeSeriesData

For efficient storage of time-series data, particularly useful for displaying charts and trends. This table is populated by ESP32 sensor nodes that send measurements directly to the database.

| Column     | Type         | Constraints                  | Description                              |
|------------|--------------|------------------------------|------------------------------------------|
| id         | VARCHAR(36)  | PRIMARY KEY                 | Unique identifier                         |
| hive_id    | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | Hive the metric data belongs to           |
| time       | VARCHAR(5)   | NOT NULL                    | Time in HH:MM format                      |
| timestamp  | TIMESTAMP    | NOT NULL                    | Full timestamp for the data point         |
| temp_value | DECIMAL(5,2) | NULL                        | Temperature value at this time            |
| hum_value  | DECIMAL(5,2) | NULL                        | Humidity value at this time               |
| sound_value| DECIMAL(5,2) | NULL                        | Sound level value at this time            |
| weight_value| DECIMAL(5,2)| NULL                        | Weight value at this time                 |
| created_at | TIMESTAMP    | NOT NULL DEFAULT NOW()      | When the record was created               |

**Foreign Keys:**
- `hive_id` references `Hives(id)`

**Indexes:**
- Index on `hive_id` for quick lookups
- Index on `timestamp` for time-range queries

**Integration with IoT Sensors:**
- ESP32 nodes send data directly to this table using the hive_id they've been configured with
- When a user adds a new hive to the system, they associate it with a specific ESP32 node ID
- The ESP32 nodes authenticate using a service role and are authorized to insert data
- No user_id is stored with the metrics as the data belongs to the hive itself, and access control is handled through the hive's relationship to apiaries and users

### 10. ProductionSummary

Aggregated production data for apiaries and time periods, useful for reporting and dashboards.

| Column          | Type         | Constraints                  | Description                             |
|-----------------|--------------|------------------------------|-----------------------------------------|
| id              | VARCHAR(36)  | PRIMARY KEY                 | Unique identifier                        |
| apiary_id       | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | Associated apiary                        |
| year            | INTEGER      | NOT NULL                    | Year of production summary               |
| month           | INTEGER      | NULL                        | Month of production (NULL for yearly)    |
| total_production| DECIMAL(10,2)| NOT NULL                    | Total honey production for period        |
| change_percent  | DECIMAL(5,2) | NULL                        | Percent change from previous period      |
| avg_production  | DECIMAL(8,2) | NULL                        | Average production per hive              |
| created_at      | TIMESTAMP    | NOT NULL                    | When the summary was generated           |

**Foreign Keys:**
- `apiary_id` references `Apiaries(id)`

**Indexes:**
- Composite index on (`apiary_id`, `year`, `month`) for efficient period lookups

### 11. ApiarySharing

Manages access permissions between users for collaborative work on apiaries.

| Column      | Type         | Constraints                  | Description                             |
|-------------|--------------|------------------------------|-----------------------------------------|
| id          | VARCHAR(36)  | PRIMARY KEY                 | Unique identifier                        |
| apiary_id   | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | Apiary being shared                      |
| owner_id    | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | User who owns the apiary                 |
| user_id     | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | User receiving access                    |
| permission  | ENUM         | NOT NULL                    | Permission level (see ENUM definition)   |
| created_at  | TIMESTAMP    | NOT NULL                    | When sharing was created                 |
| updated_at  | TIMESTAMP    | NOT NULL                    | When sharing was last updated            |
| invitation_status | ENUM   | NOT NULL                    | Status of the invitation                 |
| invitation_token | VARCHAR(100) | NULL                   | Token for invitation verification        |
| expires_at  | TIMESTAMP    | NULL                        | When the sharing expires (if temporary)  |

**Foreign Keys:**
- `apiary_id` references `Apiaries(id)` ON DELETE CASCADE
- `owner_id` references `Users(id)`
- `user_id` references `Users(id)`

**ENUM Definitions:**
- `permission`: 'view', 'edit', 'manage'
- `invitation_status`: 'pending', 'accepted', 'rejected', 'expired'

**Indexes:**
- Composite index on (`apiary_id`, `user_id`) for efficient permission checks
- Index on `user_id` for finding all shared apiaries for a user
- Index on `invitation_status` to filter by invitation state

## Relationships

1. **One-to-Many Relationships:**
   - A User can have many Apiaries
   - An Apiary can have many Hives
   - A Hive can have many HiveMetrics
   - A Hive can have many MetricsTimeSeriesData
   - A Hive can have many Alerts
   - A Hive can have many Inspections
   - A Hive can have many HiveProductionData records
   - An Inspection has one InspectionFindings (1:1 relationship)
   - An Apiary can have many ProductionSummary records
   - An Apiary can have many ApiarySharing records

2. **Many-to-One Relationships:**
   - Many Hives belong to one Apiary
   - Many Apiaries belong to one User (owner)
   - Many Inspections are performed by one User
   - Many HiveProductionData records are associated with one Hive

3. **Many-to-Many Relationships:**
   - Users and Apiaries have a many-to-many relationship through ApiarySharing

## Mock Data Patterns

The application uses several patterns for generating mock data that should be considered when migrating to a real database:

1. **Time-Series Data Patterns:**
   - Temperature data follows a daily cycle (higher during day, lower at night)
   - Humidity is typically inverse to temperature (higher at night, lower during day)
   - Sound data is higher during active bee hours (8am-6pm)
   - Weight data shows gradual increase over time as nectar is collected

2. **Alert Generation:**
   - Alerts are generated when metrics exceed defined thresholds:
     - Temperature: < 31°C or > 37°C
     - Humidity: < 35% or > 70%

3. **Production Data:**
   - Yearly production ranges from 100-300kg per apiary
   - Monthly production ranges from 5-35kg per apiary
   - Individual hive production ranges from 5-35kg
   - Weight change rate is between -0.5 to 1.5 kg/day

4. **Inspection Types and Schedules:**
   - Regular inspections are typically every 7-14 days
   - Health checks are more frequent during active seasons
   - Winter prep inspections occur before cold weather
   - Harvest evaluations occur when honey is ready for collection
   - Varroa checks and disease treatments are scheduled as needed

## Indexes

To optimize query performance, consider the following indexes:

1. **Apiaries:**
   - Index on `user_id` for fast filtering of a user's apiaries
   - Spatial index on `(latitude, longitude)` for proximity searches

2. **Hives:**
   - Index on `apiary_id` for fast filtering of hives by apiary
   - Index on `status` for filtering hives by status

3. **HiveMetrics:**
   - Composite index on `(hive_id, type, timestamp)` for time-series queries
   - Index on `timestamp` for date range queries

4. **MetricsTimeSeriesData:**
   - Composite index on `(hive_id, timestamp)` for efficient retrieval of time series
   - Index on `timestamp` for time-range filtering

5. **Inspections:**
   - Index on `hive_id` for filtering inspections by hive
   - Index on `date` for date range queries
   - Index on `status` for filtering inspections by status
   - Index on `user_id` for filtering inspections by user

6. **HiveProductionData:**
   - Index on `hive_id` for filtering production by hive
   - Index on `apiary_id` for filtering production by apiary
   - Index on `date` for filtering by production date
   - Composite index on `(hive_id, date)` for time-series production queries

7. **ProductionSummary:**
   - Composite index on (`apiary_id`, `year`, `month`) for period-based reports

8. **ApiarySharing:**
   - Composite index on (`user_id`, `apiary_id`) for quick permission lookups
   - Index on `invitation_status` for filtering pending invitations

## Security and Access Control

To ensure data is accessed only by authenticated users and prevent data leakage, implement the following security measures:

### 1. Authentication System

| Table       | Type         | Description                              |
|-------------|--------------|------------------------------------------|
| Sessions    | Table        | Stores active user sessions              |
| RefreshTokens | Table      | Stores tokens for session renewal        |
| LoginAttempts | Table      | Tracks login attempts for rate limiting  |
| TwoFactorAuth | Table      | Stores 2FA settings and backup codes     |

#### Sessions Table

| Column      | Type         | Constraints                  | Description                             |
|-------------|--------------|------------------------------|-----------------------------------------|
| id          | VARCHAR(36)  | PRIMARY KEY                 | Unique identifier for the session       |
| user_id     | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | Associated user                         |
| token       | VARCHAR(255) | UNIQUE, NOT NULL            | Session token (JWT or similar)          |
| ip_address  | VARCHAR(45)  | NOT NULL                    | IP address used for session             |
| user_agent  | TEXT         | NOT NULL                    | Browser/client identification           |
| expires_at  | TIMESTAMP    | NOT NULL                    | Session expiration time                 |
| created_at  | TIMESTAMP    | NOT NULL                    | When the session was created            |
| last_active | TIMESTAMP    | NOT NULL                    | Last activity timestamp                 |

**Foreign Keys:**
- `user_id` references `Users(id)` ON DELETE CASCADE

### 2. Authorization Rules

1. **Multi-tenancy Enforcement:**
   - All data access must be filtered by user ownership
   - Direct object references should be avoided in APIs
   - Use parameterized queries with user context

2. **Role-Based Access Control:**
   - Implement the following roles with appropriate permissions:
     - **Admin**: Full access to all data
     - **Beekeeper**: Access to owned apiaries and associated data
     - **Viewer**: Read-only access to specific apiaries (for collaboration)

3. **Row-Level Security:**
   - Database queries must include user_id filters
   - Implement database-level row security policies where supported

### 3. API Security Measures

1. **API Authentication:**
   - All API endpoints must require authentication
   - Use JWT tokens with appropriate expiration
   - Implement token refresh mechanism
   - Add CSRF protection for browser clients

2. **API Request Flow:**
   ```
   Client Request → Auth Middleware → Validate Token → Check Permissions → Access Data
   ```

3. **Data Access Policies:**
   - Users can only access apiaries they own or have been granted access to
   - Metrics and production data inherit access rules from parent hives/apiaries
   - Implement a permission check helper function in all API controllers

### 4. Sample Database Queries with Security Context

```sql
-- Example: Retrieving apiaries with user context
SELECT * FROM Apiaries WHERE user_id = ?; -- user_id from authenticated session

-- Example: Retrieving shared apiaries 
SELECT a.* FROM Apiaries a
JOIN ApiarySharing s ON a.id = s.apiary_id
WHERE s.user_id = ? AND s.invitation_status = 'accepted';

-- Example: Retrieving hives with security check (including shared apiaries)
SELECT h.* FROM Hives h
JOIN Apiaries a ON h.apiary_id = a.id
WHERE a.user_id = ? -- user is owner
   OR EXISTS (
      SELECT 1 FROM ApiarySharing s 
      WHERE s.apiary_id = a.id 
      AND s.user_id = ? 
      AND s.invitation_status = 'accepted'
   );

-- Example: Retrieving metrics with security check
SELECT m.* FROM HiveMetrics m
JOIN Hives h ON m.hive_id = h.id
JOIN Apiaries a ON h.apiary_id = a.id
WHERE a.user_id = ? -- user is owner
   OR EXISTS (
      SELECT 1 FROM ApiarySharing s 
      WHERE s.apiary_id = a.id 
      AND s.user_id = ? 
      AND s.invitation_status = 'accepted'
   );

-- Example: Check if user has edit permission for an apiary
SELECT EXISTS (
   SELECT 1 FROM Apiaries a
   WHERE a.id = ? AND a.user_id = ?
   UNION
   SELECT 1 FROM ApiarySharing s
   WHERE s.apiary_id = ? AND s.user_id = ? 
   AND s.permission IN ('edit', 'manage')
   AND s.invitation_status = 'accepted'
) AS has_permission;
```

### 5. Audit and Monitoring

| Table       | Type         | Description                              |
|-------------|--------------|------------------------------------------|
| AuditLogs   | Table        | Records all significant data operations  |

#### AuditLogs Table

| Column      | Type         | Constraints                  | Description                             |
|-------------|--------------|------------------------------|-----------------------------------------|
| id          | VARCHAR(36)  | PRIMARY KEY                 | Unique identifier for the log entry     |
| user_id     | VARCHAR(36)  | FOREIGN KEY, NOT NULL       | User who performed the action           |
| action      | VARCHAR(50)  | NOT NULL                    | Action type (create, read, update, delete) |
| entity_type | VARCHAR(50)  | NOT NULL                    | Type of affected entity (Apiary, Hive, etc.) |
| entity_id   | VARCHAR(36)  | NOT NULL                    | ID of the affected entity               |
| details     | JSON         | NULL                        | Additional action details               |
| ip_address  | VARCHAR(45)  | NOT NULL                    | IP address of the user                  |
| timestamp   | TIMESTAMP    | NOT NULL                    | When the action occurred                |

**Foreign Keys:**
- `user_id` references `Users(id)`

**Indexes:**
- Index on `user_id` for filtering by user
- Index on `entity_type` and `entity_id` for filtering by entity
- Index on `timestamp` for time-based queries

### 6. Implementing Access Control in the Application Layer

1. **Authentication Flow:**
   - Implement a login page that's required before accessing any app content
   - Store JWTs in HTTP-only cookies to prevent client-side access
   - Include CSRF tokens in all state-changing requests
   - Use short expiration times with automatic token refresh
   - Implement separate service role authentication for ESP32 nodes

2. **Permission Verification Middleware:**
   - Create middleware that verifies user permissions before processing requests:

   ```typescript
   // Example middleware that checks for apiary access
   const verifyApiaryAccess = async (req, res, next) => {
     const { apiaryId } = req.params;
     const userId = req.user.id;
     const requiredPermission = req.method === 'GET' ? 'view' : 'edit';
     
     // Check if user is owner or has appropriate shared access
     const hasAccess = await db.checkApiaryAccess(apiaryId, userId, requiredPermission);
     
     if (!hasAccess) {
       return res.status(403).json({ message: 'Access denied' });
     }
     
     next();
   };
   ```

3. **Frontend Access Controls:**
   - Implement UI-level permissions to hide actions that aren't allowed
   - Show clear visual indications of shared resources
   - Add permission checks to sensitive operations:

   ```typescript
   const OwnershipBadge = ({ apiary }) => {
     const { user } = useAuth();
     const isOwner = apiary.user_id === user.id;
     
     if (isOwner) {
       return <Badge variant="primary">Owner</Badge>;
     }
     
     return (
       <Badge variant="secondary">
         {apiary.permission === 'edit' ? 'Can Edit' : 'Viewer'}
       </Badge>
     );
   };
   ```

4. **Handling Shared Resources:**
   - Create a clear invitation and acceptance workflow
   - Allow owners to revoke access at any time
   - Provide visibility into who has access to what resources
   - Ensure all child resources inherit parent permissions

5. **IoT Device Authentication and Access Control:**
   - ESP32 nodes use a dedicated service role for authentication
   - Nodes are associated with hives during the hive setup process
   - The row-level security policies for metrics data are based on hive ownership
   - Users can view metrics data for hives they own or have been granted access to
   - Implement a secure provisioning process for ESP32 nodes:

   ```typescript
   // Example of associating an ESP32 node with a hive
   const associateNodeWithHive = async (req, res) => {
     const { hiveId, nodeId } = req.body;
     const userId = req.user.id;
     
     // Verify the user owns the hive
     const hiveOwnership = await db.verifyHiveOwnership(hiveId, userId);
     
     if (!hiveOwnership) {
       return res.status(403).json({ message: 'Not authorized to configure this hive' });
     }
     
     // Register the node ID with the hive
     await db.updateHive(hiveId, { node_id: nodeId });
     
     // Generate and store node-specific credentials if needed
     // ...
     
     return res.status(200).json({ message: 'Node successfully associated with hive' });
   };
   ```

## Data Migration Considerations

When migrating from mock data to a real database:

1. **Primary Keys:**
   - The mock data uses string IDs (like "apiary-1" and "hive-{apiaryId}-{number}"). Consider UUID approach or auto-incremented integers.

2. **Date/Time Handling:**
   - The mock data stores dates as ISO strings. Ensure proper conversion to database date types.
   - Time-series data is stored with time points in "HH:mm" format - consider standardizing to timestamps.

3. **Enum Types:**
   - Use proper database-specific ENUM types or reference tables for status and type fields.

4. **Initial Data:**
   - Create scripts to convert mock data to database seed data.
   - Generate initial data based on patterns found in the mock data (daily cycles for temperature, etc.)

5. **Metrics Storage:**
   - Consider time-series database options for metrics data if volume grows significantly.
   - Potential time-series partitioning for metrics table.
   - The current implementation generates metrics with natural patterns (temperature higher during day, etc.) - maintain these patterns when migrating.

6. **Soft Deletes:**
   - Add `deleted_at` timestamp fields to implement soft deletes if needed.

7. **API Authentication:**
   - Implement proper user authentication with JWT or session-based auth.

8. **Data Validation:**
   - Implement validation rules based on current business logic (e.g., inspection findings using 0-5 scales)

## Backend API Structure

Implement REST API endpoints for each entity:

- `/api/auth` - Authentication endpoints (login, logout, refresh)
- `/api/users` - User management
- `/api/apiaries` - Apiary management
- `/api/apiaries/{id}/hives` - Hive management within an apiary
- `/api/hives/{id}/metrics` - Metrics for a specific hive
- `/api/hives/{id}/alerts` - Alerts for a specific hive
- `/api/hives/{id}/inspections` - Inspections for a specific hive
- `/api/inspections/{id}/findings` - Findings for a specific inspection
- `/api/hives/{id}/production` - Production data for a specific hive
- `/api/inspections/scheduled` - Get all scheduled inspections
- `/api/inspections/overdue` - Get all overdue inspections
- `/api/inspections/upcoming?days=7` - Get upcoming inspections for next N days
- `/api/production/summary?period=year` - Get production summaries by period
- `/api/metrics/aggregate?type=temperature&period=day` - Get aggregated metrics
- `/api/apiaries/{id}/sharing` - Manage access permissions for an apiary
- `/api/sharing/invitations` - List and respond to sharing invitations

## Future Enhancements

Consider these enhancements after initial migration:

1. **Permissions System:**
   - Implement role-based access control
   - Allow sharing apiaries between users

2. **Automated Alerts:**
   - Implement background jobs to analyze metrics and create alerts
   - Set up threshold configuration for different alert types

3. **Data Retention Policy:**
   - Implement data aggregation for older metrics data
   - Consider archiving or pruning old data

4. **API Versioning:**
   - Implement API versioning for future compatibility

5. **File Storage:**
   - Add support for storing inspection photos, documents, etc.

6. **Audit Trail:**
   - Implement detailed audit logging for data changes

7. **Predictive Analytics:**
   - Build on the time-series data to implement predictive analytics
   - Forecast honey production based on historical data
   - Predict maintenance needs based on hive conditions

8. **Mobile Integration:**
   - Design database schema with mobile synchronization in mind
   - Implement offline-first capability for field inspections

9. **Weather Data Integration:**
   - Add support for correlating hive metrics with local weather data
   - Create schema for storing weather forecasts and historical conditions 