const API_URL = 'http://127.0.0.1:8000/api/records';

let currentRecords = [];
let currentEditingId = null;
let completedRooms = [];

// Menu toggle
document.getElementById("menu-toggle").addEventListener("click", function(e) {
  e.preventDefault(); 
  document.getElementById("wrapper").classList.toggle("toggled");
});

// Open Form
function openForm(roomName) {
  try { resetForm(); } catch (error) { console.warn("Reset error:", error); }

  // ==== เช็ก Sub-category ====
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

  // ==== จัดการ Dynamic Forms ====
  document.querySelectorAll('.dynamic-form-group').forEach(el => el.style.display = 'none');

  if (roomName.includes('Electrical System')) {
    if (roomName.includes('1.1 MDB')) document.getElementById('form-mdb').style.display = 'block';
    else if (roomName.includes('1.2 PDU')) document.getElementById('form-pdu').style.display = 'block';
    else if (roomName.includes('1. RMU & TROP')) document.getElementById('form-rmu').style.display = 'block';
  }

  if(roomName.includes('UPS System')) {
    if (roomName.includes('2.1 UPS 2000-G & Battery')) {
      document.getElementById('form-ups-2000-g').style.display = 'block';
    } else if (roomName.includes('2.2 UPS 5000-E & Battery')) {
      document.getElementById('form-ups-5000-e').style.display = 'block';
    }
  }

  // ==== นำทางไปยังฟอร์ม ====
  document.getElementById('room').value = roomName;
  document.getElementById('formTitle').innerText = "Maintenance: " + roomName;
  
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('tableView').style.display = 'none';
  document.getElementById('subSelectionView').style.display = 'none';
  document.getElementById('formView').style.display = 'block';
  
  document.getElementById('nav-dashboard').classList.add('active');
  document.getElementById('nav-table').classList.remove('active');
}

// Submit Data
async function submitData() {
  const form = document.getElementById('maintenanceForm');
  
  if (!document.getElementById('name').value || !document.getElementById('date').value || !document.getElementById('time').value) { 
    form.classList.add('was-validated'); 
    Swal.fire({ icon: 'warning', title: 'Incomplete data', text: 'Please fill in Name, Date, and Time.' });
    return; 
  }

  showLoader('Saving to ' + document.getElementById('room').value + '...');

  // ดึงค่า JSON จาก Dynamic Form (รองรับทั้ง Textbox และปุ่ม Radio ใหม่ทั้งหมด)
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
    temperature: null,
    humidity: 0,
    power: 0,
    extra_data: extraData
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
      if (!completedRooms.includes(payload.room)) {
        completedRooms.push(payload.room);
      }
      Swal.fire({ icon: 'success', title: 'Success!', text: result.message, confirmButtonColor: '#0F172A', timer: 1500 })
        .then(() => { switchView('dashboard'); });
    } else { 
      Swal.fire({ icon: 'error', title: 'Error', text: result.message }); 
    }
  } catch (error) {
    hideLoader();
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Cannot connect to Server.' });
  }
}

// Sub-selection View
function openSubSelection(mainSystemName, subCategories) {
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('tableView').style.display = 'none';
  document.getElementById('formView').style.display = 'none';
  document.getElementById('subSelectionView').style.display = 'block';

  document.getElementById('subSelectionTitle').innerText = "Select Category for: " + mainSystemName;
  
  const container = document.getElementById('subCategoryContainer');
  container.innerHTML = '';

  subCategories.forEach(sub => {
    const fullRoomName = mainSystemName + " - " + sub;
    const isCompleted = completedRooms.includes(fullRoomName);
    const iconClass = isCompleted ? 'bi-check-circle-fill icon-completed' : 'bi-check2-circle';

    const col = document.createElement('div');
    col.className = 'col-12 col-md-4';
    col.innerHTML = `
      <div class="card room-card bg-white p-4" onclick="openForm('${fullRoomName}')">
        <i class="bi ${iconClass} room-icon fs-1"></i>
        <h5 class="fw-bold mb-0">${sub}</h5>
      </div>
    `;
    container.appendChild(col);
  });
}

// Check Dashboard Complete Status
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

    if (isComplete) {
      iconElement.classList.add('icon-completed');
    } else {
      iconElement.classList.remove('icon-completed');
    }
  });
}

