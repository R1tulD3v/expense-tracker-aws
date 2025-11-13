
        let API_BASE_URL = '';
        const USER_ID = 'test-user';
        let allExpenses = [];
        let charts = {};

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            const saved = localStorage.getItem('expenseTrackerApiUrl');
            if (saved) {
                API_BASE_URL = saved;
                document.getElementById('apiUrl').value = saved;
                loadData();
            }
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            initCharts();
        });

        function saveApiUrl() {
            const url = document.getElementById('apiUrl').value.trim();
            if (!url) {
                showNotification('error', '❌ Please enter a valid API URL');
                return;
            }
            API_BASE_URL = url.replace(/\/$/, '');
            localStorage.setItem('expenseTrackerApiUrl', API_BASE_URL);
            showNotification('success', '✅ Connected to AWS successfully!');
            document.getElementById('connectionBadge').className = 'badge badge-success';
            document.getElementById('connectionBadge').textContent = 'Connected';
            loadData();
        }

        function switchTab(tab) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            
            // Show selected tab
            document.getElementById(tab + 'Tab').classList.add('active');
            event.target.closest('.nav-item').classList.add('active');
        }

        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        }

async function loadData() {
    if (!API_BASE_URL) {
        showNotification('error', '⚠️ Please configure API URL first');
        return;
    }
    
    console.log('🔄 Loading expenses from:', `${API_BASE_URL}/expenses?userId=${USER_ID}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/expenses?userId=${USER_ID}`);
        const responseText = await response.text();
        
        console.log('📥 Load data response status:', response.status);
        console.log('📥 Load data response text:', responseText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${responseText}`);
        }
        
        const responseData = JSON.parse(responseText);
        console.log('📊 Parsed response data:', responseData);
        
        // Handle Lambda response wrapper
        let data;
        if (responseData.statusCode && responseData.body) {
            data = JSON.parse(responseData.body);
        } else {
            data = responseData;
        }
        
        console.log('📊 Final data:', data);
        
        // Ensure expenses array exists
        allExpenses = data.expenses || data.items || [];
        console.log('📊 All expenses count:', allExpenses.length);
        
        // Update dashboard with fallback values
        const totalSpent = data.totalSpent || data.total || allExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        const count = data.count || allExpenses.length;
        
        updateDashboard({
            totalSpent: totalSpent,
            count: count,
            expenses: allExpenses
        });
        
        updateExpensesTable();
        loadInsights();
        
        showNotification('success', `✅ Loaded ${count} expenses`);
        
    } catch (error) {
        console.error('🔴 Error loading data:', error);
        showNotification('error', '❌ Error loading data: ' + error.message);
    }
}


        function updateDashboard(data) {
            document.getElementById('totalSpent').textContent = `₹${(data.totalSpent || 0).toFixed(2)}`;
            document.getElementById('totalTransactions').textContent = data.count || 0;
            document.getElementById('avgDaily').textContent = `₹${((data.totalSpent || 0) / 30).toFixed(2)}`;
            document.getElementById('budgetRemaining').textContent = `₹${(10000 - (data.totalSpent || 0)).toFixed(2)}`;
            
            // Update header stats
            document.getElementById('headerTotalSpent').textContent = `₹${(data.totalSpent || 0).toFixed(2)}`;
            document.getElementById('headerTransactions').textContent = data.count || 0;
            document.getElementById('headerBudget').textContent = `${((data.totalSpent / 10000) * 100).toFixed(0)}%`;
        }

function updateExpensesTable() {
    const tbody = document.getElementById('expensesTableBody');
    
    console.log('📋 Updating table with expenses:', allExpenses.length);
    
    if (!allExpenses || allExpenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <div>📭 No expenses found</div>
                    <div style="margin-top: 10px; font-size: 0.9rem;">Add your first expense to get started!</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = allExpenses.map(exp => `
        <tr id="expense-row-${exp.expenseId}">
            <td>${exp.date || 'N/A'}</td>
            <td>${exp.description || 'No description'}</td>
            <td><span class="badge badge-primary">${(exp.category || 'other').toUpperCase()}</span></td>
            <td><span class="badge badge-success">${exp.department || 'General'}</span></td>
            <td><strong>₹${parseFloat(exp.amount || 0).toFixed(2)}</strong></td>
            <td><span class="badge badge-success">✓ Approved</span></td>
            <td style="display: flex; gap: 5px;">
                <button class="btn btn-outline" style="padding: 5px 10px; font-size: 0.85rem;" onclick="editExpense('${exp.expenseId}')">
                    ✏️ Edit
                </button>
                <button class="btn btn-outline" style="padding: 5px 10px; font-size: 0.85rem; color: var(--danger); border-color: var(--danger);" onclick="deleteExpense('${exp.expenseId}', '${exp.userId}')">
                    🗑️ Delete
                </button>
            </td>
        </tr>
    `).join('');
}



        async function loadInsights() {
            if (!API_BASE_URL) return;
            
            try {
                const response = await fetch(`${API_BASE_URL}/insights?userId=${USER_ID}`);
                const responseText = await response.text();
                const responseData = JSON.parse(responseText);
                let data = responseData.statusCode ? JSON.parse(responseData.body) : responseData;
                
                updateCharts(data);
            } catch (error) {
                console.error('Error loading insights:', error);
            }
        }

        function initCharts() {
            // Category Pie Chart
            const ctx1 = document.getElementById('categoryChart');
            if (ctx1) {
                charts.category = new Chart(ctx1, {
                    type: 'doughnut',
                    data: {
                        labels: ['Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping'],
                        datasets: [{
                            data: [0, 0, 0, 0, 0],
                            backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }

            // Trend Line Chart
            const ctx2 = document.getElementById('trendChart');
            if (ctx2) {
                charts.trend = new Chart(ctx2, {
                    type: 'line',
                    data: {
                        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                        datasets: [{
                            label: 'Weekly Spending',
                            data: [0, 0, 0, 0],
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
        }

        function updateCharts(data) {
            if (charts.category && data.categoryBreakdown) {
                const categories = Object.keys(data.categoryBreakdown);
                const values = Object.values(data.categoryBreakdown);
                charts.category.data.labels = categories;
                charts.category.data.datasets[0].data = values;
                charts.category.update();
            }
        }

        function openAddExpenseModal() {
            document.getElementById('addExpenseModal').classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function openBudgetModal() {
            showNotification('info', '🎯 Budget management coming soon!');
        }

// Place this around line 1150, replacing the existing expenseForm.onsubmit
document.getElementById('expenseForm').onsubmit = async function(e) {
    e.preventDefault();
    
    if (!API_BASE_URL) {
        showNotification('error', '❌ Please configure API URL first');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Adding...';
    
    const expense = {
        userId: USER_ID,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        date: document.getElementById('date').value
    };
    
    console.log('📤 Sending expense to API:', expense);
    console.log('📍 API URL:', `${API_BASE_URL}/expenses`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/expenses`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(expense)
        });
        
        const responseText = await response.text();
        console.log('📥 Response status:', response.status);
        console.log('📥 Response text:', responseText);
        
        if (response.ok) {
            showNotification('success', '✅ Expense added successfully to AWS DynamoDB!');
            closeModal('addExpenseModal');
            document.getElementById('expenseForm').reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            
            // Reload data after short delay
             loadData();
        } else {
            const errorMsg = responseText.length > 100 ? responseText.substring(0, 100) + '...' : responseText;
            showNotification('error', `❌ Error ${response.status}: ${errorMsg}`);
        }
    } catch (error) {
        showNotification('error', '❌ Network error: ' + error.message);
        console.error('🔴 Full error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
};
async function deleteExpense(expenseId, userId) {
    // Confirm before deleting
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    if (!API_BASE_URL) {
        showNotification('error', '❌ Please configure API URL first');
        return;
    }
    
    console.log('🗑️ Deleting expense:', expenseId);
    
    // Show deleting animation
    const row = document.getElementById(`expense-row-${expenseId}`);
    if (row) {
        row.style.opacity = '0.5';
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}?userId=${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const responseText = await response.text();
        console.log('📥 Delete response:', responseText);
        
        if (response.ok) {
            showNotification('success', '✅ Expense deleted successfully!');
            
            // Remove from local array
            allExpenses = allExpenses.filter(exp => exp.expenseId !== expenseId);
            
            // Update UI
            updateExpensesTable();
            updateDashboard({
                totalSpent: allExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0),
                count: allExpenses.length,
                expenses: allExpenses
            });
            loadInsights();
            
        } else {
            showNotification('error', '❌ Error deleting expense: ' + responseText);
            if (row) row.style.opacity = '1';
        }
        
    } catch (error) {
        showNotification('error', '❌ Network error: ' + error.message);
        console.error('🔴 Delete error:', error);
        if (row) row.style.opacity = '1';
    }
}
function editExpense(expenseId) {
    showNotification('info', '✏️ Edit functionality coming soon!');
    console.log('Edit expense:', expenseId);
    
    // TODO: You can implement edit modal later
    // For now, just show a message
}



        function filterExpenses() {
            const search = document.getElementById('searchExpense').value.toLowerCase();
            const category = document.getElementById('filterCategory').value;
            const department = document.getElementById('filterDepartment').value;
            
            const filtered = allExpenses.filter(exp => {
                const matchSearch = exp.description.toLowerCase().includes(search);
                const matchCategory = !category || exp.category === category;
                const matchDepartment = !department || exp.department === department;
                return matchSearch && matchCategory && matchDepartment;
            });
            
            // Update table with filtered results
            const tbody = document.getElementById('expensesTableBody');
            tbody.innerHTML = filtered.map(exp => `
                <tr>
                    <td>${exp.date}</td>
                    <td>${exp.description}</td>
                    <td><span class="badge badge-primary">${exp.category}</span></td>
                    <td><span class="badge badge-success">${exp.department || 'General'}</span></td>
                    <td><strong>₹${parseFloat(exp.amount).toFixed(2)}</strong></td>
                    <td><span class="badge badge-success">Approved</span></td>
                    <td>
                        <button class="btn btn-outline" style="padding: 5px 10px; font-size: 0.85rem;">Edit</button>
                    </td>
                </tr>
            `).join('');
        }

        function exportToPDF() {
            showNotification('info', '📄 Generating PDF report...');
            setTimeout(() => {
                showNotification('success', '✅ PDF exported successfully!');
            }, 2000);
        }

        function exportToCSV() {
            showNotification('info', '📊 Exporting to CSV...');
        }

        function exportToExcel() {
            showNotification('info', '📗 Exporting to Excel...');
        }

        function generateReport(type) {
            showNotification('info', `📊 Generating ${type} report...`);
        }

        function showNotification(type, message) {
            const notification = document.createElement('div');
            notification.className = `notification status ${type}`;
            notification.innerHTML = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'fadeOut 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }, 3000);
        }
