const API_URL = 'http://127.0.0.1:8000/api/records';

let currentRecords = [];
let currentEditingId = null;
let completedRooms = [];

// System Icon
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


// Authentication Check
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

// Auth UI Toggle
function toggleAuthForm(view) {
  if (view === 'register') {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';
  } else {
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
  }
}

// Updated Register Logic
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

// Navigation & View Management
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
  else if (view === 'reportView') { document.getElementById('reportView').style.display = 'block'; }

  if (window.innerWidth < 768) { document.getElementById("wrapper").classList.remove("toggled"); }
}

// Form Handling
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
  document.getElementById('formTitle').innerText = roomName;
  document.getElementById('name').value = getUsernameFromToken(); 
  
  switchView('formView');
}

function openSubSelection(mainSystemName, subCategories) {
  switchView('subSelectionView');
  document.getElementById('subSelectionTitle').innerText = mainSystemName;
  
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

  const backBtn = document.getElementById('btnFormBack');
  if (backBtn) backBtn.innerHTML = '<i class="bi bi-arrow-left me-1"></i> Back to Dashboard';
}

async function submitData() {
  const form = document.getElementById('maintenanceForm');
  
  if (!document.getElementById('date').value || !document.getElementById('time').value) { 
    form.classList.add('was-validated'); 
    Swal.fire({ icon: 'warning', title: 'Incomplete data', text: 'Please fill in Date and Time.' });
    return; 
  }

  let extraData = {};
  let missingField = false; // checker for any missing required fields

  const visibleForms = document.querySelectorAll('.dynamic-form-group');
  visibleForms.forEach(formGroup => {
    if (window.getComputedStyle(formGroup).display === 'block') {
      
      // 1. querySelectorAll and check inputs
      const allInputs = formGroup.querySelectorAll('input:not([type="radio"]), select, textarea');
      allInputs.forEach(input => {
        const key = input.name || input.id;
        const val = input.value.trim();
        const lowerKey = (key || '').toLowerCase();

        // check any field that is empty
        if (val === '' && !lowerKey.includes('remark')) {
          missingField = true;
          input.classList.add('is-invalid'); // เปลี่ยนขอบเป็นสีแดงแจ้งเตือน
        } else {
          input.classList.remove('is-invalid');
          if (key) extraData[key] = val;
        }
      });

      // 2. Radio buttons (only checked ones)
      const checkedRadios = formGroup.querySelectorAll('input[type="radio"]:checked');
      checkedRadios.forEach(radio => {
        if (radio.name) extraData[radio.name] = radio.value;
      });
    }
  });

  // Missing field check after processing all inputs
  if (missingField) {
    Swal.fire({ icon: 'warning', title: 'Incomplete Data', text: 'Please fill in all required fields.' });
    return; 
  }

  showLoader('Saving to ' + document.getElementById('room').value + '...');

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
        .then(() => { if (currentEditingId) {
            switchView('table');
            currentEditingId = null;
          } else {
            switchView('dashboard'); 
          } });
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

// Auto-fill 
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

  // 2. Good values to auto-select (Case-insensitive)
  const goodValues = ['normal', 'on', 'auto', 'open', 'full', 'high', 'source-a'];
  let selectedCount = 0;

  // 3. Smart Radio Button selection (Case-insensitive check)
  const radios = activeForm.querySelectorAll('input[type="radio"]');
  radios.forEach(radio => {
    const val = radio.value.trim().toLowerCase(); 
    const name = radio.name; 

    // Pump run exception
    if (name === 'fuel_run1' || name === 'fuel_run2') {
      if (val === 'off') {
        radio.checked = true;
        selectedCount++;
      }
      return; 
    }

    // Normal case for other radios
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

// Table & History
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

  // 🌟 4. restore extra data
  if(record.extra_data) {
    for (const [key, value] of Object.entries(record.extra_data)) {
      // พยายามหา input/select ด้วย name หรือ id
      const targetInputs = document.querySelectorAll(`[name="${key}"], #${key}`);
      
      targetInputs.forEach(input => {
        if (input.type === 'radio' || input.type === 'checkbox') {
          // if radio or checkbox, we check the one that matches the value (case-insensitive)
          if (input.value === String(value)) {
            input.checked = true;
          }
        } else {
          // if normal input/select/textarea, we set the value directly
          input.value = value;
        }
      });
    }
  }
  document.getElementById('formTitle').innerText = "Edit Record: " + (record.room || '');

  // Back button changes to "Back to History" when editing
  const backBtn = document.getElementById('btnFormBack');
  if (backBtn) backBtn.innerHTML = '<i class="bi bi-arrow-left me-1"></i> Back to History';
}

// Analytics
let barChartInstance = null;
let doughnutChartInstance = null;
let trendChartInstance = null;
let offendersChartInstance = null;

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

  let systemCounts = {};
  let systemIssues = {}; // Top offenders
  let issuesByDate = {}; // Trend

  // all dates
  const allDates = [...new Set(data.map(r => r.date))].sort();
  allDates.forEach(d => issuesByDate[d] = 0);

  const goodValues = ['normal', 'on', 'auto', 'close', 'full', 'high', 'source-a'];
  const badValues = ['failed', 'abnormal', 'off', 'manual', 'open', 'low', 'medium', 'source-b'];

  let normalItemsCount = 0;
  let issuesItemsCount = 0;

  data.forEach(r => {
    const room = r.room || 'Unknown';
    systemCounts[room] = (systemCounts[room] || 0) + 1;
    const date = r.date;

    if (r.extra_data) {
      Object.entries(r.extra_data).forEach(([key, val]) => {
        if (typeof val === 'string' && val.trim() !== '') {
          const cleanVal = val.trim().toLowerCase();
          let isIssue = false; 
          
          if (key === 'fuel_run1' || key === 'fuel_run2') {
            if (cleanVal === 'off') {
              normalItemsCount++; 
            } else if (cleanVal === 'run') {
              issuesItemsCount++; 
              isIssue = true;
            }
          } else {
            if (goodValues.includes(cleanVal)) {
              normalItemsCount++; 
            } else if (badValues.includes(cleanVal)) {
              issuesItemsCount++; 
              isIssue = true;
            }
          }

          // if it's an issue, count it for the room and the date
          if (isIssue) {
            systemIssues[room] = (systemIssues[room] || 0) + 1;
            issuesByDate[date] = (issuesByDate[date] || 0) + 1;
          }
        }
      });
    }
  });

  const totalItemsChecked = normalItemsCount + issuesItemsCount;

  // Update Summary Cards
  document.getElementById('statTotalChecks').innerText = totalItemsChecked; 
  document.getElementById('statNormal').innerText = normalItemsCount;
  document.getElementById('statIssues').innerText = issuesItemsCount;

  const healthPercent = totalItemsChecked === 0 ? 100 : Math.round((normalItemsCount / totalItemsChecked) * 100);
  document.getElementById('healthPercentage').innerText = healthPercent + '%';

// Total Inspections by System (Bar Chart)
  const ctxBar = document.getElementById('barChart').getContext('2d');
  if (barChartInstance) barChartInstance.destroy(); 
  
  const niceLabels = Object.keys(systemCounts).map(label => {
    if(label.includes(' - ')) return label.split(' - ')[1];
    return label;
  });

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
      responsive: true, maintainAspectRatio: false, 
      plugins: { legend: { display: false } },
      scales: { 
        y: { beginAtZero: true, grid: { color: '#F1F5F9', drawBorder: false }, border: { display: false } },
        x: { grid: { display: false, drawBorder: false }, border: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } }
      } 
    }
  });

