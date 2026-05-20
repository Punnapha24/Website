const API_URL = 'http://127.0.0.1:8000/api/records';

let currentRecords = [];
let currentEditingId = null;

// Menu toggle
document.getElementById("menu-toggle").addEventListener("click", function(e) {
  e.preventDefault(); 
  document.getElementById("wrapper").classList.toggle("toggled");
});

// Open Form
function openForm(roomName) {
  try {
    resetForm();
  } catch (error) {
    console.warn("Reset error:", error);
  }

  document.getElementById('room').value = roomName;
  document.getElementById('formTitle').innerText = "Maintenance: " + roomName;
  
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('tableView').style.display = 'none';
  document.getElementById('formView').style.display = 'block';
  
  document.getElementById('nav-dashboard').classList.add('active');
  document.getElementById('nav-table').classList.remove('active');
}

// Submit Data
async function submitData() {
  const form = document.getElementById('maintenanceForm');
  
  if (!form.checkValidity()) { 
    form.classList.add('was-validated'); 
    Swal.fire({ 
      icon: 'warning', 
      title: 'Incomplete data', 
      text: 'Please fill in all fields' 
    });
    return; 
  }

  showLoader('Saving to ' + document.getElementById('room').value + '...');
  
  const payload = {
    id: currentEditingId, 
    room: document.getElementById('room').value,
    name: document.getElementById('name').value,
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    temperature: parseFloat(document.getElementById('temperature').value) || 0,
    humidity: parseFloat(document.getElementById('humidity').value) || 0,
    power: parseFloat(document.getElementById('power').value) || 0
  };
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    hideLoader();

    if (response.ok) {
      Swal.fire({ icon: 'success', title: 'Success!', text: result.message, confirmButtonColor: '#000000', timer: 1500 })
        .then(() => { switchView('dashboard'); });
    } else { 
      Swal.fire({ icon: 'error', title: 'Error', text: result.message }); 
    }
  } catch (error) {
    hideLoader();
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Cannot connect to Server.' });
  }
}

// Load Table
async function loadTableData() {
  showLoader('Loading history...');
  
  try {
    const response = await fetch(API_URL);
    const records = await response.json();
    hideLoader();
    
    if (response.ok) {
      currentRecords = records;
      renderTable(records);
    } else {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load' });
    }
  } catch (error) {
    hideLoader();
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Cannot connect to Server.' });
  }
}

// Render Table
function renderTable(records) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';
  
  if (!records || records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No records found.</td></tr>'; 
    return;
  }
  
  records.forEach(r => {
    const safeId = r.id ? r.id.toString().replace(/'/g, "\\'") : '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDateDisplay(r.date)}</td>
      <td>${r.time}</td>
      <td><span class="badge bg-dark">${r.room || '-'}</span></td>
      <td class="fw-bold">${r.name}</td>
      <td>${r.temperature}</td>
      <td>${r.humidity}</td>
      <td>${r.power}</td>
      <td><button class="btn btn-sm btn-corporate" onclick="editRecord('${safeId}')"><i class="bi bi-pencil"></i> Edit</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Edit Record
function editRecord(id) {
  const searchId = isNaN(Number(id)) ? id : Number(id);
  const record = currentRecords.find(r => r.id === searchId || String(r.id) === String(id));
  
  if (!record) return;

  currentEditingId = record.id; 
  document.getElementById('room').value = record.room || 'Unknown Room';
  document.getElementById('name').value = record.name;
  
  try { 
    let d = new Date(record.date); 
    document.getElementById('date').value = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : record.date; 
  } catch(e) { document.getElementById('date').value = record.date; }
  
  try { 
    let t = new Date('1970-01-01T' + record.time); 
    document.getElementById('time').value = !isNaN(t.getTime()) ? `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}` : record.time; 
  } catch(e) { document.getElementById('time').value = record.time; }

  document.getElementById('temperature').value = record.temperature;
  document.getElementById('humidity').value = record.humidity;
  document.getElementById('power').value = record.power;
  document.getElementById('formTitle').innerText = "Edit Record: " + (record.room || '');
  
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('tableView').style.display = 'none';
  document.getElementById('formView').style.display = 'block';
}

// Switch View
function switchView(view) {
  if (view === 'dashboard') {
    document.getElementById('dashboardView').style.display = 'block'; 
    document.getElementById('formView').style.display = 'none'; 
    document.getElementById('tableView').style.display = 'none';
    document.getElementById('nav-dashboard').classList.add('active'); 
    document.getElementById('nav-table').classList.remove('active');
  } else if (view === 'table') {
    document.getElementById('dashboardView').style.display = 'none'; 
    document.getElementById('formView').style.display = 'none'; 
    document.getElementById('tableView').style.display = 'block';
    document.getElementById('nav-dashboard').classList.remove('active'); 
    document.getElementById('nav-table').classList.add('active');
    loadTableData();
  }
  if (window.innerWidth < 768) { document.getElementById("wrapper").classList.remove("toggled"); }
}

// Reset Form
function resetForm() {
  currentEditingId = null; 
  const form = document.getElementById('maintenanceForm');
  if(form) {
    form.reset();
    form.classList.remove('was-validated');
  }
  
  const now = new Date(); 
  document.getElementById('date').valueAsDate = now;
  document.getElementById('time').value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Loaders
function showLoader(text) { 
  document.getElementById('loadingText').innerText = text || 'Processing...'; 
  document.getElementById('overlay').style.display = 'block'; 
}
function hideLoader() { document.getElementById('overlay').style.display = 'none'; }
function formatDateDisplay(dateStr) { 
  if(!dateStr) return ''; 
  let d = new Date(dateStr); 
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB'); 
}