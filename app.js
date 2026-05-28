const API_URL = 'http://127.0.0.1:8000/api/records';

let currentRecords = [];
let currentEditingId = null;
let completedRooms = [];

// ==========================================
// 🛠️ SYSTEM ICONS
// ==========================================
function getSystemIcon(systemName) {
  if (systemName.includes('Electrical')) return 'bi-lightning-charge-fill';
  if (systemName.includes('UPS')) return 'bi-battery-charging';
  if (systemName.includes('Temperature')) return 'bi-thermometer-half';
  if (systemName.includes('Fire Annunciator')) return 'bi-bell-fill';
  if (systemName.includes('Fire Suppression')) return 'bi-fire';
  if (systemName.includes('Water Leak')) return 'bi-droplet-fill';
  if (systemName.includes('Access Control')) return 'bi-shield-lock-fill';
  if (systemName.includes('CCTV')) return 'bi-camera-video-fill';
  if (systemName.includes('Check Rack')) return 'bi-server';
  if (systemName.includes('Generator')) return 'bi-gear-wide-connected';
  if (systemName.includes('Fuel')) return 'bi-fuel-pump-fill';
  if (systemName.includes('Breaking Glass')) return 'bi-exclamation-triangle-fill';
  return 'bi-gear-wide-connected';
}

// ==========================================
// 🔒 AUTHENTICATION LOGIC
// ==========================================
function checkAuth() {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    document.getElementById('sidebar-wrapper').style.display = 'none';
    document.querySelector('.navbar').style.display = 'none';
    switchView('login');
    return false;
  }
  document.getElementById('sidebar-wrapper').style.display = 'block';
  document.querySelector('.navbar').style.display = 'flex';
  return true;
}

// Extract Username from Token
function getUsernameFromToken() {
  const token = localStorage.getItem('jwt_token');
  if (!token) return 'Unknown User';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub; 
  } catch (e) {
    return 'Unknown User';
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem('jwt_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function handleLogin(e) {
  e.preventDefault(); 
  
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  showLoader('Signing in...');
  try {
    const response = await fetch('http://127.0.0.1:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    hideLoader();

    if (response.ok) {
      localStorage.setItem('jwt_token', data.access_token);
      document.getElementById('loginForm').reset();
      checkAuth();
      switchView('dashboard');
    } else {
      Swal.fire({ icon: 'error', title: 'Login Failed', text: data.detail });
    }
  } catch (error) {
    hideLoader();
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Could not connect to server.' });
  }
}

// --- Auth UI Toggle ---
function toggleAuthForm(view) {
  if (view === 'register') {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';
  } else {
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
  }
}

// --- Updated Register Logic ---
async function handleRegister(e) {
  e.preventDefault();
  
  const first_name = document.getElementById('regFirstName').value.trim();
  const last_name = document.getElementById('regLastName').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  if (!first_name || !last_name || !password) {
    Swal.fire({ icon: 'warning', title: 'Missing Info', text: 'Please fill out all fields.' });
    return;
  }

  showLoader('Creating account...');
  try {
    const response = await fetch('http://127.0.0.1:8000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name, last_name, password })
    });

    const data = await response.json();
    hideLoader();

    if (response.ok) {
      // The backend sends back the generated username in data.message
      Swal.fire({ 
        icon: 'success', 
        title: 'Account Created!', 
        html: `Your generated username is:<br><br><strong class="fs-4 text-primary">${data.message}</strong><br><br>Please use this to log in.`,
        confirmButtonColor: '#0F172A'
      }).then(() => {
        document.getElementById('registerForm').reset();
        toggleAuthForm('login');
      });
    } else {
      Swal.fire({ icon: 'error', title: 'Registration Failed', text: data.detail });
    }
  } catch (error) {
    hideLoader();
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Could not connect to server.' });
  }
}

function logout() {
  localStorage.removeItem('jwt_token');
  checkAuth();
}

// ==========================================
// 📱 NAVIGATION & VIEWS
// ==========================================
document.getElementById("menu-toggle").addEventListener("click", function(e) {
  e.preventDefault(); 
  document.getElementById("wrapper").classList.toggle("toggled");
});

function switchView(view) {
  // Add 'reportView' to the array!
  const views = ['dashboardView', 'formView', 'tableView', 'subSelectionView', 'loginView', 'analyticsView', 'reportView'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if(el) el.style.display = 'none';
  });

  document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));

  if (view === 'login') { document.getElementById('loginView').style.display = 'block'; } 
  else if (view === 'dashboard') {
    document.getElementById('dashboardView').style.display = 'block'; 
    document.getElementById('nav-dashboard').classList.add('active'); 
    updateDashboardStatus();
  } 
  else if (view === 'table') {
    document.getElementById('tableView').style.display = 'block';
    document.getElementById('nav-table').classList.add('active'); 
    loadTableData();
  }
  else if (view === 'analytics') {
    document.getElementById('analyticsView').style.display = 'block';
    document.getElementById('nav-analytics').classList.add('active');
    loadAnalyticsData(); 
  }
  else if (view === 'formView') { document.getElementById('formView').style.display = 'block'; }
  else if (view === 'subSelectionView') { document.getElementById('subSelectionView').style.display = 'block'; }
  // 👇 ADD THIS LINE 👇
  else if (view === 'reportView') { document.getElementById('reportView').style.display = 'block'; }

  if (window.innerWidth < 768) { document.getElementById("wrapper").classList.remove("toggled"); }
}

