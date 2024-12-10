from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
import os
from config import get_config
import random
from sqlalchemy import func, case

# Create Flask app
app = Flask(__name__)

# Load configuration based on environment
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(get_config(env))

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Models
class User(UserMixin, db.Model):
    __tablename__ = 'users'  # Explicitly set table name
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    student_number = db.Column(db.String(20), nullable=False)
    class_name = db.Column(db.String(20), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    activities = db.relationship('Activity', backref='user', lazy=True)
    activity_stats = db.relationship('ActivityStats', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

class Activity(db.Model):
    __tablename__ = 'activities'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    completed = db.Column(db.Boolean, default=False, index=True)
    value = db.Column(db.Integer, nullable=True)  # For numeric activities like Rowatib and Tilawah
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.now, onupdate=datetime.now)
    
    __table_args__ = (
        db.Index('idx_user_date', 'user_id', 'date'),
        db.Index('idx_user_name_date', 'user_id', 'name', 'date')
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'date': self.date.strftime('%Y-%m-%d') if self.date else None,
            'completed': self.completed,
            'value': self.value,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Activity {self.name} on {self.date}>'

class ActivityStats(db.Model):
    __tablename__ = 'activity_stats'  # Explicitly set table name
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activity_name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    completed = db.Column(db.Boolean, default=False)
    streak = db.Column(db.Integer, default=0)
    __table_args__ = (
        db.UniqueConstraint('user_id', 'activity_name', 'date', name='unique_user_activity_date'),
    )

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# Routes
@app.route('/')
@login_required
def index():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
        
    if current_user.is_admin:
        # Get admin dashboard data
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        today = datetime.now().date()
        total_activities_today = Activity.query.filter(
            Activity.date == today
        ).count()
        
        return render_template('index.html',
                             total_users=total_users,
                             active_users=active_users,
                             total_activities_today=total_activities_today)
    else:
        # Get user dashboard data
        today = datetime.now().date()
        user_activities = Activity.query.filter_by(
            user_id=current_user.id,
            date=today
        ).all()
        
        # Calculate completion rate
        total_activities = len(user_activities)
        completed_activities = sum(1 for activity in user_activities if activity.completed)
        completion_rate = (completed_activities / total_activities * 100) if total_activities > 0 else 0
        
        # Calculate current streak
        current_streak = 0
        date = today
        while True:
            day_activities = Activity.query.filter_by(
                user_id=current_user.id,
                date=date
            ).all()
            if not day_activities or not all(activity.completed for activity in day_activities):
                break
            current_streak += 1
            date = date - timedelta(days=1)
        
        current_date = datetime.now()
        current_month = current_date.strftime('%B')  # Full month name
        current_year = current_date.year
        
        # Convert English month name to Indonesian
        month_mapping = {
            'January': 'Januari',
            'February': 'Februari',
            'March': 'Maret',
            'April': 'April',
            'May': 'Mei',
            'June': 'Juni',
            'July': 'Juli',
            'August': 'Agustus',
            'September': 'September',
            'October': 'Oktober',
            'November': 'November',
            'December': 'Desember'
        }
        current_month_indo = month_mapping.get(current_month, current_month)
        
        return render_template('index.html',
                             user_activities_today=len(user_activities),
                             completion_rate=round(completion_rate, 1),
                             current_streak=current_streak,
                             current_month=current_month_indo,
                             current_year=current_year)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('index'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    # Get current month and year
    current_date = datetime.now()
    current_month = current_date.strftime('%B')  # Full month name
    current_year = current_date.year
    
    # Convert English month name to Indonesian
    month_mapping = {
        'January': 'Januari',
        'February': 'Februari',
        'March': 'Maret',
        'April': 'April',
        'May': 'Mei',
        'June': 'Juni',
        'July': 'Juli',
        'August': 'Agustus',
        'September': 'September',
        'October': 'Oktober',
        'November': 'November',
        'December': 'Desember'
    }
    current_month_indo = month_mapping.get(current_month, current_month)
    
    return render_template('dashboard.html', 
                         current_month=current_month_indo,
                         current_year=current_year)

@app.route('/api/dashboard/stats')
@login_required
def get_dashboard_stats():
    try:
        view_type = request.args.get('view_type', 'daily')
        month = int(request.args.get('month', datetime.now().month))
        year = int(request.args.get('year', datetime.now().year))
        
        # Calculate date range based on view type
        today = datetime.now().date()
        if view_type == 'daily':
            start_date = today
            end_date = today
            period_label = "Today's"
        elif view_type == 'weekly':
            start_date = today - timedelta(days=today.weekday())
            end_date = start_date + timedelta(days=6)
            period_label = "This Week's"
        elif view_type == 'monthly':
            start_date = datetime(year, month, 1).date()
            if month == 12:
                end_date = datetime(year + 1, 1, 1).date() - timedelta(days=1)
            else:
                end_date = datetime(year, month + 1, 1).date() - timedelta(days=1)
            period_label = f"{datetime(year, month, 1).strftime('%B')}'s"
        else:  # yearly
            start_date = datetime(year, 1, 1).date()
            end_date = datetime(year, 12, 31).date()
            period_label = f"{year}'s"
        
        # Efficient query using SQL aggregation
        stats_query = db.session.query(
            Activity.name,
            func.count().label('total'),
            func.sum(func.cast(Activity.completed, db.Integer)).label('completed')
        ).filter(
            Activity.user_id == current_user.id,
            Activity.date >= start_date,
            Activity.date <= end_date
        ).group_by(Activity.name)
        
        # Execute query once and store results
        activity_stats = {row.name: {'total': row.total, 'completed': row.completed or 0} for row in stats_query.all()}
        
        # Calculate overall stats
        total_activities = sum(stats['total'] for stats in activity_stats.values())
        total_completed = sum(stats['completed'] for stats in activity_stats.values())
        
        # Calculate completion rates
        activity_completion = {}
        for name, stats in activity_stats.items():
            rate = round((stats['completed'] / stats['total'] * 100) if stats['total'] > 0 else 0, 1)
            activity_completion[name] = rate
        
        # Calculate streaks efficiently
        streaks_query = db.session.query(
            Activity.name,
            Activity.date,
            Activity.completed
        ).filter(
            Activity.user_id == current_user.id,
            Activity.date >= start_date,
            Activity.date <= end_date
        ).order_by(Activity.name, Activity.date).all()
        
        # Process streaks in memory
        activity_streaks = {}
        current_activity = None
        current_streak = 0
        max_streak = 0
        
        for row in streaks_query:
            if current_activity != row.name:
                if current_activity is not None:
                    activity_streaks[current_activity] = max_streak
                current_activity = row.name
                current_streak = 0
                max_streak = 0
            
            if row.completed:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 0
        
        if current_activity is not None:
            activity_streaks[current_activity] = max_streak
        
        # Get top activity
        top_activity = max(activity_completion.items(), key=lambda x: x[1])[0] if activity_completion else "-"
        best_streak = max(activity_streaks.values()) if activity_streaks else 0
        
        # Prepare heatmap data efficiently
        heatmap_query = db.session.query(
            Activity.date,
            func.count().label('total'),
            func.sum(func.cast(Activity.completed, db.Integer)).label('completed')
        ).filter(
            Activity.user_id == current_user.id,
            Activity.date >= start_date,
            Activity.date <= end_date
        ).group_by(Activity.date).all()
        
        heatmap_data = [{
            'date': row.date.strftime('%Y-%m-%d'),
            'value': round((row.completed / row.total * 100) if row.total > 0 else 0, 1)
        } for row in heatmap_query]
        
        return jsonify({
            'success': True,
            'stats': {
                'completion_rate': round((total_completed / total_activities * 100) if total_activities > 0 else 0, 1),
                'best_streak': best_streak,
                'activities_count': f"{total_completed}/{total_activities}",
                'top_activity': top_activity,
                'period_label': period_label,
                'activity_completion': activity_completion,
                'activity_streaks': activity_streaks,
                'heatmap_data': heatmap_data
            }
        })
        
    except Exception as e:
        print(f"Error getting dashboard stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error getting dashboard stats: {str(e)}'
        }), 500

@app.route('/api/stats', methods=['GET', 'POST'])
@login_required
def handle_stats():
    if request.method == 'POST':
        try:
            print("Request Content-Type:", request.headers.get('Content-Type'))
            print("Raw request data:", request.get_data(as_text=True))
            
            if not request.is_json:
                print("Request is not JSON")
                return jsonify({
                    'success': False,
                    'message': 'Request must be JSON'
                }), 400
                
            data = request.get_json()
            print("Parsed JSON data:", data)
            
            if not data or 'activities' not in data:
                return jsonify({
                    'success': False,
                    'message': 'No activities data provided'
                }), 400
            
            activities = data['activities']
            if not isinstance(activities, list) or len(activities) == 0:
                return jsonify({
                    'success': False,
                    'message': 'Activities must be a non-empty array'
                }), 400
            
            results = []
            for activity_data in activities:
                name = activity_data.get('name')
                date_str = activity_data.get('date')
                completed = activity_data.get('completed', False)
                value = activity_data.get('value')  # Get the numeric value if present
                
                if not name or not date_str:
                    return jsonify({
                        'success': False,
                        'message': 'Each activity must have name and date'
                    }), 400
                
                try:
                    activity_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                except ValueError:
                    return jsonify({
                        'success': False,
                        'message': f'Invalid date format for {name}: {date_str}. Use YYYY-MM-DD'
                    }), 400
                
                # Check if activity already exists for this date
                existing_activity = Activity.query.filter_by(
                    user_id=current_user.id,
                    name=name,
                    date=activity_date
                ).first()
                
                if existing_activity:
                    # Update existing activity
                    existing_activity.completed = completed
                    existing_activity.value = value  # Update the value
                    existing_activity.updated_at = datetime.now()
                    results.append(existing_activity.to_dict())
                else:
                    # Create new activity
                    activity = Activity(
                        user_id=current_user.id,
                        name=name,
                        date=activity_date,
                        completed=completed,
                        value=value  # Set the value for new activities
                    )
                    db.session.add(activity)
                    results.append(activity.to_dict())
            
            db.session.commit()
            return jsonify({
                'success': True,
                'message': 'Activities saved successfully',
                'activities': results
            })
            
        except Exception as e:
            db.session.rollback()
            print(f"Error processing activity: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'Error processing activity: {str(e)}'
            }), 500
    else:
        start_date = request.args.get('start')
        end_date = request.args.get('end')
        
        if not start_date or not end_date:
            return jsonify({
                'success': False,
                'message': 'Start and end dates are required'
            }), 400
        
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            activities = Activity.query.filter(
                Activity.user_id == current_user.id,
                Activity.date >= start,
                Activity.date <= end
            ).all()
            
            return jsonify({
                'success': True,
                'activities': [activity.to_dict() for activity in activities]
            })
            
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid date format. Use YYYY-MM-DD'
            }), 400
        except Exception as e:
            print(f"Error fetching activities: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'Error fetching activities: {str(e)}'
            }), 500