// Checks Health Status (Doughnut Chart)
  const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
  if (doughnutChartInstance) doughnutChartInstance.destroy(); 
  
  doughnutChartInstance = new Chart(ctxDoughnut, {
    type: 'doughnut',
    data: {
      labels: ['Healthy', 'Anomalies'],
      datasets: [{
        data: [normalItemsCount, issuesItemsCount],
        backgroundColor: ['#10B981', '#EF4444'],
        hoverBackgroundColor: ['#059669', '#DC2626'],
        borderWidth: 0, hoverOffset: 6
      }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false, cutout: '82%', 
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
      }
    }
  });


  // Issues Trend Over Time (Line Chart)
  const ctxTrend = document.getElementById('trendChart').getContext('2d');
  if (trendChartInstance) trendChartInstance.destroy();

  const trendLabels = Object.keys(issuesByDate).map(d => {
      const dateObj = new Date(d);
      return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  });
  const trendData = Object.values(issuesByDate);

  trendChartInstance = new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: trendLabels,
      datasets: [{
        label: 'Issues Found',
        data: trendData,
        borderColor: '#ff7979',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#ff7979'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, suggestedMax: 5 },
        x: { grid: { display: false } }
      }
    }
  });

// Top Offenders (Horizontal Bar Chart)

  const ctxOffenders = document.getElementById('offendersChart').getContext('2d');
  if (offendersChartInstance) offendersChartInstance.destroy();

  // top 5 rooms with most issues
  const sortedOffenders = Object.entries(systemIssues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  
  const offenderLabels = sortedOffenders.map(item => {
      let label = item[0];
      if(label.includes(' - ')) return label.split(' - ')[1];
      return label;
  });
  const offenderData = sortedOffenders.map(item => item[1]);

  // Gradient for offender bars
  let gradientOrange = ctxOffenders.createLinearGradient(0, 0, 400, 0); 
  gradientOrange.addColorStop(0, 'rgba(245, 158, 11, 0.4)'); 
  gradientOrange.addColorStop(1, 'rgb(255, 109, 109)');  

  offendersChartInstance = new Chart(ctxOffenders, {
    type: 'bar',
    data: {
      labels: offenderLabels,
      datasets: [{
        label: 'Anomalies',
        data: offenderData,
        backgroundColor: gradientOrange, 
        borderRadius: 4,
        barThickness: 'flex',
        maxBarThickness: 25
      }]
    },
    options: {
      indexAxis: 'y', // horizontal bars
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, suggestedMax: 5, grid: { color: '#F1F5F9', drawBorder: false }, border: { display: false } },
        y: { grid: { display: false }, border: { display: false } }
      }
    }
  });
}

