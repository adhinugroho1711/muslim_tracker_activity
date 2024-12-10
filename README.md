# Islamic Daily Activities Tracker

A web application to help track daily Islamic activities, designed for both mobile and desktop use. The application allows users to track their daily religious activities and maintain consistency in their practice.

![Login Page](docs/images/login.png)
![Dashboard](docs/images/dashboard.png)
![Admin Users](docs/images/admin_users.png)

## Features

- 📱 **Responsive Design**
  - Mobile and desktop friendly interface
  - Adaptive layout for different screen sizes
  - Touch-friendly controls for mobile users

- 🔐 **User Management**
  - Secure user authentication
  - Role-based access control (Admin/User)
  - Password encryption using bcrypt
  - User profile management

- ✅ **Activity Tracking**
  - Daily activity logging
  - Automatic streak tracking
  - Progress visualization
  - Auto-save functionality

- 📊 **Analytics & Reporting**
  - Multiple view options (Daily/Weekly/Monthly/Yearly)
  - Progress visualization through charts
  - Activity completion statistics
  - Streak tracking and records

## Tech Stack

### Backend
- **Framework**: Python Flask
- **Database**: PostgreSQL 12+
- **ORM**: SQLAlchemy
- **Authentication**: Flask-Login
- **Security**: Flask-Bcrypt

### Frontend
- **Framework**: Bootstrap 5
- **JavaScript**: Vanilla JS
- **Charts**: Chart.js
- **Icons**: Bootstrap Icons

## Installation

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)
- Git

### Setup Steps

1. **Clone Repository**
```bash
git clone [your-repository-url]
cd manage_task
```

2. **Virtual Environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your database credentials and settings
```

5. **Database Initialization**
```bash
python reset_db.py
```

## Configuration

### Environment Variables

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tracker_muslim

# Application Settings
FLASK_ENV=development
SECRET_KEY=your-secret-key
DEBUG=True
```

### Environment Types

- **Development** (`FLASK_ENV=development`)
  - Debug mode enabled
  - Detailed error messages
  - Auto-reload on code changes

- **Production** (`FLASK_ENV=production`)
  - Optimized performance
  - Minimal error details
  - Cached templates

- **Testing** (`FLASK_ENV=testing`)
  - Separate test database
  - Mock data generation
  - Test-specific configurations

## Using the Application

### User Types

1. **Admin Users**
   - Full access to all features
   - User management capabilities
   - System configuration access
   - Default credentials:
     - Username: admin
     - Password: admin123

2. **Regular Users**
   - Activity tracking
   - Personal dashboard access
   - Profile management
   - Default credentials:
     - Username: user
     - Password: user123

### Admin Panel

The admin panel provides tools for:
- User management (create, edit, deactivate)
- Activity monitoring
- System statistics
- Database management

### Activity Tracking

1. **Adding Activities**
   - Navigate to the main dashboard
   - Click on activity cells to mark completion
   - Activities are auto-saved
   - Numeric inputs available for certain activities

2. **Viewing Progress**
   - Use the dashboard filters
   - Check completion rates
   - Monitor streaks
   - View historical data

## Reading the Dashboard

The dashboard provides multiple views to help you track your activities:

### View Types

1. **Daily View**
   - Shows today's activity completion
   - Summary cards display:
     - Today's overall completion rate
     - Best streak achieved today
     - Number of activities completed today
     - Top performing activity
   - Charts show:
     - Individual activity completion rates for today
     - Current streaks for each activity
     - Heatmap showing today's activity pattern

2. **Weekly View**
   - Shows this week's activity completion (Monday-Sunday)
   - Summary cards display:
     - This week's overall completion rate
     - Best streak achieved this week
     - Total activities completed this week
     - Top performing activity
   - Charts show:
     - Activity completion rates for the week
     - Streak lengths for each activity
     - Heatmap showing daily patterns for the week

3. **Monthly View**
   - Shows selected month's activity completion
   - Summary cards display:
     - Monthly overall completion rate
     - Best streak achieved in the month
     - Total activities completed this month
     - Top performing activity for the month
   - Charts show:
     - Monthly completion rates per activity
     - Streak lengths achieved in the month
     - Heatmap showing daily patterns throughout the month

4. **Yearly View**
   - Shows selected year's activity completion
   - Summary cards display:
     - Yearly overall completion rate
     - Best streak achieved in the year
     - Total activities completed this year
     - Top performing activity for the year
   - Charts show:
     - Yearly completion rates per activity
     - Longest streaks achieved in the year
     - Heatmap showing activity patterns throughout the year

### Understanding the Charts

1. **Completion Rate Chart**
   - Bar chart showing completion percentage for each activity
   - Higher bars indicate better completion rates
   - Hover over bars to see exact percentages
   - Color-coded for easy interpretation

2. **Streak Chart**
   - Bar chart showing current/best streaks for each activity
   - Longer bars indicate longer streaks
   - Hover over bars to see exact streak lengths
   - Helps track consistency

3. **Activity Heatmap**
   - Calendar-style visualization of activity completion
   - Darker colors indicate higher completion rates
   - Hover over cells to see the date and completion rate
   - Helps identify patterns and consistency in activities

### Filtering and Navigation

- Use the view type dropdown to switch between Daily/Weekly/Monthly/Yearly views
- Use month/year selectors to navigate to different time periods
- All charts and statistics update automatically when filters change
- Data is cached for better performance

## Troubleshooting

### Common Issues

1. **Database Connection**
   - Verify PostgreSQL is running
   - Check database credentials in .env
   - Ensure database exists

2. **Login Issues**
   - Clear browser cache
   - Reset password if forgotten
   - Contact admin for account issues

3. **Data Not Saving**
   - Check internet connection
   - Verify user session is active
   - Try refreshing the page

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Flask team for the excellent framework
- Bootstrap team for the UI components
- Chart.js team for visualization tools
- All contributors who have helped with the project
