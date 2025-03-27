# Smart Nyuki - Modern Beekeeping Management System

![Smart Nyuki Logo](src/assets/images/logo.svg)

Smart Nyuki is a comprehensive beekeeping management application that empowers beekeepers to efficiently track and optimize their apiaries, hives, and honey production. The name "Nyuki" means "bee" in Swahili, reflecting the application's focus on beekeeping.

## 🐝 Overview

Smart Nyuki provides beekeepers with a complete ecosystem for monitoring and managing their beekeeping operations. The application combines intuitive user interface with powerful analytics capabilities to help beekeepers make data-driven decisions, improve hive health, and maximize honey production.

## ✨ Features

### Apiary Management
- Create and manage multiple apiaries with detailed location information
- Track environmental conditions for each apiary
- Monitor apiary-wide statistics and metrics

### Hive Tracking
- Maintain detailed records for each beehive
- Track queen information (introduction date, type, marking)
- Monitor hive health and status in real-time

### Inspections
- Record comprehensive inspection data
- Track hive strength, diseases, queen sightings, and more
- Document treatments and interventions
- Attach images to inspection records

### Data Collection & Monitoring
- Real-time metrics for temperature, humidity, sound, and weight
- Automated alerts for abnormal conditions
- Historical data visualization and trend analysis

### Production Tracking
- Record honey and other hive product harvests
- Track production statistics by apiary, hive, and time period
- Analyze production efficiency and quality

### Weather Integration
- Local weather forecasts for apiaries
- Weather data correlation with hive performance

### Alerts System
- Receive notifications about critical hive conditions
- Customizable alert thresholds
- Alert prioritization based on severity

### Data Management
- Export and import your beekeeping data
- Create data backups
- Analyze comprehensive statistics

### Comprehensive Settings
- Personalize your profile
- Configure notification preferences
- Customize appearance settings
- Manage security and sharing preferences

## 🚀 Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: React Query
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Animations**: Framer Motion
- **Data Visualization**: Recharts, Tremor
- **Forms**: React Hook Form, Zod validation
- **Deployment**: Netlify

## 📊 Database Schema

Smart Nyuki uses a comprehensive PostgreSQL database with the following core tables:

- **Profiles**: User profile information
- **Apiaries**: Beekeeping locations
- **Hives**: Individual beehives
- **Inspections**: Detailed inspection records
- **Metrics**: Core sensor data (temperature, humidity, sound, weight)
- **Metrics_Time_Series_Data**: Time-series monitoring data
- **Alerts**: System-generated notifications
- **Hive_Production_Data**: Records of honey and other products
- **Production_Summary**: Aggregated production statistics

For a complete database schema, see [DatabaseSetup.md](DatabaseSetup.md).

## 🏗️ Project Structure

```
src/
├── assets/         # Static assets and images
├── components/     # Reusable UI components
│   ├── dashboard/  # Dashboard-specific components
│   ├── layout/     # Layout components (sidebar, navigation)
│   └── ui/         # Shared UI components
├── context/        # React context providers
├── hooks/          # Custom React hooks
├── lib/            # Library configurations
├── pages/          # Main application pages
├── services/       # API and data services
└── utils/          # Utility functions
```

## 🛠️ Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/James-CodeX/smart-nyuki-react.git
   cd smart-nyuki-react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the Supabase URL and API key

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:5173`

## 📱 Mobile Support

Smart Nyuki is designed with a responsive layout that works on both desktop and mobile devices, allowing beekeepers to access their data from anywhere.

## 🔒 Security

- Authentication via Supabase Auth
- Row-level security policies for data protection
- Secure API access with token authentication

## 🤝 Contributing

Contributions to Smart Nyuki are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For any questions or support, please reach out to [James-CodeX](mailto:james.nyakairu@students.jkuat.ac.ke).
