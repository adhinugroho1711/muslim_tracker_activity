const activityLocks = {};
const checkedActivities = {};

function getActivityKey(activity, date) {
    return `${activity}_${date}`;
}

function hasBeenToggled(activity, date) {
    const key = getActivityKey(activity, date);
    return activityLocks[key] === true;
}

function markAsToggled(activity, date) {
    const key = getActivityKey(activity, date);
    activityLocks[key] = true;
    
    // Save the locks state to localStorage
    localStorage.setItem('activityLocks', JSON.stringify(activityLocks));
}

function hasBeenCheckedBefore(activity, date) {
    const key = getActivityKey(activity, date);
    return checkedActivities[key] === true;
}

function markAsChecked(activity, date, isChecked) {
    const key = getActivityKey(activity, date);
    if (isChecked) {
        checkedActivities[key] = true;
    }
    // Save the checked state to localStorage
    localStorage.setItem('checkedActivities', JSON.stringify(checkedActivities));
}

// Helper function to check if activity needs numeric input
function isNumericActivity(activity) {
    return activity === 'Rowatib' || activity === 'Tilawah Qur\'an';
}

// Helper function to convert month name to number
function getMonthNumber(monthName) {
    const months = {
        'Januari': 1,
        'Februari': 2,
        'Maret': 3,
        'April': 4,
        'Mei': 5,
        'Juni': 6,
        'Juli': 7,
        'Agustus': 8,
        'September': 9,
        'Oktober': 10,
        'November': 11,
        'Desember': 12
    };
    return months[monthName] || 1;  // Default to January if not found
}

// Track modified cells
let modifiedCells = new Set();

// Add CSS for clickable cells
const style = document.createElement('style');
style.textContent = `
    .clickable-cell {
        cursor: pointer;
        min-width: 30px;
        transition: background-color 0.2s;
    }
    .clickable-cell:hover {
        background-color: #e9ecef;
    }
    .clickable-cell.table-success {
        background-color: #d4edda !important;
    }
    .clickable-cell.table-success:hover {
        background-color: #c3e6cb !important;
    }
`;
document.head.appendChild(style);