@app.route('/admin/users')
@login_required
def admin_users():
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.', 'danger')
        return redirect(url_for('index'))
    users = User.query.all()
    return render_template('admin_users.html', users=users)

@app.route('/admin/users/<int:user_id>')
@login_required
def get_user(user_id):
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Access denied'}), 403
    
    user = User.query.get_or_404(user_id)
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': user.full_name,
        'student_number': user.student_number,
        'class_name': user.class_name,
        'is_admin': user.is_admin,
        'is_active': user.is_active
    })

@app.route('/admin/users/<int:user_id>/edit', methods=['POST'])
@login_required
def edit_user(user_id):
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Access denied'}), 403
    
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    try:
        user.full_name = data.get('full_name', user.full_name)
        user.student_number = data.get('student_number', user.student_number)
        user.class_name = data.get('class_name', user.class_name)
        
        # Handle password change if provided
        new_password = data.get('password')
        if new_password and new_password.strip():
            user.set_password(new_password)
        
        db.session.commit()
        return jsonify({'status': 'success'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/admin/users/<int:user_id>/toggle', methods=['POST'])
@login_required
def toggle_user(user_id):
    if not current_user.is_admin:
        return jsonify({'status': 'error', 'message': 'Access denied'}), 403
    
    user = User.query.get_or_404(user_id)
    if user.is_admin:
        return jsonify({'status': 'error', 'message': 'Cannot toggle admin user status'}), 400
    
    try:
        user.is_active = not user.is_active
        db.session.commit()
        return jsonify({'status': 'success'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/create_user', methods=['GET', 'POST'])
@login_required
def create_user():
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.', 'danger')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        student_number = request.form.get('student_number')
        class_name = request.form.get('class_name')
        is_admin = bool(request.form.get('is_admin'))
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists.', 'danger')
            return redirect(url_for('create_user'))
        
        if User.query.filter_by(email=email).first():
            flash('Email already exists.', 'danger')
            return redirect(url_for('create_user'))
        
        try:
            user = User(
                username=username,
                email=email,
                full_name=full_name,
                student_number=student_number,
                class_name=class_name,
                is_admin=is_admin,
                is_active=True
            )
            user.set_password(password)
            
            # Create default activities for the new user
            activities = [
                Activity(user=user, name='Sholat Subuh', description='Sholat Subuh tepat waktu'),
                Activity(user=user, name='Sholat Dzuhur', description='Sholat Dzuhur tepat waktu'),
                Activity(user=user, name='Sholat Ashar', description='Sholat Ashar tepat waktu'),
                Activity(user=user, name='Sholat Maghrib', description='Sholat Maghrib tepat waktu'),
                Activity(user=user, name='Sholat Isya', description='Sholat Isya tepat waktu'),
                Activity(user=user, name='Membaca Al-Quran', description='Membaca Al-Quran minimal 1 halaman'),
                Activity(user=user, name='Dzikir Pagi', description='Membaca dzikir pagi'),
                Activity(user=user, name='Dzikir Petang', description='Membaca dzikir petang')
            ]
            
            db.session.add(user)
            for activity in activities:
                db.session.add(activity)
            
            db.session.commit()
            flash('User created successfully.', 'success')
            return redirect(url_for('admin_users'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error creating user: {str(e)}', 'danger')
            return redirect(url_for('create_user'))
    
    return render_template('create_user.html')

@app.route('/generate-dummy-data')
@login_required
def generate_dummy_data():
    if not current_user.is_admin:
        return jsonify({
            'success': False,
            'message': 'Only admin can generate dummy data'
        }), 403
        
    try:
        print("Starting to generate dummy data...")
        
        # List of activities with their base completion rates
        activities = {
            'Subuh': {'base_rate': 0.95, 'weekend_penalty': 0.15},
            'Dzuhur': {'base_rate': 0.95, 'weekend_penalty': 0.15},
            'Ashar': {'base_rate': 0.95, 'weekend_penalty': 0.15},
            'Maghrib': {'base_rate': 0.95, 'weekend_penalty': 0.15},
            'Isya': {'base_rate': 0.95, 'weekend_penalty': 0.15},
            'Rowatib': {'base_rate': 0.8, 'weekend_penalty': 0.2},
            'Qiyamulail': {'base_rate': 0.6, 'weekend_penalty': 0.2},
            'Dhuha': {'base_rate': 0.6, 'weekend_penalty': 0.2},
            'Tilawah Qur\'an': {'base_rate': 0.8, 'weekend_penalty': 0.2},
            'Puasa': {'base_rate': 0.6, 'weekend_penalty': 0.2},
            'Al-Ma\'tsurat Pagi': {'base_rate': 0.8, 'weekend_penalty': 0.2},
            'Al-Ma\'tsurat Sore': {'base_rate': 0.8, 'weekend_penalty': 0.2}
        }
        
        # Get all non-admin users (limit to 20 users)
        users = User.query.filter_by(is_admin=False).limit(20).all()
        if not users:
            return jsonify({
                'success': False,
                'message': 'No non-admin users found'
            }), 404
        
        # Generate data for the last year
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=365)  # 1 year
        current_time = datetime.now()
        total_records = 0
        
        print(f"Generating data from {start_date} to {end_date}")
        
        for user in users:
            print(f"Generating data for user: {user.username} (ID: {user.id})")
            
            try:
                # Delete existing dummy data for this user
                db.session.query(Activity).filter(
                    Activity.user_id == user.id,
                    Activity.date >= start_date,
                    Activity.date <= end_date
                ).delete(synchronize_session=False)
                db.session.commit()
                
                # Prepare bulk insert data
                activities_to_insert = []
                current_date = start_date
                
                # Generate user-specific activity patterns
                user_activity_bias = random.uniform(0.9, 1.1)  # Some users are more/less active
                
                while current_date <= end_date:
                    is_weekend = current_date.weekday() >= 5
                    is_ramadan = False  # TODO: Add Ramadan date check if needed
                    
                    # Add seasonal variations
                    season_factor = 1.0
                    month = current_date.month
                    if month in [6, 7, 8]:  # Summer vacation
                        season_factor = 0.9
                    elif month in [1, 12]:  # Winter holidays
                        season_factor = 0.85
                    
                    for activity_name, activity_info in activities.items():
                        base_rate = activity_info['base_rate']
                        weekend_penalty = activity_info['weekend_penalty']
                        
                        # Calculate completion chance with various factors
                        completion_chance = base_rate * user_activity_bias * season_factor
                        
                        if is_weekend:
                            completion_chance -= weekend_penalty
                            
                        if is_ramadan and activity_name == 'Puasa':
                            completion_chance = 0.95  # Higher chance during Ramadan
                            
                        # Special cases
                        if activity_name == 'Puasa' and current_date.weekday() in [0, 3]:  # Monday and Thursday
                            completion_chance += 0.2
                            
                        # Add some randomness but maintain the pattern
                        random_factor = random.uniform(0.9, 1.1)
                        completion_chance *= random_factor
                        
                        # Ensure chance stays within bounds
                        completion_chance = max(0.1, min(0.99, completion_chance))
                        
                        activities_to_insert.append({
                            'user_id': user.id,
                            'name': activity_name,
                            'date': current_date,
                            'completed': random.random() < completion_chance,
                            'created_at': current_time,
                            'updated_at': current_time
                        })
                    
                    current_date += timedelta(days=1)
                
                # Bulk insert in batches of 1000
                batch_size = 1000
                for i in range(0, len(activities_to_insert), batch_size):
                    batch = activities_to_insert[i:i + batch_size]
                    db.session.bulk_insert_mappings(Activity, batch)
                    db.session.commit()
                
                total_records += len(activities_to_insert)
                print(f"Successfully inserted {len(activities_to_insert)} records for user {user.username}")
                
            except Exception as user_error:
                db.session.rollback()
                print(f"Error generating data for user {user.username}: {str(user_error)}")
                print(f"Error type: {type(user_error)}")
                continue
        
        return jsonify({
            'success': True,
            'message': f'Successfully generated {total_records} dummy records for {len(users)} users'
        })
        
    except Exception as e:
        print(f"Error generating dummy data: {str(e)}")
        print(f"Error type: {type(e)}")
        return jsonify({
            'success': False,
            'message': f'Error generating dummy data: {str(e)}'
        }), 500

@app.route('/reset-activities-table')
@login_required
def reset_activities_table():
    try:
        # Drop existing table
        Activity.__table__.drop(db.engine, checkfirst=True)
        db.session.commit()
        print("Dropped activities table")
        
        # Create new table
        Activity.__table__.create(db.engine)
        db.session.commit()
        print("Created new activities table")
        
        return jsonify({
            'success': True,
            'message': 'Activities table reset successfully'
        })
    except Exception as e:
        print(f"Error resetting activities table: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error resetting activities table: {str(e)}'
        }), 500

# Initialize database
def init_db():
    with app.app_context():
        try:
            # Drop all tables
            print("Dropping all tables...")
            db.drop_all()
            
            # Create all tables
            print("Creating all tables...")
            db.create_all()
            
            # Create admin user
            print("Creating admin user...")
            admin = User(
                username='admin',
                email='admin@example.com',
                full_name='Administrator',
                student_number='ADMIN001',
                class_name='ADMIN',
                is_admin=True
            )
            admin.set_password('admin123')
            db.session.add(admin)
            
            # Create default user
            print("Creating default user...")
            user = User(
                username='user',
                email='user@example.com',
                full_name='Default User',
                student_number='USER001',
                class_name='CLASS-A',
                is_admin=False
            )
            user.set_password('user123')
            db.session.add(user)
            
            # Create azizah user
            print("Creating azizah user...")
            azizah = User(
                username='azizah',
                email='azizah@example.com',
                full_name='Azizah',
                student_number='USER002',
                class_name='CLASS-A',
                is_admin=False
            )
            azizah.set_password('azizah123')  # Set a known password
            db.session.add(azizah)
            
            try:
                db.session.commit()
                print('Database initialized with all users')
            except Exception as e:
                db.session.rollback()
                print(f'Error creating users: {str(e)}')
                raise
                
        except Exception as e:
            print(f"Error initializing database: {str(e)}")
            raise

if __name__ == '__main__':
    try:
        init_db()
        print("Database initialized successfully")
        app.run(host='0.0.0.0', port=5001, debug=True)
    except Exception as e:
        print(f"Failed to initialize database: {str(e)}")