// ==========================================
// 📝 FORM HANDLING
// ==========================================
function openForm(roomName) {
  try { resetForm(); } catch (error) { console.warn("Reset error:", error); }

  // Sub-menus
  if (roomName === 'Electrical System') {
    openSubSelection(roomName, ["1.1 MDB", "1.2 PDU", "1. RMU & TROP"]);
    return;
  }
  if (roomName === 'UPS System') {
    openSubSelection(roomName, ["2.1 UPS 2000-G & Battery", "2.2 UPS 5000-E & Battery"]);
    return;
  }
  if (roomName === 'Temperature System') {
    openSubSelection(roomName, ["3.1 Service Room 1", "3.2 Service Room 2", "3.3 Service Room 3", "3.4 Service Room 4","3. UPS & Battery Room"]);
    return;
  }

  // Hide all dynamic forms first
  document.querySelectorAll('.dynamic-form-group').forEach(el => el.style.display = 'none');

  // 1. Electrical
  if (roomName.includes('1.1 MDB')) document.getElementById('form-mdb').style.display = 'block';
  else if (roomName.includes('1.2 PDU')) document.getElementById('form-pdu').style.display = 'block';
  else if (roomName.includes('1. RMU & TROP')) document.getElementById('form-rmu').style.display = 'block';
  
  // 2. UPS
  else if (roomName.includes('2.1 UPS 2000-G')) document.getElementById('form-ups-2000-g').style.display = 'block';
  else if (roomName.includes('2.2 UPS 5000-E')) document.getElementById('form-ups-5000-e').style.display = 'block';
  
  // 3. Temperature
  else if (roomName.includes('3.1 Service Room 1')) document.getElementById('form-temp-sr1').style.display = 'block';
  else if (roomName.includes('3.2 Service Room 2')) document.getElementById('form-temp-sr2').style.display = 'block';
  else if (roomName.includes('3.3 Service Room 3')) document.getElementById('form-temp-sr3').style.display = 'block';
  else if (roomName.includes('3.4 Service Room 4')) document.getElementById('form-temp-sr4').style.display = 'block';
  else if (roomName.includes('3. UPS & Battery Room')) document.getElementById('form-temp-ups').style.display = 'block';

  // 4-12. Single Page Systems
  else if (roomName === 'Fire Annunciator Panel System') document.getElementById('form-fire-annunciator').style.display = 'block';
  else if (roomName === 'Fire Suppression System') document.getElementById('form-fire-suppression').style.display = 'block';
  else if (roomName === 'Water Leak Detection System') document.getElementById('form-water-leak').style.display = 'block';
  else if (roomName === 'Access Control System') document.getElementById('form-access-control').style.display = 'block';
  else if (roomName === 'CCTV') document.getElementById('form-cctv').style.display = 'block';
  else if (roomName === 'Check Rack Customer') document.getElementById('form-check-rack').style.display = 'block';
  else if (roomName === 'Generator System') document.getElementById('form-generator').style.display = 'block';
  else if (roomName === 'Fuel System') document.getElementById('form-fuel').style.display = 'block';
  else if (roomName === 'Breaking Glass') document.getElementById('form-breaking-glass').style.display = 'block';

  document.getElementById('room').value = roomName;
  document.getElementById('formTitle').innerText = "Maintenance: " + roomName;
  document.getElementById('name').value = getUsernameFromToken(); 
  
  switchView('formView');
}