// Handle cell click with autosave
async function handleCellClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const cell = event.currentTarget;
    console.log('Cell clicked:', cell);
    
    if (!cell || !cell.matches('.clickable-cell')) {
        console.log('No valid cell clicked');
        return;
    }

    const activity = cell.dataset.activity;
    const date = cell.dataset.date;
    const isNumeric = isNumericActivity(activity);
    
    if (!activity || !date) {
        console.log('Missing activity or date:', { activity, date });
        return;
    }

    console.log('Handling click for:', { activity, date, isNumeric });

    let value = null;
    let isChecked = false;

    if (isNumeric) {
        // For numeric inputs, get the value from the input field
        const input = cell.querySelector('input[type="number"]');
        if (input) {
            value = input.value ? parseInt(input.value) : 0;
            isChecked = value > 0;
        }
    } else {
        // For checkbox-style cells, toggle the state
        isChecked = !cell.classList.contains('table-success');
        if (isChecked) {
            cell.classList.add('table-success');
            cell.textContent = '✓';
        } else {
            cell.classList.remove('table-success');
            cell.textContent = '';
        }
    }
    
    console.log('Activity state:', { isChecked, value });

    try {
        // Get current month and year
        const bulan = document.getElementById('bulan').value;
        const tahun = document.getElementById('tahun').value;
        const month = getMonthNumber(bulan);
        
        // Create the full date string (YYYY-MM-DD)
        const fullDate = new Date(tahun, month - 1, parseInt(date));
        const formattedDate = fullDate.toISOString().split('T')[0];
        
        // Prepare the activity data
        const activityData = {
            activities: [{
                name: activity,
                date: formattedDate,
                completed: isChecked,
                value: value
            }]
        };
        
        console.log('Saving activity:', activityData);
        
        // Save to server
        const response = await fetch('/api/stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(activityData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Save response:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to save activity');
        }
    } catch (error) {
        console.error('Error saving activity:', error);
        showError('Error saving activity: ' + error.message);
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Set current month and year
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const currentDate = new Date();
    const currentMonth = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();

    // Get month and year elements
    const monthSelect = document.getElementById('bulan');
    const yearInput = document.getElementById('tahun');

    if (monthSelect && yearInput) {
        // Set current month and year
        monthSelect.value = currentMonth;
        yearInput.value = currentYear;
    }

    // Handle numeric inputs
    document.querySelectorAll('.numeric-input').forEach(input => {
        input.addEventListener('input', function(e) {
            // Remove any non-numeric characters
            let value = this.value.replace(/[^0-9]/g, '');
            
            // Convert to number and ensure it's within bounds
            value = parseInt(value) || 0;
            
            // Check max value based on activity
            const cell = this.closest('.clickable-cell');
            const activity = cell.dataset.activity;
            const maxValue = activity === 'Rowatib' ? 12 : 999;
            
            // Ensure value is within bounds
            value = Math.min(Math.max(0, value), maxValue);
            
            // Update input value
            this.value = value;
        });

        // Prevent keyboard events from propagating to parent
        input.addEventListener('keydown', function(e) {
            e.stopPropagation();
        });

        // Select all text when focused
        input.addEventListener('focus', function() {
            this.select();
        });
    });

    // Set current month and year
    const script = document.querySelector('script[data-current-month]');
    if (script) {
        const currentMonth = script.getAttribute('data-current-month');
        const currentYear = script.getAttribute('data-current-year');
        
        if (currentMonth) document.getElementById('bulan').value = currentMonth;
        if (currentYear) document.getElementById('tahun').value = currentYear;
    }

    // Add input handlers to numeric cells
    document.querySelectorAll('.clickable-cell[data-numeric="true"] input[type="number"]').forEach(input => {
        input.addEventListener('change', function(event) {
            event.stopPropagation();
            const cell = event.target.closest('.clickable-cell');
            if (cell) {
                handleCellClick.call(cell, { 
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    currentTarget: cell 
                });
            }
        });
    });

    // Add click handlers to non-numeric cells
    document.querySelectorAll('.clickable-cell:not([data-numeric="true"])').forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    // Add change handlers for month/year
    document.getElementById('bulan').addEventListener('change', loadActivities);
    document.getElementById('tahun').addEventListener('change', loadActivities);

    // Load initial data
    loadActivities();
});