// Switch View
function switchView(view) {
  if (view === 'dashboard') {
    document.getElementById('dashboardView').style.display = 'block'; 
    document.getElementById('formView').style.display = 'none'; 
    document.getElementById('tableView').style.display = 'none';
    document.getElementById('subSelectionView').style.display = 'none';
    document.getElementById('nav-dashboard').classList.add('active'); 
    document.getElementById('nav-table').classList.remove('active');
    updateDashboardStatus();
  } else if (view === 'table') {
    document.getElementById('dashboardView').style.display = 'none'; 
    document.getElementById('formView').style.display = 'none'; 
    document.getElementById('tableView').style.display = 'block';
    document.getElementById('subSelectionView').style.display = 'none';
    document.getElementById('nav-dashboard').classList.remove('active'); 
    document.getElementById('nav-table').classList.add('active');
    loadTableData();
  }
  if (window.innerWidth < 768) { document.getElementById("wrapper").classList.remove("toggled"); }
}

// Load Table
// ==========================================
// 🌟 ระบบประวัติและตัวกรองอัจฉริยะ
// ==========================================

// 1. ฟังก์ชันสร้างตัวเลือกห้องใน Dropdown อัตโนมัติ
function populateFilterDropdown() {
  const filterSelect = document.getElementById('historyFilter');
  const currentValue = filterSelect.value;
  
  // กวาดชื่อห้อง/Sub-category ทั้งหมดที่มีในประวัติ (ไม่เอาซ้ำ)
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

// 2. ฟังก์ชันกรองตารางเมื่อเลือก Dropdown
function applyHistoryFilter() {
  const selectedRoom = document.getElementById('historyFilter').value;
  if (selectedRoom === 'all') {
    renderTable(currentRecords);
  } else {
    // โชว์เฉพาะห้องที่เลือก
    const filteredData = currentRecords.filter(r => r.room === selectedRoom);
    renderTable(filteredData);
  }
}

// 3. อัปเดตฟังก์ชันโหลดตาราง (ทับของเดิม)
async function loadTableData() {
  showLoader('Loading history...');
  try {
    const response = await fetch(API_URL);
    const records = await response.json();
    hideLoader();
    if (response.ok) {
      currentRecords = records;
      populateFilterDropdown(); // สร้างตัวกรองใหม่
      applyHistoryFilter();     // กรองข้อมูลล่าสุดโชว์บนตาราง
    } else { Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load' }); }
  } catch (error) { hideLoader(); Swal.fire({ icon: 'error', title: 'Network Error', text: 'Cannot connect to Server.' }); }
}

// 4. ฟังก์ชันปุ่มลัดดูประวัติจากในหน้า Form
function viewRoomHistory() {
  const currentRoom = document.getElementById('room').value; // จำชื่อห้องปัจจุบันไว้
  switchView('table'); // สลับไปหน้าตาราง
  
  // รอให้ดึงข้อมูลจาก Database เสร็จ แล้วค่อยตั้งค่า Filter
  setTimeout(() => {
    const filterSelect = document.getElementById('historyFilter');
    if ([...filterSelect.options].some(opt => opt.value === currentRoom)) {
      filterSelect.value = currentRoom;
      applyHistoryFilter(); // สั่งกรองตารางให้ทันที
    } else {
      filterSelect.value = 'all';
      applyHistoryFilter();
      Swal.fire({ icon: 'info', title: 'No History', text: `No past records found for ${currentRoom}`, timer: 2000, showConfirmButton: false});
    }
  }, 400); 
}

// Render Table
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

// Edit Record
function editRecord(id) {
  const searchId = isNaN(Number(id)) ? id : Number(id);
  const record = currentRecords.find(r => r.id === searchId || String(r.id) === String(id));
  if (!record) return;

  currentEditingId = record.id; 
  openForm(record.room || 'Unknown Room'); 
  
  document.getElementById('name').value = record.name;
  
  try { let d = new Date(record.date); document.getElementById('date').value = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : record.date; } catch(e) {}
  try { let t = new Date('1970-01-01T' + record.time); document.getElementById('time').value = !isNaN(t.getTime()) ? `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}` : record.time; } catch(e) {}

  // นำข้อมูลกลับมาติ๊กปุ่มเดิมอัตโนมัติ
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

// Reset Form
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

// Helpers
function showLoader(text) { document.getElementById('loadingText').innerText = text || 'Processing...'; document.getElementById('overlay').style.display = 'block'; }
function hideLoader() { document.getElementById('overlay').style.display = 'none'; }
function formatDateDisplay(dateStr) { 
  if(!dateStr) return ''; 
  let d = new Date(dateStr); 
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB'); 
}

//report generation
function generatePrintReport() {
  const filterValue = document.getElementById('historyFilter').value;
  const printArea = document.getElementById('printArea');
  
  let reportData = currentRecords;
  if (filterValue !== 'all') {
    reportData = currentRecords.filter(r => r.room === filterValue);
  }

  if (reportData.length === 0) {
    Swal.fire({ icon: 'info', title: 'No Data', text: 'No data available' });
    return;
  }

  const now = new Date();
  const filterText = filterValue === 'all' ? 'All Systems in Inventory' : filterValue;

  // เริ่มสร้างโครงร่างหน้าเอกสาร A4
  let html = `
    <div class="p-3">
      <div class="report-header text-center">
        <h2 class="fw-bold mb-1" style="letter-spacing: 0.05em;">DAILY MAINTENANCE SUMMARY REPORT</h2>
        <p class="text-muted mb-0">MONTHLY REPORT</p>
      </div>

      <div class="row mb-4 fs-6">
        <div class="col-6">
          <strong>System Data for Report:</strong> ${filterText}<br>
          <strong>Total Records:</strong> ${reportData.length} items
        </div>
        <div class="col-6 text-end">
          <strong>Print Date:</strong> ${now.toLocaleDateString('th-TH')} <br>
          
        </div>
      </div>

      <table class="table table-bordered report-table align-middle">
        <thead>
          <tr class="text-center">
            <th style="width: 12%;">Date</th>
            <th style="width: 10%;">Time</th>
            <th style="width: 25%;">System</th>
            <th style="width: 18%;">Inspector</th>
            <th style="width: 35%;">Detailed Inspection Status</th>
          </tr>
        </thead>
        <tbody>
  `;


  reportData.forEach(r => {
    
    const detailsHtml = parseJsonToReportDetails(r.extra_data);
    
    html += `
      <tr>
        <td class="text-center">${formatDateDisplay(r.date)}</td>
        <td class="text-center">${r.time}</td>
        <td><span class="fw-bold">${r.room || '-'}</span></td>
        <td class="text-center fw-bold">${r.name}</td>
        <td>${detailsHtml}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>

      <div class="row" style="margin-top: 50px;">
        <div class="col-6 offset-6 text-center" style="margin-top: 60px;">
          <p class="mb-5">..........................................................</p>
          <p class="fw-bold">( .......................................................... )</p>
          <p class="text-muted">Name</p>
        </div>
      </div>
    </div>
  `;


  printArea.innerHTML = html;
  window.print();
}


// 2. ฟังก์ชันพิเศษสำหรับแปลงค่า JSON ให้เป็นตาราง Grid 2 คอลัมน์ที่อ่านง่าย
function parseJsonToReportDetails(extraData) {
  if (!extraData || Object.keys(extraData).length === 0) {
    return `<div class="text-muted fst-italic text-center">- ไม่มีบันทึกข้อมูลย่อย -</div>`;
  }

  // สร้างกล่อง Grid ครอบข้อมูลทั้งหมด
  let htmlResult = '<div class="detail-container">';
  
  for (const [key, value] of Object.entries(extraData)) {
    // ล้างชื่อ ID ให้สวยงาม (เช่น mdb_a_l1 -> MDB A L1)
    let cleanKey = key.replace(/_/g, ' ').toUpperCase();
    
    // ตั้งค่าสีตัวหนังสือ
    let valStyle = '';
    let displayValue = value;
    
    // เช็กสถานะเพื่อใส่สี
    if (String(value).toLowerCase() === 'trip') {
      valStyle = 'color: #dc2626; font-weight: 800;'; // แดงเข้ม
    } else if (String(value).toLowerCase() === 'on') {
      valStyle = 'color: #16a34a;'; // เขียว
    } else if (String(value).toLowerCase() === 'off') {
      valStyle = 'color: #64748b;'; // เทา
    } else if (!isNaN(value) && value !== '') {
      // ถ้าเป็นตัวเลข (เช่น ค่า Voltage, Current) ให้ใส่ลูกน้ำและทศนิยมเพื่อความสวยงาม
      displayValue = Number(value).toLocaleString();
      valStyle = 'color: #0f172a;'; 
    }

    // สร้างข้อมูลทีละบรรทัด (มีหัวข้อซ้าย - สถานะขวา)
    htmlResult += `
      <div class="detail-item">
        <span class="detail-label">${cleanKey}</span>
        <span class="detail-value" style="${valStyle}">${displayValue}</span>
      </div>
    `;
  }
  
  htmlResult += '</div>'; // ปิดกล่อง Grid
  return htmlResult;
}