function openSubSelection(mainSystemName, subCategories) {
  switchView('subSelectionView');
  document.getElementById('subSelectionTitle').innerText = "Select Category for: " + mainSystemName;
  
  const container = document.getElementById('subCategoryContainer');
  container.innerHTML = '';
  const systemIcon = getSystemIcon(mainSystemName);

  subCategories.forEach(sub => {
    const fullRoomName = mainSystemName + " - " + sub;
    const isCompleted = completedRooms.includes(fullRoomName);
    const completedClass = isCompleted ? 'icon-completed' : '';

    const col = document.createElement('div');
    col.className = 'col-12 col-md-4';
    col.innerHTML = `
      <div class="card room-card bg-white p-4" onclick="openForm('${fullRoomName}')">
        <i class="bi ${systemIcon} ${completedClass} room-icon fs-1"></i>
        <h5 class="fw-bold mb-0">${sub}</h5>
      </div>
    `;
    container.appendChild(col);
  });
}

function resetForm() {
  currentEditingId = null; 
  const form = document.getElementById('maintenanceForm');
  if(form) {
    form.reset();
    form.classList.remove('was-validated');
  }
  document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
  
  const now = new Date(); 
  document.getElementById('date').valueAsDate = now;
  document.getElementById('time').value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

async function submitData() {
  const form = document.getElementById('maintenanceForm');
  
  if (!document.getElementById('date').value || !document.getElementById('time').value) { 
    form.classList.add('was-validated'); 
    Swal.fire({ icon: 'warning', title: 'Incomplete data', text: 'Please fill in Date and Time.' });
    return; 
  }

  showLoader('Saving to ' + document.getElementById('room').value + '...');

  let extraData = {};
  const visibleForms = document.querySelectorAll('.dynamic-form-group');
  visibleForms.forEach(formGroup => {
    if (window.getComputedStyle(formGroup).display === 'block') {
      const inputs = formGroup.querySelectorAll('input:not([type="radio"]), input[type="radio"]:checked');
      inputs.forEach(input => {
        const key = input.name || input.id;
        if (key && input.value) {
          extraData[key] = input.value;
        }
      });
    }
  });

const payload = {
    id: currentEditingId, 
    room: document.getElementById('room').value,
    name: document.getElementById('name').value, 
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    extra_data: extraData
  };
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    hideLoader();

    if (response.ok) {
      if (!completedRooms.includes(payload.room)) {
        completedRooms.push(payload.room);
      }
      Swal.fire({ icon: 'success', title: 'Success!', text: result.message, confirmButtonColor: '#0F172A', timer: 1500 })
        .then(() => { switchView('dashboard'); });
    } else { 
      if (response.status === 401) {
        Swal.fire({ icon: 'warning', title: 'Session Expired', text: 'Please log in again.' }).then(() => logout());
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: result.detail || result.message }); 
      }
    }
  } catch (error) {
    hideLoader();
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Cannot connect to Server.' });
  }
}