// Load activities for current month
async function loadActivities() {
    const bulan = document.getElementById('bulan').value;
    const tahun = document.getElementById('tahun').value;
    const month = getMonthNumber(bulan);
    
    if (!bulan || !tahun || !month) {
        console.error('Missing month or year');
        return;
    }
    
    try {
        const startDate = new Date(tahun, month - 1, 1);
        const endDate = new Date(tahun, month, 0);
        
        const response = await fetch(`/api/stats?start=${startDate.toISOString().split('T')[0]}&end=${endDate.toISOString().split('T')[0]}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded activities:', data);
        
        if (data.success) {
            // Reset all cells first
            document.querySelectorAll('.clickable-cell').forEach(cell => {
                const isNumeric = isNumericActivity(cell.dataset.activity);
                if (isNumeric) {
                    const input = cell.querySelector('input[type="number"]');
                    if (input) {
                        input.value = '0';
                    }
                } else {
                    cell.classList.remove('table-success');
                    cell.textContent = '';
                }
            });
            
            // Update cells with activity data
            data.activities.forEach(activity => {
                const date = new Date(activity.date);
                const cell = document.querySelector(`.clickable-cell[data-activity="${activity.name}"][data-date="${date.getDate()}"]`);
                
                if (cell) {
                    const isNumeric = isNumericActivity(activity.name);
                    if (isNumeric) {
                        const input = cell.querySelector('input[type="number"]');
                        if (input && activity.value !== null) {
                            input.value = activity.value;
                        }
                    } else if (activity.completed) {
                        cell.classList.add('table-success');
                        cell.textContent = '✓';
                    }
                }
            });
        } else {
            throw new Error(data.message || 'Failed to load activities');
        }
    } catch (error) {
        console.error('Error loading activities:', error);
        showError('Error loading activities: ' + error.message);
    }
}

// Save progress to server
async function saveProgress() {
    const bulan = document.getElementById('bulan').value;
    const tahun = document.getElementById('tahun').value;
    const activities = [];
    
    console.log('Starting save progress...', { bulan, tahun });
    
    // Only save modified activities
    document.querySelectorAll('.clickable-cell').forEach(cell => {
        const activity = cell.dataset.activity;
        const day = cell.dataset.date;
        const key = getActivityKey(activity, day);
        
        // Only include if it's been modified
        if (modifiedCells.has(key)) {
            const isCompleted = cell.classList.contains('table-success');
            
            if (activity && day) {
                let value = null;
                if (isNumericActivity(activity)) {
                    const input = cell.querySelector('input[type="number"]');
                    value = input ? input.value : null;
                }
                
                // Create the full date string (YYYY-MM-DD)
                const month = getMonthNumber(bulan);
                const date = new Date(tahun, month - 1, parseInt(day));
                const formattedDate = date.toISOString().split('T')[0];
                
                activities.push({
                    name: activity,
                    date: formattedDate,
                    completed: isCompleted,
                    value: value
                });
            }
        }
    });

    if (activities.length === 0) {
        console.log('No modified activities to save');
        return;
    }

    console.log('Activities to save:', activities);

    try {
        console.log('Sending save request...');
        const response = await fetch('/api/stats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ activities })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Save response:', data);
        
        if (data.success) {
            console.log('Activities saved successfully:', data.saved_activities);
            // Clear modified cells after successful save
            modifiedCells.clear();
            
            // Reload activities to show updated state
            await loadActivities();
        } else {
            console.error('Failed to save activities:', data.message);
            showError('Failed to save activities: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving activities:', error);
        showError('Error saving activities: ' + error.message);
    }
}

// Manual save function
async function manualSave() {
    await saveProgress();
    alert('Data berhasil disimpan!');
}

// Auto-save function
async function autoSave() {
    await saveProgress();
    console.log('Auto-saved at:', new Date().toLocaleString());
}

// Get days in month helper
function getDaysInMonth(month, year) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.indexOf(month);
    return new Date(year, monthIndex + 1, 0).getDate();
}

// Print report function
function printReport() {
    try {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Pop-up window was blocked. Please allow pop-ups for this site.');
            return;
        }

        const studentName = document.getElementById('nama').value;
        const studentNumber = document.getElementById('nomorInduk').value;
        const className = document.getElementById('kelas').value;
        const month = document.getElementById('bulan').value;
        const year = document.getElementById('tahun').value;

        // Get all activities data
        const activities = {};
        const cells = document.querySelectorAll('.clickable-cell');
        cells.forEach(cell => {
            const activity = cell.dataset.activity;
            const date = cell.dataset.date;
            const isNumeric = isNumericActivity(activity);
            
            if (!activities[activity]) {
                activities[activity] = {};
            }
            
            if (isNumeric) {
                const input = cell.querySelector('input[type="number"]');
                activities[activity][date] = input ? input.value : '0';
            } else {
                activities[activity][date] = cell.classList.contains('table-success') ? '✓' : '';
            }
        });

        // Create print content
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Mutaba'ah Report - ${studentName}</title>
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 1cm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .student-info {
                        margin-bottom: 20px;
                    }
                    .student-info p {
                        margin: 5px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        font-size: 12px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 4px;
                        text-align: center;
                    }
                    th {
                        background-color: #f0f0f0;
                    }
                    .activity-group {
                        text-align: left;
                        font-weight: bold;
                        background-color: #f0f0f0;
                    }
                    .activity-name {
                        text-align: left;
                        padding-left: 20px;
                    }
                    .legend {
                        margin-top: 20px;
                        font-size: 12px;
                    }
                    .legend p {
                        margin: 5px 0;
                    }
                    @media print {
                        .no-print {
                            display: none;
                        }
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2 style="margin: 0;">SEKOLAH KEPRIBADIAN MUSLIMAH</h2>
                    <h3 style="margin: 10px 0;">MUTABA'AH YAUMIYAH</h3>
                </div>
                
                <div class="student-info">
                    <p><strong>Nama:</strong> ${studentName}</p>
                    <p><strong>Nomor Induk:</strong> ${studentNumber}</p>
                    <p><strong>Kelas:</strong> ${className}</p>
                    <p><strong>Bulan:</strong> ${month} ${year}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th colspan="2">Amalan</th>
                            ${Array.from({length: 31}, (_, i) => `<th>${i + 1}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Sholat Wajib Group -->
                        <tr>
                            <td rowspan="5" class="activity-group">Sholat Wajib</td>
                            <td class="activity-name">Subuh</td>
                            ${Array.from({length: 31}, (_, i) => `<td>${activities['Subuh']?.[i + 1] || ''}</td>`).join('')}
                        </tr>
                        <tr>
                            <td class="activity-name">Dzuhur</td>
                            ${Array.from({length: 31}, (_, i) => `<td>${activities['Dzuhur']?.[i + 1] || ''}</td>`).join('')}
                        </tr>
                        <tr>
                            <td class="activity-name">Ashar</td>
                            ${Array.from({length: 31}, (_, i) => `<td>${activities['Ashar']?.[i + 1] || ''}</td>`).join('')}
                        </tr>
                        <tr>
                            <td class="activity-name">Maghrib</td>
                            ${Array.from({length: 31}, (_, i) => `<td>${activities['Maghrib']?.[i + 1] || ''}</td>`).join('')}
                        </tr>
                        <tr>
                            <td class="activity-name">Isya</td>
                            ${Array.from({length: 31}, (_, i) => `<td>${activities['Isya']?.[i + 1] || ''}</td>`).join('')}
                        </tr>

                        <!-- Sholat Sunnah Group -->
                        <tr>
                            <td rowspan="3" class="activity-group">Sholat Sunnah</td>
                            <td class="activity-name">Rowatib</td>
                            ${Array.from({length: 31}, (_, i) => `<td>${activities['Rowatib']?.[i + 1] || '0'}</td>`).join('')}
                        </tr>
                        <tr>
                            <td class="activity-name">Qiyamulail</td>
                            ${Array.from({length: 31}, (_, i) => `<td>${activities['Qiyamulail']?.[i + 1] || ''}</td>`).join('')}
                        </tr>
                        <tr>
                            <td class="activity-name">Dhuha</td>
                            ${Array.from({length: 31}, (_, i) => `<td>${activities['Dhuha']?.[i + 1] || ''}</td>`).join('')}
                        </tr>

                        <!-- Tilawah Group -->
                        <tr>
                            <td colspan="2" class="activity-group">Tilawah Qur'an</td>
                            ${Array.from({length: 31}, (_, i) => `<td>${activities['Tilawah Qur\'an']?.[i + 1] || '0'}</td>`).join('')}
                        </tr>

                        <!-- Puasa -->
                        <tr>
                            <td colspan="2" class="activity-group">Puasa</td>
                            ${Array.from({length: 31}, (_, i) => `<td>${activities['Puasa']?.[i + 1] || ''}</td>`).join('')}
                        </tr>

                        <!-- Al-Ma'tsurat Group -->
                        <tr>
                            <td rowspan="2" class="activity-group">Al-Ma'tsurat</td>
                            <td class="activity-name">Pagi</td>
                            ${Array.from({length: 31}, (_, i) => `<td>${activities['Al-Ma\'tsurat Pagi']?.[i + 1] || ''}</td>`).join('')}
                        </tr>
                        <tr>
                            <td class="activity-name">Sore</td>
                            ${Array.from({length: 31}, (_, i) => `<td>${activities['Al-Ma\'tsurat Sore']?.[i + 1] || ''}</td>`).join('')}
                        </tr>
                        <!-- Wirid Qur'an Group -->
<tr>
    <td rowspan="7" class="activity-group">Wirid Qur'an</td>
    <td class="activity-name">Ar Rahman</td>
    ${Array.from({length: 31}, (_, i) => `<td>${activities['Ar Rahman']?.[i + 1] || ''}</td>`).join('')}
</tr>
<tr>
    <td class="activity-name">Al Waqiah</td>
    ${Array.from({length: 31}, (_, i) => `<td>${activities['Al Waqiah']?.[i + 1] || ''}</td>`).join('')}
</tr>
<tr>
    <td class="activity-name">Ad Dukhan</td>
    ${Array.from({length: 31}, (_, i) => `<td>${activities['Ad Dukhan']?.[i + 1] || ''}</td>`).join('')}
</tr>
<tr>
    <td class="activity-name">As Sajadah</td>
    ${Array.from({length: 31}, (_, i) => `<td>${activities['As Sajadah']?.[i + 1] || ''}</td>`).join('')}
</tr>
<tr>
    <td class="activity-name">Al Mulk</td>
    ${Array.from({length: 31}, (_, i) => `<td>${activities['Al Mulk']?.[i + 1] || ''}</td>`).join('')}
</tr>
<tr>
    <td class="activity-name">Yaasin</td>
    ${Array.from({length: 31}, (_, i) => `<td>${activities['Yaasin']?.[i + 1] || ''}</td>`).join('')}
</tr>
<tr>
    <td class="activity-name">Al Kahfi</td>
    ${Array.from({length: 31}, (_, i) => `<td>${activities['Al Kahfi']?.[i + 1] || ''}</td>`).join('')}
</tr>

<!-- Olahraga -->
<tr>
    <td colspan="2" class="activity-group">Olahraga</td>
    ${Array.from({length: 31}, (_, i) => `<td>${activities['Olahraga']?.[i + 1] || ''}</td>`).join('')}
</tr>
                    </tbody>
                </table>

                <div class="legend">
                    <p><strong>Keterangan:</strong></p>
                    <p>✓ = Aktivitas telah dilakukan</p>
                    <p>Rowatib = Jumlah rakaat sholat sunnah rowatib (0-12)</p>
                    <p>Tilawah Qur'an = Jumlah halaman yang dibaca</p>
                </div>

                <div class="no-print" style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print();" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
                        Print Laporan
                    </button>
                </div>
            </body>
            </html>
        `;

        // Write content to print window
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();

    } catch (error) {
        console.error('Error generating print report:', error);
        alert('Terjadi kesalahan saat membuat laporan. Silakan coba lagi.');
    }
}

// Add event listener for print button
document.addEventListener('DOMContentLoaded', function() {
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', printReport);
    }
});

// Load data based on current page
function loadData() {
    const path = window.location.pathname;
    if (path === '/') {
        loadActivities();
    } else if (path === '/dashboard') {
        loadStats();
    }
}

// Show error message
function showError(message) {
    // Remove any existing error messages
    const existingErrors = document.querySelectorAll('.alert-danger');
    existingErrors.forEach(error => error.remove());

    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(errorDiv, container.firstChild);
        // Remove error message after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Show error message for dashboard page
function showDashboardError(message) {
    const existingError = document.querySelector('.alert-danger');
    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container-fluid');
    if (container) {
        container.insertBefore(errorDiv, container.firstChild);
    }
}

// Load stats for dashboard page
function loadStats() {
    const viewType = document.getElementById('viewType')?.value || 'daily';
    const monthName = document.getElementById('bulan')?.value || 'Januari';
    const year = document.getElementById('tahun')?.value || new Date().getFullYear();
    const month = getMonthNumber(monthName);

    fetch(`/api/stats?view_type=${viewType}&month=${month}&year=${year}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Received dashboard data:', data);
            if (data.error) {
                throw new Error(data.error);
            }
            updateDashboard(data);
        })
        .catch(error => {
            console.error('Error loading stats:', error);
            showDashboardError('Failed to load activity statistics. Please try refreshing the page.');
        });
}