//Helpers an initialization

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

//Breaking Glass exceptions and questions
const BG_ROOMS = ["Lobby", "Security", "MDB", "UPS & Battery", "Staging", "NOC", "MMR", "ODF", "Service-1", "Service-2", "Service-3", "Service-4", "Data Center-1", "Data Center-2", "Data Center-3", "Data Center-4", "Nitro-1", "Nitro-2", "Emergency-Red", "Building Door", "Storage", "Fuel", "TR", "Synchronize"];
const BG_ROOMS_IDS = ["lobby", "sec", "mdb", "ups", "stage", "noc", "mmr", "odf", "srv1", "srv2", "srv3", "srv4", "dc1", "dc2", "dc3", "dc4", "nit1", "nit2", "emg", "door", "stor", "fuel", "tr", "sync"];
const BG_QUESTIONS = [
  "1. กระจกบนตัวอุปกรณ์อยู่ในสภาพปกติไม่มีรอยแตกหรือร้าว",
  "2. มีตัวอักษรแสดงเห็นชัดเจน",
  "3. มีกุญแจสำหรับไขทดสอบและไขคืนค่าการทำงาน",
  "4. อุปกรณ์อยู่ในสภาพพร้อมใช้งาน",
  "5. ระบบสามารถทำการปลดล็อคประตูได้ปกติ"
];
const BG_Q_IDS = ["q1", "q2", "q3", "q4", "q5"];