// ==========================================
// 🪄 AUTO-FILL NORMAL VALUES (UPGRADED)
// ==========================================
function selectAllNormal() {
  // 1. Find the active form much more reliably (Checks all forms directly)
  let activeForm = null;
  const allForms = document.querySelectorAll('.dynamic-form-group');
  allForms.forEach(form => {
    if (form.style.display === 'block' || form.style.display.includes('block')) {
      activeForm = form;
    }
  });
  
  if (!activeForm) {
    Swal.fire({ icon: 'info', title: 'No Form Open', text: 'Please select a system first.' });
    return;
  }

  // 2. Added 'run' and made everything lowercase so it NEVER fails from a typo
  const goodValues = ['normal', 'on', 'auto', 'open', 'full', 'high', 'source-a', 'run'];
  let selectedCount = 0;

  // 3. Smart Radio Button selection (Case-insensitive check)
  const radios = activeForm.querySelectorAll('input[type="radio"]');
  radios.forEach(radio => {
    // Trim spaces and convert to lowercase for a guaranteed match
    const val = radio.value.trim().toLowerCase(); 
    
    if (goodValues.includes(val)) {
      radio.checked = true;
      selectedCount++;
    }
  });

  // 4. Smart Dropdown selection
  const selects = activeForm.querySelectorAll('select');
  selects.forEach(select => {
    // Let the user pick their own Work Shift, auto-fill the rest!
    if (select.name !== 'cr_shift') {
      select.selectedIndex = 0; 
      selectedCount++;
    }
  });

  // 5. Success popup
  if (selectedCount > 0) {
    Swal.fire({
      icon: 'success',
      title: 'Auto-Filled',
      text: `Checked ${selectedCount} items!`,
      timer: 1200,
      showConfirmButton: false,
      position: 'top-end',
      toast: true
    });
  } else {
    // This tells us if something went wrong finding the buttons
    Swal.fire({ icon: 'warning', title: 'No Items Found', text: 'Could not find any standard values to auto-fill.' });
  }
}

// ==========================================
// 📋 TABLE & HISTORY
// ==========================================
function populateFilterDropdown() {
  const filterSelect = document.getElementById('historyFilter');
  const currentValue = filterSelect.value;
  const uniqueRooms = [...new Set(currentRecords.map(r => r.room))].filter(Boolean).sort();
  
  filterSelect.innerHTML = '<option value="all">All Systems</option>';
  uniqueRooms.forEach(room => {
    const option = document.createElement('option');
    option.value = room;
    option.textContent = room;
    filterSelect.appendChild(option);
  });
  
  if (uniqueRooms.includes(currentValue)) filterSelect.value = currentValue;
}

function applyHistoryFilter() {
  const selectedRoom = document.getElementById('historyFilter').value;
  if (selectedRoom === 'all') {
    renderTable(currentRecords);
  } else {
    const filteredData = currentRecords.filter(r => r.room === selectedRoom);
    renderTable(filteredData);
  }
}

async function loadTableData() {
  showLoader('Loading history...');
  try {
    const response = await fetch(API_URL, { headers: getAuthHeaders() });
    const records = await response.json();
    hideLoader();
    if (response.ok) {
      currentRecords = records;
      populateFilterDropdown(); 
      applyHistoryFilter();     
    } else { 
      if (response.status === 401) {
        Swal.fire({ icon: 'warning', title: 'Session Expired', text: 'Your security token expired. Please log in again.' }).then(() => logout());
      } else {
        Swal.fire({ icon: 'error', title: 'Database Error', text: records.detail || 'Failed to load records' }); 
      }
    }
  } catch (error) { 
    hideLoader(); 
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Cannot connect to Server.' }); 
  }
}

function viewRoomHistory() {
  const currentRoom = document.getElementById('room').value; 
  switchView('table'); 
  
  setTimeout(() => {
    const filterSelect = document.getElementById('historyFilter');
    if ([...filterSelect.options].some(opt => opt.value === currentRoom)) {
      filterSelect.value = currentRoom;
      applyHistoryFilter(); 
    } else {
      filterSelect.value = 'all';
      applyHistoryFilter();
      Swal.fire({ icon: 'info', title: 'No History', text: `No past records found for ${currentRoom}`, timer: 2000, showConfirmButton: false});
    }
  }, 400); 
}