// Update dashboard with data
function updateDashboard(data) {
    try {
        // Update all dashboard components
        updateSummaryCards(data);
        updateCompletionChart(data.activities, document.getElementById('viewType').value);
        updateStreakChart(data.activities, document.getElementById('viewType').value);
        updateHeatmap(data.activities, document.getElementById('viewType').value);

        // Remove any existing error messages
        const existingError = document.querySelector('.alert-danger');
        if (existingError) {
            existingError.remove();
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
        showDashboardError('Error updating dashboard display: ' + error.message);
    }
}

// Update completion chart
function updateCompletionChart(activities, viewType) {
    const ctx = document.getElementById('completion-chart')?.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(activities);
    const completionRates = labels.map(activity => activities[activity].completion_rate || 0);

    if (window.completionChart) {
        window.completionChart.destroy();
    }

    window.completionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completion Rate (%)',
                data: completionRates,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Update streak chart
function updateStreakChart(activities, viewType) {
    const ctx = document.getElementById('streak-chart')?.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(activities);
    const streaks = labels.map(activity => activities[activity].streak || 0);

    if (window.streakChart) {
        window.streakChart.destroy();
    }

    window.streakChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Current Streak (days)',
                data: streaks,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Update heatmap
function updateHeatmap(activities, viewType) {
    const heatmapContainer = document.getElementById('activity-heatmap');
    if (!heatmapContainer) return;
    
    heatmapContainer.innerHTML = '';
    
    // Create color scale
    const getColor = (value) => {
        if (value === 0) return '#ebedf0';
        if (value < 25) return '#9be9a8';
        if (value < 50) return '#40c463';
        if (value < 75) return '#30a14e';
        return '#216e39';
    };
    
    // Create heatmap grid
    const grid = document.createElement('div');
    grid.className = 'activity-calendar';
    
    // Get date range
    const year = parseInt(document.getElementById('tahun').value);
    const month = getMonthNumber(document.getElementById('bulan').value);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i <firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        emptyDay.style.backgroundColor = '#f8f9fa';
        grid.appendChild(emptyDay);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        // Calculate completion for this day
        let completedActivities = 0;
        let totalActivities = 0;
        
        Object.entries(activities).forEach(([name, activity]) => {
            if (activity.dates && activity.dates[dateStr] !== undefined) {
                totalActivities++;
                if (activity.dates[dateStr]) {
                    completedActivities++;
                }
            }
        });
        
        if (totalActivities > 0) {
            const completion = (completedActivities / totalActivities) * 100;
            const hue = Math.min(completion, 100) * 1.2; // 120 is green in HSL
            dayEl.style.backgroundColor = `hsl(${hue}, 70%, 50%)`;
            dayEl.title = `${dateStr}: ${Math.round(completion)}% completed`;
        } else {
            dayEl.style.backgroundColor = '#f8f9fa';
            dayEl.title = `${dateStr}: No activities`;
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'text-center small';
        dayNumber.textContent = day;
        dayEl.appendChild(dayNumber);
        
        grid.appendChild(dayEl);
    }
    
    heatmapContainer.appendChild(grid);
}

// Update summary cards
function updateSummaryCards(data) {
    // Update overall completion
    const overallCompletion = document.getElementById('overall-completion');
    if (data.total_activities > 0) {
        const completionRate = (data.completed_activities / data.total_activities * 100).toFixed(1);
        overallCompletion.textContent = `${completionRate}`;
    } else {
        overallCompletion.textContent = '0';
    }
    
    // Update best streak
    const bestStreak = Math.max(...Object.values(data.activities).map(a => a.streak || 0));
    document.getElementById('best-streak').textContent = bestStreak;
    
    // Update today's activities
    document.getElementById('today-activities').textContent = 
        `${data.completed_activities}/${data.total_activities}`;
    
    // Update top activity
    const topActivity = Object.entries(data.activities)
        .reduce((a, b) => (a[1].completion_rate || 0) > (b[1].completion_rate || 0) ? a : b)[0];
    document.getElementById('top-activity').textContent = topActivity;
}

// Load dashboard stats
async function loadDashboardStats() {
    console.log('Loading dashboard stats...');
    const viewType = document.getElementById('viewType')?.value || 'daily';
    const bulan = document.getElementById('bulan')?.value || new Date().toLocaleString('en-US', { month: 'long' });
    const tahun = document.getElementById('tahun')?.value || new Date().getFullYear().toString();
    const month = getMonthNumber(bulan);
    
    try {
        const response = await fetch(`/api/dashboard/stats?view_type=${viewType}&month=${month}&year=${tahun}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
            updateDashboard(data.stats);
        } else {
            throw new Error(data.message || 'Failed to load dashboard stats');
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showError('Error loading dashboard stats: ' + error.message);
    }
}

// Update dashboard with data
function updateDashboard(stats) {
    try {
        console.log('Updating dashboard with stats:', stats);
        
        // Update summary cards
        const overallCompletion = document.getElementById('overall-completion');
        if (overallCompletion) {
            overallCompletion.textContent = stats.completion_rate || '0';
        }

        const bestStreak = document.getElementById('best-streak');
        if (bestStreak) {
            bestStreak.textContent = stats.best_streak || '0';
        }

        const todayActivities = document.getElementById('today-activities');
        if (todayActivities) {
            todayActivities.textContent = stats.activities_count || '0/0';
        }

        const topActivity = document.getElementById('top-activity');
        if (topActivity) {
            topActivity.textContent = stats.top_activity || '-';
        }
        
        // Update charts if they exist and have data
        if (document.getElementById('completion-chart') && stats.activity_completion) {
            updateCompletionChart(stats.activity_completion);
        }
        
        if (document.getElementById('streak-chart') && stats.activity_streaks) {
            updateStreakChart(stats.activity_streaks);
        }
        
        if (document.getElementById('activity-heatmap') && stats.heatmap_data) {
            updateHeatmap(stats.heatmap_data);
        }
    } catch (error) {
        console.error('Error updating dashboard:', error);
        showError('Error updating dashboard: ' + error.message);
    }
}

// Initialize dashboard
function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Set current month and year
    const script = document.querySelector('script[data-current-month]');
    if (script) {
        const currentMonth = script.getAttribute('data-current-month');
        const currentYear = script.getAttribute('data-current-year');
        
        const monthSelect = document.getElementById('bulan');
        const yearSelect = document.getElementById('tahun');
        
        if (monthSelect && currentMonth) monthSelect.value = currentMonth;
        if (yearSelect && currentYear) yearSelect.value = currentYear;
    }
    
    // Add event listeners for filters
    ['viewType', 'bulan', 'tahun'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                console.log(`${id} changed, reloading stats...`);
                loadDashboardStats();
            });
        }
    });
    
    // Load initial stats
    loadDashboardStats();
}

// Initialize dashboard when DOM is loaded
if (window.location.pathname === '/dashboard') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded, initializing dashboard...');
        initializeDashboard();
    });
}

// Update completion chart
function updateCompletionChart(completionData) {
    const ctx = document.getElementById('completion-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.completionChart) {
        window.completionChart.destroy();
    }
    
    const labels = Object.keys(completionData);
    const data = Object.values(completionData);
    
    window.completionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completion Rate (%)',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Update streak chart
function updateStreakChart(streakData) {
    const ctx = document.getElementById('streak-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.streakChart) {
        window.streakChart.destroy();
    }
    
    const labels = Object.keys(streakData);
    const data = Object.values(streakData);
    
    window.streakChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Current Streak (days)',
                data: data,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Update heatmap
function updateHeatmap(heatmapData) {
    const container = document.getElementById('activity-heatmap');
    container.innerHTML = ''; // Clear existing heatmap
    
    // Create color scale
    const getColor = (value) => {
        if (value === 0) return '#ebedf0';
        if (value < 25) return '#9be9a8';
        if (value < 50) return '#40c463';
        if (value < 75) return '#30a14e';
        return '#216e39';
    };
    
    // Create heatmap grid
    const grid = document.createElement('div');
    grid.className = 'activity-calendar';
    
    heatmapData.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.style.backgroundColor = getColor(day.value);
        cell.title = `${new Date(day.date).toLocaleDateString()}: ${day.value}% completed`;
        grid.appendChild(cell);
    });
    
    container.appendChild(grid);
}

// Generate dummy data
async function generateDummyData() {
    try {
        const response = await fetch('/generate-dummy-data');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
            showSuccess('Dummy data generated successfully!');
            // Reload dashboard data
            loadDashboardStats();
        } else {
            throw new Error(data.message || 'Failed to generate dummy data');
        }
    } catch (error) {
        console.error('Error generating dummy data:', error);
        showError('Error generating dummy data: ' + error.message);
    }
}

// Reset activities table
async function resetActivitiesTable() {
    if (!confirm('Are you sure you want to reset the activities table? This will delete all existing activity data.')) {
        return;
    }
    
    try {
        const response = await fetch('/reset-activities-table');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
            showSuccess('Activities table reset successfully!');
            // Generate new dummy data
            await generateDummyData();
        } else {
            throw new Error(data.message || 'Failed to reset activities table');
        }
    } catch (error) {
        console.error('Error resetting activities table:', error);
        showError('Error resetting activities table: ' + error.message);
    }
}