//PDF, Printing, and Reporting
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

  let html = `
    <style>
      .report-scroll-box { max-height: 65vh; overflow: auto; white-space: nowrap; }
      .report-sticky-header { position: sticky; top: 0; z-index: 2; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      @media print {
        .report-scroll-box { max-height: none !important; overflow: visible !important; white-space: nowrap !important; }
        .report-sticky-header { position: static !important; box-shadow: none !important; }
      }
    </style>
    <div class="pt-3 px-0"> 
      <div class="report-header text-center mt-0 pt-0" style="padding-bottom: 10px; margin-bottom: 20px;">
        <h2 class="fw-bold mb-1 mt-0 pt-0" style="letter-spacing: 0.05em;">MONTHLY MAINTENANCE REPORT</h2>
        <p class="text-muted mb-0 text-uppercase">${filterText}</p>
      </div>
      <div class="row mb-4 fs-6">
        <div class="col-12 text-end"><strong>Date:</strong> ${now.toLocaleDateString('en-GB')}</div>
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
    
    // Custom Layout for Breaking Glass
    if (roomName === 'Breaking Glass') {
      html += `
        <div class="table-responsive report-scroll-box shadow-sm rounded border mb-5">
          <table class="table table-bordered report-table align-middle text-center mb-0" style="font-size: 8pt;">
            <thead class="table-light report-sticky-header">
              <tr>
                <th rowspan="2" style="width: 80px; vertical-align: middle;">Date</th>
                <th rowspan="2" style="width: 60px; vertical-align: middle;">Time</th>`;
      
      // questions as main headers with colspan for rooms
      BG_QUESTIONS.forEach(q => {
        html += `<th colspan="24" style="background: #e2e8f0; font-size: 8.5pt;">${q}</th>`;
      });
      
      html += `<th rowspan="2" style="vertical-align: middle;">Remark</th>
               <th rowspan="2" style="vertical-align: middle;">Inspector</th>
              </tr><tr>`;
      
      // sub-headers for rooms under each question
      BG_QUESTIONS.forEach(() => {
        BG_ROOMS.forEach(r => html += `<th style="background: #f8fafc; font-size: 7pt; width: 60px;">${r}</th>`);
      });
      
      html += `</tr></thead><tbody>`;

      // key point
      records.forEach(r => {
        html += `<tr><td>${formatDateDisplay(r.date)}</td><td>${r.time}</td>`;
        BG_Q_IDS.forEach(qId => {
          BG_ROOMS_IDS.forEach(rId => {
            let val = (r.extra_data && r.extra_data[`bg_${qId}_${rId}`]) ? r.extra_data[`bg_${qId}_${rId}`] : '-';
            html += `<td>${val}</td>`;
          });
        });
        html += `<td>${(r.extra_data && r.extra_data['bg_remark']) ? r.extra_data['bg_remark'] : '-'}</td>`;
        html += `<td class="fw-bold text-muted">${r.name || '-'}</td></tr>`;
      });

      html += `</tbody></table></div>`;
    } 
    // Normal layout for other rooms
    else {
      let dynamicColumns = new Set();
      records.forEach(r => {
        if (r.extra_data) Object.keys(r.extra_data).forEach(key => dynamicColumns.add(key));
      });
      const columnsArray = Array.from(dynamicColumns);

      html += `
        <div class="table-responsive report-scroll-box shadow-sm rounded border mb-5">
          <table class="table table-bordered report-table align-middle text-center mb-0" style="font-size: 8.5pt;">
            <thead class="table-light report-sticky-header">
              <tr><th style="width: 80px;">Date</th><th style="width: 60px;">Time</th>`;
      
      columnsArray.forEach(col => html += `<th>${col.replace(/_/g, ' ').toUpperCase()}</th>`);
      html += `<th>Inspector</th></tr></thead><tbody>`;

      records.forEach(r => {
        html += `<tr><td>${formatDateDisplay(r.date)}</td><td>${r.time}</td>`;
        columnsArray.forEach(col => {
          let val = (r.extra_data && r.extra_data[col] !== undefined && r.extra_data[col] !== "") ? r.extra_data[col] : '-';
          if (!isNaN(val) && val !== '-') val = Number(val).toLocaleString(); 
          html += `<td>${val}</td>`;
        });
        html += `<td class="fw-bold text-muted">${r.name || '-'}</td></tr>`;
      });
      html += `</tbody></table></div>`;
    }
  } 

  html += `</div>`;
  reportContainer.innerHTML = html;
  switchView('reportView');
}

// Export to Excel with custom header for Breaking Glass and dynamic
function exportReportToExcel() {
  const filterValue = document.getElementById('historyFilter').value;
  
  let reportData = currentRecords;
  if (filterValue !== 'all') {
    reportData = currentRecords.filter(r => r.room === filterValue);
  }

  if (reportData.length === 0) {
    Swal.fire({ icon: 'info', title: 'No Data', text: 'No data available to export.' });
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  // Custom Excel Layout for Breaking Glass with Merged Headers
  if (filterValue === 'Breaking Glass') {
    const rows = [];
    
    // date, time, system + 5 questions with 24 rooms each + remark + inspector = 3 + (5*24) + 2 = 125 columns
    const r1 = ['Date', 'Time', 'System / Room'];
    BG_QUESTIONS.forEach(q => {
      r1.push(q);
      for(let i=0; i<23; i++) r1.push(''); // empty cells for merged header
    });
    r1.push('Remark', 'Inspector Name');
    rows.push(r1);

    // second header row with room names under each question
    const r2 = ['', '', '']; 
    BG_QUESTIONS.forEach(() => {
      BG_ROOMS.forEach(r => r2.push(r));
    });
    r2.push('', '');
    rows.push(r2);

    // data rows
    reportData.forEach(r => {
      const dataRow = [formatDateDisplay(r.date), r.time, r.room];
      BG_Q_IDS.forEach(qId => {
        BG_ROOMS_IDS.forEach(rId => {
          dataRow.push((r.extra_data && r.extra_data[`bg_${qId}_${rId}`]) ? r.extra_data[`bg_${qId}_${rId}`] : '-');
        });
      });
      dataRow.push((r.extra_data && r.extra_data['bg_remark']) ? r.extra_data['bg_remark'] : '-');
      dataRow.push(r.name || '-');
      rows.push(dataRow);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // merge cells for the first header row
    const merges = [
      {s: {r:0, c:0}, e: {r:1, c:0}}, // รวม Date (บน-ล่าง)
      {s: {r:0, c:1}, e: {r:1, c:1}}, // รวม Time (บน-ล่าง)
      {s: {r:0, c:2}, e: {r:1, c:2}}, // รวม System (บน-ล่าง)
    ];
    
    // combine each question header with its 24 room sub-headers
    let startCol = 3;
    BG_QUESTIONS.forEach(() => {
      merges.push({s: {r:0, c:startCol}, e: {r:0, c:startCol + 23}});
      startCol += 24;
    });

    merges.push({s: {r:0, c:startCol}, e: {r:1, c:startCol}}); // remark 
    merges.push({s: {r:0, c:startCol + 1}, e: {r:1, c:startCol + 1}}); // inspector
    
    ws['!merges'] = merges;
    
    XLSX.utils.book_append_sheet(wb, ws, "Breaking Glass");
    XLSX.writeFile(wb, `Maintenance_Report_Breaking_Glass_${today}.xlsx`);
    return;
  }

  // Normal excel dynamic layout for other rooms
  let dynamicColumns = new Set();
  reportData.forEach(r => {
    if (r.extra_data) Object.keys(r.extra_data).forEach(key => dynamicColumns.add(key));
  });
  const columnsArray = Array.from(dynamicColumns);

  const headers = ['Date', 'Time', 'System'];
  columnsArray.forEach(col => headers.push(col.replace(/_/g, ' ').toUpperCase()));
  headers.push('Inspector Name'); 

  const rows = [headers]; 
  reportData.forEach(r => {
    const rowData = [formatDateDisplay(r.date), r.time, r.room || 'Unknown System'];
    columnsArray.forEach(col => {
      let val = (r.extra_data && r.extra_data[col] !== undefined && r.extra_data[col] !== "") ? r.extra_data[col] : '-';
      if (!isNaN(val) && val !== '-') val = Number(val); 
      rowData.push(val);
    });
    rowData.push(r.name || '-'); 
    rows.push(rowData);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const colWidths = headers.map(h => ({ wch: Math.max(12, h.length + 2) }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Maintenance Data");
  const filterName = filterValue === 'all' ? 'All_Systems' : filterValue.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Maintenance_Report_${filterName}_${today}.xlsx`);
}

function handleFormBack() {
  if (currentEditingId) {
    // if editing an existing record, go back to the table view to see the history list
    switchView('table');
    currentEditingId = null; // ล้างค่าการ Edit
  } else {
    // if creating a new record, go back to the dashboard
    switchView('dashboard');
  }
}