function renderTable(records) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = records.length ? '' : '<tr><td colspan="5" class="text-center py-4">No records found.</td></tr>';
    
    records.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDateDisplay(r.date)}</td>
            <td>${r.time}</td>
            <td><span class="fw-semibold text-dark">${r.room || '-'}</span></td>
            <td class="fw-bold">${r.name}</td>
            <td>
                <button class="btn btn-sm btn-corporate-outline" onclick="editRecord('${r.id}')">
                    <i class="bi bi-pencil"></i> Edit
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editRecord(id) {
  const searchId = isNaN(Number(id)) ? id : Number(id);
  const record = currentRecords.find(r => r.id === searchId || String(r.id) === String(id));
  if (!record) return;

  // 1. Open the form first (this resets the form)
  openForm(record.room || 'Unknown Room'); 
  
  // 2. NOW restore the ID and the Saved Name!
  currentEditingId = record.id; 
  document.getElementById('name').value = record.name || ''; 

  // 3. Restore dates and times
  try { let d = new Date(record.date); document.getElementById('date').value = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : record.date; } catch(e) {}
  try { let t = new Date('1970-01-01T' + record.time); document.getElementById('time').value = !isNaN(t.getTime()) ? `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}` : record.time; } catch(e) {}

  if(record.extra_data) {
    for (const [key, value] of Object.entries(record.extra_data)) {
      const targetInput = document.getElementById(key) || document.querySelector(`input[name="${key}"][value="${value}"]`);
      if (targetInput) {
        if (targetInput.type === 'radio') {
          targetInput.checked = true;
        } else {
          targetInput.value = value;
        }
      }
    }
  }
  document.getElementById('formTitle').innerText = "Edit Record: " + (record.room || '');
}
// ==========================================
// 📊 MONTHLY ANALYTICS & CHARTS
// ==========================================
let barChartInstance = null;
let doughnutChartInstance = null;

async function loadAnalyticsData() {
  showLoader('Loading Analytics...');
  try {
    const response = await fetch(API_URL, { headers: getAuthHeaders() });
    const records = await response.json();
    hideLoader();
    
    if (response.ok) {
        currentRecords = records;
        populateMonthDropdown();
        renderAnalytics();
    } else {
        if (response.status === 401) {
            Swal.fire({ icon: 'warning', title: 'Session Expired', text: 'Your security token expired. Please log in again.' }).then(() => logout());
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: records.detail || 'Failed to load analytics' });
        }
    }
  } catch (error) {
    hideLoader();
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Cannot connect to Server.' });
  }
}

function populateMonthDropdown() {
  const filter = document.getElementById('monthFilter');
  const currentVal = filter.value;
  
  const months = [...new Set(currentRecords.map(r => r.date.substring(0, 7)))].sort().reverse();
  
  filter.innerHTML = '<option value="all">All Time</option>';
  months.forEach(m => {
    const dateObj = new Date(m + '-01');
    const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    filter.innerHTML += `<option value="${m}">${monthName}</option>`;
  });
  
  if (months.includes(currentVal)) filter.value = currentVal;
}

function renderAnalytics() {
  const selectedMonth = document.getElementById('monthFilter').value;
  
  const data = selectedMonth === 'all' 
    ? currentRecords 
    : currentRecords.filter(r => r.date.startsWith(selectedMonth));

  let issuesCount = 0;
  let systemCounts = {};

  data.forEach(r => {
    const room = r.room || 'Unknown';
    systemCounts[room] = (systemCounts[room] || 0) + 1;

    if (r.extra_data) {
      const values = Object.values(r.extra_data).map(v => String(v).toLowerCase());
      if (values.includes('trip') || values.includes('failed') || values.includes('abnormal')) {
        issuesCount++;
      }
    }
  });

  const totalChecks = data.length;
  const normalChecks = totalChecks - issuesCount;

  // Update Summary Cards
  document.getElementById('statTotalChecks').innerText = totalChecks;
  document.getElementById('statNormal').innerText = normalChecks;
  document.getElementById('statIssues').innerText = issuesCount;

  // Update Center Percentage
  const healthPercent = totalChecks === 0 ? 100 : Math.round((normalChecks / totalChecks) * 100);
  document.getElementById('healthPercentage').innerText = healthPercent + '%';

  // --- Beautiful Bar Chart ---
  const ctxBar = document.getElementById('barChart').getContext('2d');
  if (barChartInstance) barChartInstance.destroy(); 
  
  // Clean up long labels (e.g. "Electrical System - 1.1 MDB" -> "1.1 MDB")
  const niceLabels = Object.keys(systemCounts).map(label => {
    if(label.includes(' - ')) return label.split(' - ')[1];
    return label;
  });

  // Create smooth blue gradient
  let gradient = ctxBar.createLinearGradient(0, 0, 0, 320);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 1)'); 
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)');

  barChartInstance = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: niceLabels,
      datasets: [{
        label: 'Total Inspections',
        data: Object.values(systemCounts),
        backgroundColor: gradient,
        borderRadius: 6,
        barThickness: 'flex',
        maxBarThickness: 45
      }]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false, // Critical for custom heights
      plugins: { 
        legend: { display: false },
        tooltip: { backgroundColor: '#1E293B', padding: 12, cornerRadius: 8 }
      },
      scales: { 
        y: { 
          beginAtZero: true, 
          grid: { color: '#F1F5F9', drawBorder: false },
          border: { display: false }
        },
        x: {
          grid: { display: false, drawBorder: false },
          border: { display: false },
          ticks: { font: { family: 'Inter', size: 11 } }
        }
      } 
    }
  });

  // --- Sleek Doughnut Chart ---
  const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
  if (doughnutChartInstance) doughnutChartInstance.destroy(); 
  
  doughnutChartInstance = new Chart(ctxDoughnut, {
    type: 'doughnut',
    data: {
      labels: ['Healthy', 'Anomalies'],
      datasets: [{
        data: [normalChecks, issuesCount],
        backgroundColor: ['#10B981', '#EF4444'],
        hoverBackgroundColor: ['#059669', '#DC2626'],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false, // Critical for custom heights
      cutout: '82%', // Makes it a beautiful thin ring
      plugins: {
        legend: { 
          position: 'bottom',
          labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', size: 12 } }
        },
        tooltip: { backgroundColor: '#1E293B', padding: 12, cornerRadius: 8 }
      }
    }
  });
}

// ==========================================
// 🖨️ PDF PRINTING (DYNAMIC COLUMNS)
// ==========================================

// ==========================================
// 🖨️ PDF PRINTING (DYNAMIC COLUMNS & SLIDABLE VIEW)
// ==========================================

function generateAndShowReport() {
  const filterValue = document.getElementById('historyFilter').value;
  const reportContainer = document.getElementById('reportContainer');
  
  let reportData = currentRecords;
  if (filterValue !== 'all') {
    reportData = currentRecords.filter(r => r.room === filterValue);
  }

  if (reportData.length === 0) {
    Swal.fire({ icon: 'info', title: 'No Data', text: 'No data available to print.' });
    return;
  }

  const now = new Date();
  const filterText = filterValue === 'all' ? 'All Systems Summary' : filterValue;

  // 🌟 MAGIC CSS: Makes it slidable on screen, but full-length on paper! 🌟
  let html = `
    <style>
      .report-scroll-box { 
        max-height: 65vh; 
        overflow: auto; 
        white-space: nowrap; 
      }
      .report-sticky-header { 
        position: sticky; 
        top: 0; 
        z-index: 2; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
      }
      @media print {
        .report-scroll-box { 
          max-height: none !important; 
          overflow: visible !important; 
          white-space: normal !important; 
        }
        .report-sticky-header { 
          position: static !important; 
          box-shadow: none !important; 
        }
      }
    </style>
    <div class="pt-3 px-0"> 
      <div class="report-header text-center mt-0 pt-0" style="padding-bottom: 10px; margin-bottom: 20px;">
        <h2 class="fw-bold mb-1 mt-0 pt-0" style="letter-spacing: 0.05em;">MONTHLY MAINTENANCE REPORT</h2>
        <p class="text-muted mb-0 text-uppercase">${filterText}</p>
      </div>

      <div class="row mb-4 fs-6">
        <div class="col-6">
        </div>
        <div class="col-6 text-end">
          <strong>Date:</strong> ${now.toLocaleDateString('en-GB')}
        </div>
      </div>
  `;

  const groupedRecords = {};
  reportData.forEach(r => {
    const room = r.room || 'Unknown System';
    if (!groupedRecords[room]) groupedRecords[room] = [];
    groupedRecords[room].push(r);
  });

  for (const [roomName, records] of Object.entries(groupedRecords)) {
    html += `<h5 class="fw-bold mt-5 mb-2 text-dark" style="border-bottom: 2px solid #0F172A; padding-bottom: 5px;">${roomName}</h5>`;
    
    let dynamicColumns = new Set();
    records.forEach(r => {
      if (r.extra_data) Object.keys(r.extra_data).forEach(key => dynamicColumns.add(key));
    });
    const columnsArray = Array.from(dynamicColumns);

    // 👇 Wrapped the table in our new slidable container
    html += `
      <div class="table-responsive report-scroll-box shadow-sm rounded border mb-5">
        <table class="table table-bordered report-table align-middle text-center mb-0" style="font-size: 8.5pt;">
          <thead class="table-light report-sticky-header">
            <tr>
              <th style="width: 80px;">Date</th>
              <th style="width: 60px;">Time</th>
    `;
    
    columnsArray.forEach(col => {
      let cleanCol = col.replace(/_/g, ' ').toUpperCase();
      html += `<th>${cleanCol}</th>`;
    });

    html += `   <th>Inspector</th></tr></thead><tbody>`;

    records.forEach(r => {
      html += `<tr><td>${formatDateDisplay(r.date)}</td><td>${r.time}</td>`;
      
      columnsArray.forEach(col => {
        let val = (r.extra_data && r.extra_data[col] !== undefined && r.extra_data[col] !== "") ? r.extra_data[col] : '-';
        let valStyle = '';
        
        if (!isNaN(val) && val !== '-') val = Number(val).toLocaleString(); 

        html += `<td style="${valStyle}">${val}</td>`;
      });

      html += `<td class="fw-bold text-muted">${r.name || '-'}</td></tr>`;
    });

    html += `</tbody></table></div>`;
  } 

  html += `</div>`;

  reportContainer.innerHTML = html;
  switchView('reportView');
}
// NOTE: You can safely DELETE the old `parseJsonToReportDetails()` function 
// because we don't need it anymore!

// ==========================================
// ⚙️ HELPERS & INITIALIZATION
// ==========================================
function showLoader(text) { document.getElementById('loadingText').innerText = text || 'Processing...'; document.getElementById('overlay').style.display = 'block'; }
function hideLoader() { document.getElementById('overlay').style.display = 'none'; }
function formatDateDisplay(dateStr) { 
  if(!dateStr) return ''; 
  let d = new Date(dateStr); 
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB'); 
}

function updateDashboardStatus() {
  const cards = document.querySelectorAll('#dashboardView .room-card');
  cards.forEach(card => {
    const roomName = card.querySelector('h5').innerText.trim();
    const iconElement = card.querySelector('.room-icon');
    let isComplete = false;

    if (roomName === 'Electrical System') {
      const subs = ["1.1 MDB", "1.2 PDU", "1. RMU & TROP"];
      isComplete = subs.every(sub => completedRooms.includes(roomName + " - " + sub));
    }
    else if (roomName === 'UPS System') {
      const subs = ["2.1 UPS 2000-G & Battery", "2.2 UPS 5000-E & Battery"];
      isComplete = subs.every(sub => completedRooms.includes(roomName + " - " + sub));
    } 
    else if (roomName === 'Temperature System') { 
      const subs = ["Room 1", "Room 2", "Room 3", "Room 4"];
      isComplete = subs.every(sub => completedRooms.includes(roomName + " - " + sub));
    } 
    else {
      isComplete = completedRooms.includes(roomName);
    }

    if (isComplete) iconElement.classList.add('icon-completed');
    else iconElement.classList.remove('icon-completed');
  });
}

// Initialize App
if (checkAuth()) {
  switchView('dashboard');
}