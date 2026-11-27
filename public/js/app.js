// BIGCE Accreditation Management System - Apple iOS Clean Engine (Yearwise Excel Architecture)

// Non-intrusive iOS Toast Notification (Zero blocking, elegant feedback)
window.showToast = function(message, type = 'success') {
  if (!message) return;
  let container = document.getElementById('ios-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ios-toast-container';
    container.className = 'ios-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `ios-toast-pill ios-toast-${type}`;

  let icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-circle-exclamation';
  else if (type === 'warning') icon = 'fa-triangle-exclamation';
  else if (type === 'info') icon = 'fa-circle-info';

  toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 2600);
};

// Safe override for window.alert so no browser dialogs interrupt users
window.alert = function(msg) {
  if (!msg) return;
  const str = String(msg);
  // If it's a technical error or debug message, suppress from toast and log to debug console
  if (str.toLowerCase().includes('error') || str.toLowerCase().includes('fail') || str.toLowerCase().includes('syntax') || str.toLowerCase().includes('grpc')) {
    console.debug('[System Handled Notice]:', str);
    return;
  }
  window.showToast(str, 'info');
};

// Custom In-App Confirmation Modal (Never blocked by Brave/Chrome dialog suppression)
window.showConfirmDialog = function({ title, message, confirmText = 'Yes, Delete', confirmColor = '#DC2626', onConfirm }) {
  const overlay = document.getElementById('workflow-modal-overlay');
  const content = document.getElementById('workflow-modal-content');
  if (!overlay || !content) {
    if (confirm(message)) onConfirm();
    return;
  }

  content.innerHTML = `
    <div style="padding: 26px 22px; text-align: center; position: relative;">
      <button class="ios-modal-close" style="position: absolute; top: 12px; right: 12px;" onclick="window.closeModal()" title="Cancel dialog">&times;</button>
      <div style="width: 58px; height: 58px; border-radius: 50%; background: #FEE2E2; color: #DC2626; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 16px auto;">
        <i class="fas fa-trash-alt"></i>
      </div>
      <h3 style="font-size: 19px; font-weight: 800; color: #0F172A; margin: 0 0 10px 0;">${title}</h3>
      <p style="font-size: 13.5px; font-weight: 600; color: #475569; margin: 0 0 24px 0; line-height: 1.5;">${message}</p>
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <button type="button" class="ios-btn" style="background: #F1F5F9; color: #334155; font-size: 13.5px; font-weight: 800; padding: 10px 22px; border-radius: 10px;" onclick="window.closeModal()">
          Cancel
        </button>
        <button type="button" id="confirm-dialog-action-btn" class="ios-btn" style="background: ${confirmColor}; color: #FFF; font-size: 13.5px; font-weight: 800; padding: 10px 24px; border-radius: 10px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);">
          ${confirmText}
        </button>
      </div>
    </div>
  `;
  overlay.style.display = 'flex';
  const actionBtn = document.getElementById('confirm-dialog-action-btn');
  if (actionBtn) {
    actionBtn.onclick = async () => {
      window.closeModal();
      if (typeof onConfirm === 'function') {
        await onConfirm();
      }
    };
  }
};

// ==========================================================================
// LIVE UPLOAD PROGRESS OVERLAY & MONITOR
// ==========================================================================
window.showUploadProgress = function({ fileName, fileSize }) {
  window._uploadIsDone = false;
  window._uploadIsError = false;

  let overlay = document.getElementById('global-upload-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'global-upload-modal-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      z-index: 999999; display: flex; align-items: center; justify-content: center;
      transition: opacity 0.2s ease;
    `;
    overlay.onclick = function(e) {
      if (e.target === overlay && (window._uploadIsDone || window._uploadIsError)) {
        window.closeUploadProgress();
      }
    };
    document.body.appendChild(overlay);
  }

  const iconInfo = window.getFileIconInfo ? window.getFileIconInfo(fileName) : { icon: 'fa-file', color: '#2563EB' };

  overlay.innerHTML = `
    <div class="upload-modal-sheet">
      <!-- Close Button -->
      <button type="button" class="upload-modal-close-btn" onclick="window.closeUploadProgress()" title="Close">&times;</button>
      
      <!-- Top Animated Status Circle -->
      <div id="upload-progress-icon-box" style="width: 76px; height: 76px; border-radius: 50%; background: #EFF6FF; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; position: relative; transition: all 0.3s ease;">
        <i id="upload-progress-icon" class="fas fa-cloud-upload-alt" style="font-size: 32px; color: #2563EB;"></i>
        <div id="upload-progress-spinner" style="position: absolute; inset: -4px; border: 3.5px solid #DBEAFE; border-top-color: #2563EB; border-radius: 50%; animation: spin 0.9s linear infinite;"></div>
      </div>

      <!-- Title & File Metadata -->
      <h3 id="upload-progress-title" style="font-size: 18px; font-weight: 800; color: #0F172A; margin: 0 0 6px 0; letter-spacing: -0.2px;">Uploading File...</h3>
      <div id="upload-progress-filename" style="font-size: 13.5px; font-weight: 700; color: #1E40AF; max-width: 360px; margin: 0 auto 4px auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        <i class="fas ${iconInfo.icon}" style="color: ${iconInfo.color}; margin-right: 5px;"></i>
        <span>${fileName || 'document'}</span>
      </div>
      <div id="upload-progress-filesize" style="font-size: 12px; font-weight: 600; color: #64748B; margin-bottom: 20px;">
        ${fileSize || 'Calculating size...'}
      </div>

      <!-- Live Progress Bar Track -->
      <div style="background: #F1F5F9; border: 1.5px solid #E2E8F0; border-radius: 999px; height: 12px; overflow: hidden; margin-bottom: 12px; position: relative;">
        <div id="upload-progress-bar" class="upload-progress-animated-bar" style="height: 100%; width: 15%; border-radius: 999px;"></div>
      </div>

      <!-- Live Status Description -->
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700;">
        <span id="upload-progress-status" style="color: #475569; display: inline-flex; align-items: center; gap: 6px;">
          <i class="fas fa-spinner fa-spin" style="color: #2563EB;"></i>
          <span>Uploading to cloud repository...</span>
        </span>
        <span id="upload-progress-percent" style="color: #1E40AF; font-weight: 800;">15%</span>
      </div>

      <div id="upload-progress-action-area" style="margin-top: 18px; display: none;"></div>
    </div>
  `;

  overlay.style.display = 'flex';
};

window.updateUploadProgress = function({ percent, statusText, isDone, isError, errorText }) {
  const bar = document.getElementById('upload-progress-bar');
  const percentEl = document.getElementById('upload-progress-percent');
  const statusEl = document.getElementById('upload-progress-status');
  const titleEl = document.getElementById('upload-progress-title');
  const iconBox = document.getElementById('upload-progress-icon-box');
  const iconEl = document.getElementById('upload-progress-icon');
  const spinnerEl = document.getElementById('upload-progress-spinner');
  const actionArea = document.getElementById('upload-progress-action-area');

  if (percent !== undefined) {
    const p = Math.min(100, Math.max(0, percent));
    if (bar) bar.style.width = `${p}%`;
    if (percentEl) percentEl.textContent = `${p}%`;
  }

  if (statusText && statusEl) {
    statusEl.innerHTML = `<i class="fas fa-spinner fa-spin" style="color: #2563EB;"></i> <span>${statusText}</span>`;
  }

  if (isDone) {
    window._uploadIsDone = true;
    if (bar) {
      bar.style.width = '100%';
      bar.style.background = 'linear-gradient(90deg, #10B981, #059669)';
    }
    if (percentEl) {
      percentEl.textContent = '100%';
      percentEl.style.color = '#15803D';
    }
    if (titleEl) {
      titleEl.innerHTML = '<span style="color: #15803D;">✓ Upload Complete!</span>';
    }
    if (iconBox) {
      iconBox.style.background = '#DCFCE7';
    }
    if (spinnerEl) {
      spinnerEl.style.display = 'none';
    }
    if (iconEl) {
      iconEl.className = 'fas fa-check-circle';
      iconEl.style.color = '#16A34A';
      iconEl.style.fontSize = '38px';
    }
    if (statusEl) {
      statusEl.innerHTML = '<span style="color: #15803D; font-weight: 800;"><i class="fas fa-check"></i> Verified & saved in repository!</span>';
    }
  }

  if (isError) {
    window._uploadIsError = true;
    if (bar) bar.style.background = '#EF4444';
    if (titleEl) titleEl.innerHTML = '<span style="color: #DC2626;">Upload Failed</span>';
    if (iconBox) iconBox.style.background = '#FEE2E2';
    if (spinnerEl) spinnerEl.style.display = 'none';
    if (iconEl) {
      iconEl.className = 'fas fa-circle-exclamation';
      iconEl.style.color = '#DC2626';
    }
    if (statusEl) {
      statusEl.innerHTML = `<span style="color: #B91C1C;">${errorText || 'Error processing upload. Please retry.'}</span>`;
    }
    if (actionArea) {
      actionArea.style.display = 'block';
      actionArea.innerHTML = `
        <button type="button" class="ios-btn" style="background: #0F172A; color: #FFF; font-size: 13px; font-weight: 800; padding: 9px 22px; border-radius: 9px;" onclick="window.closeUploadProgress()">
          Close
        </button>
      `;
    }
  }
};

window.closeUploadProgress = function() {
  const overlay = document.getElementById('global-upload-modal-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
};

window.uploadFileWithLiveProgress = function(file) {
  return new Promise((resolve, reject) => {
    const humanSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    window.showUploadProgress({ fileName: file.name, fileSize: humanSize });

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        // Map upload bytes to 10% - 85% range
        const pct = Math.round(10 + (e.loaded / e.total) * 75);
        window.updateUploadProgress({ percent: pct, statusText: `Transferring file (${Math.round((e.loaded / (1024 * 1024)) * 100) / 100} MB of ${humanSize})...` });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          window.updateUploadProgress({ percent: 92, statusText: 'Syncing to institutional cloud database...' });
          resolve(data);
        } catch (err) {
          window.updateUploadProgress({ isError: true, errorText: 'Invalid response from server.' });
          reject(err);
        }
      } else {
        let msg = `Server returned status ${xhr.status}`;
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData && errData.error) msg = errData.error;
        } catch (e) {}
        window.updateUploadProgress({ isError: true, errorText: msg });
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => {
      window.updateUploadProgress({ isError: true, errorText: 'Network connection error during upload.' });
      reject(new Error('Network error'));
    };

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
};

// Prevent unhandled promise rejections or script errors from showing debug toast overlays
window.addEventListener('unhandledrejection', (event) => {
  console.debug('[Handled Promise Notice]:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.debug('[Handled Script Notice]:', event.message);
});

const state = {
  currentUser: null,
  allUsers: [],
  departments: [],
  submissions: [],
  stats: null,
  yearwiseRecords: [],
  masterTemplate: null,
  activeTab: null,
  selectedCoordinatorFolder: null,
  selectedDeptFolder: null,
  selectedAdminFormatFolder: null,
  selectedExecutiveYearFilter: 'all',
  selectedDeptId: null,
  selectedCriterionId: 'c1',
  selectedAcademicYear: '2024-2025',
  academicYears: ['2023-2024', '2024-2025', '2025-2026', '2026-2027']
};

// White-Labeled Institutional File URL Resolvers (Never expose Cloudinary or random hashes)
function getFileDownloadUrl(file) {
  if (!file) return '#';
  const name = file.name || 'BIGCE_Criteria_Master_Format.xlsx';
  const rawUrl = file.storageUrl || file.url || '';
  if (rawUrl.startsWith('/api/files/download')) return rawUrl;
  try {
    const token = btoa(unescape(encodeURIComponent(rawUrl))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `/api/files/download/${encodeURIComponent(name)}?f=${token}`;
  } catch (e) {
    return rawUrl;
  }
}

function getFileViewUrl(file) {
  if (!file) return '#';
  const name = file.name || 'BIGCE_Document';
  const rawUrl = file.storageUrl || file.url || '';
  if (rawUrl.startsWith('/api/files/view')) return rawUrl;
  try {
    const token = btoa(unescape(encodeURIComponent(rawUrl))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `/api/files/view/${encodeURIComponent(name)}?f=${token}`;
  } catch (e) {
    return rawUrl;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadInitialData();
  checkAuthAndRender();
});

// Load backend data
async function loadInitialData() {
  try {
    const [deptRes, userRes, subRes, statsRes, yearRes, tplRes, foldersRes] = await Promise.all([
      fetch('/api/departments').then(r => r.json()).catch(() => []),
      fetch('/api/users').then(r => r.json()).catch(() => []),
      fetch('/api/submissions').then(r => r.json()).catch(() => []),
      fetch('/api/stats').then(r => r.json()).catch(() => null),
      fetch('/api/yearwise-records').then(r => r.json()).catch(() => []),
      fetch('/api/master-template').then(r => r.json()).catch(() => null),
      fetch('/api/format-folders').then(r => r.json()).catch(() => [])
    ]);

    state.departments = deptRes;
    state.allUsers = userRes;
    state.submissions = subRes;
    state.stats = statsRes;
    state.yearwiseRecords = yearRes || [];
    state.masterTemplate = tplRes || {
      name: 'BIGCE_Criteria_Master_Format.xlsx',
      url: '/uploads/BIGCE_Criteria_Master_Format.xlsx'
    };
    state.formatFolders = foldersRes || [];

    // Populate quick department selector on login & register screen
    const quickDeptSelect = document.getElementById('quick-dept-select');
    if (quickDeptSelect) {
      quickDeptSelect.innerHTML = state.departments.map(d => 
        `<option value="${d.id}">${d.name} (${d.code})</option>`
      ).join('');
    }
    const regDeptSelect = document.getElementById('reg-dept-select');
    if (regDeptSelect) {
      regDeptSelect.innerHTML = state.departments.map(d => 
        `<option value="${d.id}">${d.name} (${d.code})</option>`
      ).join('');
    }

    // Pre-fill remembered username if available
    const savedUser = localStorage.getItem('bigce_saved_username');
    if (savedUser) {
      const uInput = document.getElementById('login-username-input');
      if (uInput) uInput.value = savedUser;
    }
  } catch (err) {
    console.debug('Data sync notice:', err.message);
  }
}

// Session check
function checkAuthAndRender() {
  const saved = localStorage.getItem('bigce_auth_user');
  if (saved) {
    try {
      state.currentUser = JSON.parse(saved);
      showAuthenticatedApp();
      return;
    } catch (e) {
      localStorage.removeItem('bigce_auth_user');
    }
  }
  showLoginScreen();
}

function showLoginScreen() {
  document.getElementById('login-view').style.display = 'flex';
  document.getElementById('app-view').style.display = 'none';
  const savedUser = localStorage.getItem('bigce_saved_username');
  const uInput = document.getElementById('login-username-input');
  if (savedUser && uInput) {
    uInput.value = savedUser;
  }
}

function showAuthenticatedApp() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('app-view').style.display = 'block';

  const user = state.currentUser;
  
  document.getElementById('auth-role-tag').textContent = formatRoleName(user.role);
  document.getElementById('auth-user-name').textContent = user.name;
  
  const myDept = state.departments.find(d => d.id === user.departmentId);
  document.getElementById('auth-dept-name').textContent = myDept ? `${myDept.name} (${myDept.code})` : 'Institutional Directorate';

  if (user.departmentId) {
    state.selectedDeptId = user.departmentId;
  } else {
    state.selectedDeptId = state.departments[0]?.id || 'ug-cse';
  }

  setupRoleNavigation(user.role);
  renderActiveView();
}

// Setup Role Navigation Menu
function setupRoleNavigation(role) {
  const container = document.getElementById('role-nav-container');
  let navItems = [];

  switch (role) {
    case 'dept_coordinator':
    case 'tpo':
      // The 3 old tabs are completely removed as requested!
      navItems = [
        { id: 'coord-annual-upload', label: 'Annual Criteria Submissions (2023 - 2027)', icon: 'fa-file-excel' }
      ];
      state.activeTab = 'coord-annual-upload';
      break;

    case 'hod':
      navItems = [
        { id: 'hod-annual-review', label: 'Annual Department Excel Scrutiny (2023 - 2027)', icon: 'fa-check-circle' },
        { id: 'hod-upload', label: 'Upload Reports & Formats (2023 - 2027)', icon: 'fa-cloud-upload-alt' },
        { id: 'hod-all-branches', label: 'Department Overview', icon: 'fa-university' }
      ];
      state.activeTab = state.activeTab || 'hod-annual-review';
      break;

    case 'admin_coordinator':
      navItems = [
        { id: 'admin-dept-folders', label: '14 Department Folders', icon: 'fa-folder-tree' },
        { id: 'admin-master-template', label: 'Master Format Management', icon: 'fa-cloud-upload-alt' },
        { id: 'admin-registered-users', label: 'Registered Users Directory', icon: 'fa-users' },
        { id: 'admin-overview', label: '14 Departments Matrix', icon: 'fa-th' },
        { id: 'admin-iqac', label: 'IQAC Audit & Verification', icon: 'fa-shield-alt' },
        { id: 'admin-ssr', label: 'Official SSR Dossier', icon: 'fa-file-invoice' }
      ];
      state.activeTab = state.activeTab || 'admin-dept-folders';
      break;

    case 'principal':
      navItems = [
        { id: 'principal-desk', label: 'Principal Executive Review & Sanctions', icon: 'fa-user-tie' },
        { id: 'principal-matrix', label: 'Accreditation Matrix', icon: 'fa-th' },
        { id: 'principal-ssr', label: 'Institutional SSR Report', icon: 'fa-file-invoice' }
      ];
      state.activeTab = state.activeTab || 'principal-desk';
      break;

    case 'president':
      navItems = [
        { id: 'president-desk', label: 'Governing Council Endorsement Desk', icon: 'fa-award' },
        { id: 'president-summary', label: 'Governance Overview', icon: 'fa-landmark' },
        { id: 'president-ssr', label: 'Final SSR Document (Official Seal)', icon: 'fa-file-signature' }
      ];
      state.activeTab = state.activeTab || 'president-desk';
      break;
  }

  container.innerHTML = navItems.map(item => `
    <a href="#" class="ios-nav-tab ${state.activeTab === item.id ? 'active' : ''}" onclick="switchNavTab('${item.id}', event)">
      <i class="fas ${item.icon}"></i> ${item.label}
    </a>
  `).join('');
}

window.switchNavTab = function(tabId, event) {
  if (event) event.preventDefault();
  state.activeTab = tabId;
  document.querySelectorAll('.ios-nav-tab').forEach(el => el.classList.remove('active'));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
  renderActiveView();
};

// Main View Router
async function renderActiveView() {
  const main = document.getElementById('main-content-area');
  if (!main) return;

  try {
    const [subRes, statsRes, yearRes, tplRes] = await Promise.all([
      fetch('/api/submissions').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/yearwise-records').then(r => r.json()),
      fetch('/api/master-template').then(r => r.json())
    ]);
    state.submissions = subRes;
    state.stats = statsRes;
    state.yearwiseRecords = yearRes || [];
    state.masterTemplate = tplRes || state.masterTemplate;
  } catch (e) {}

  const role = state.currentUser.role;

  if (role === 'dept_coordinator' || role === 'tpo') {
    renderCoordinatorYearwiseWorkspace(main);
  } else if (role === 'hod') {
    if (state.activeTab === 'hod-upload') renderCoordinatorYearwiseWorkspace(main);
    else if (state.activeTab === 'hod-annual-review') renderHodYearwiseReview(main);
    else renderHodAllRecords(main);
  } else if (role === 'admin_coordinator') {
    if (state.activeTab === 'admin-master-template') renderAdminMasterTemplateManager(main);
    else if (state.activeTab === 'admin-dept-folders') renderAdminDepartmentFolders(main);
    else if (state.activeTab === 'admin-registered-users') renderAdminRegisteredUsers(main);
    else if (state.activeTab === 'admin-overview') renderAdminMatrix(main);
    else if (state.activeTab === 'admin-iqac') renderAdminIQACDesk(main);
    else if (state.activeTab === 'admin-ssr') renderSSRDossier(main);
    else renderAdminMasterTemplateManager(main);
  } else if (role === 'principal') {
    if (state.activeTab === 'principal-desk') renderPrincipalDesk(main);
    else if (state.activeTab === 'principal-matrix') renderAdminMatrix(main);
    else if (state.activeTab === 'principal-ssr') renderSSRDossier(main);
    else renderPrincipalDesk(main);
  } else if (role === 'president') {
    if (state.activeTab === 'president-desk') renderPresidentDesk(main);
    else if (state.activeTab === 'president-summary') renderPresidentSummary(main);
    else if (state.activeTab === 'president-ssr') renderSSRDossier(main);
    else renderPresidentDesk(main);
  }
}

// Helper for Dynamic Multi-Format File Icons
window.getFileIconInfo = function(fileName) {
  const name = (fileName || '').toLowerCase();
  if (name.endsWith('.pdf')) {
    return { icon: 'fa-file-pdf', color: '#DC2626', label: 'PDF' };
  }
  if (name.match(/\.(xlsx?|xlsm|xlsb|csv|ods|tsv)$/)) {
    return { icon: 'fa-file-excel', color: '#16A34A', label: 'Spreadsheet' };
  }
  if (name.match(/\.(docx?|rtf|odt|doc)$/)) {
    return { icon: 'fa-file-word', color: '#2563EB', label: 'Word Document' };
  }
  if (name.match(/\.(pptx?|odp)$/)) {
    return { icon: 'fa-file-powerpoint', color: '#EA580C', label: 'Presentation' };
  }
  if (name.match(/\.(png|jpe?g|webp|gif|svg|bmp)$/)) {
    return { icon: 'fa-file-image', color: '#8B5CF6', label: 'Image' };
  }
  if (name.match(/\.(zip|rar|7z|tar|gz)$/)) {
    return { icon: 'fa-file-archive', color: '#D97706', label: 'Archive' };
  }
  if (name.match(/\.(txt|log|md|json)$/)) {
    return { icon: 'fa-file-alt', color: '#64748B', label: 'Text Document' };
  }
  return { icon: 'fa-file', color: '#64748B', label: 'File' };
};

// ==========================================================================
// FOLDER PROGRESS & STATUS ENGINE
// ==========================================================================
window.getFolderProgress = function(fld, fldRec) {
  const isRejected = fldRec && (fldRec.status === 'returned_for_revision' || fldRec.status === 'rejected');

  // When rejected or returned for revision, previously submitted response files are deleted
  const rawFiles = fldRec ? ((fldRec.uploadedFiles && fldRec.uploadedFiles.length) ? fldRec.uploadedFiles : (fldRec.excelFile ? [fldRec.excelFile] : [])) : [];
  const uploadedFiles = isRejected ? [] : rawFiles;
  const isMulti = !!(fld && (fld.isMultiReport || fld.isPermanent || (!fld.files || fld.files.length === 0)));

  if (isMulti) {
    const total = uploadedFiles.length > 0 ? uploadedFiles.length : 1;
    const completed = uploadedFiles.length;
    const pending = 0;
    const isComplete = uploadedFiles.length > 0;
    const isPartial = false;
    const percent = uploadedFiles.length > 0 ? 100 : 0;
    return { total, completed, pending, isComplete, isPartial, percent, uploadedFiles, isMulti: true };
  }

  const total = (fld && fld.files && fld.files.length) ? fld.files.length : 1;
  let completed = 0;
  if (!isRejected) {
    if (fld && fld.files && fld.files.length > 0) {
      completed = fld.files.filter((tf, idx) => {
        return uploadedFiles.some(uf => uf.templateFileId === tf.id || (!uf.templateFileId && idx === 0));
      }).length;
    } else {
      completed = uploadedFiles.length > 0 ? 1 : 0;
    }
  }
  
  const pending = Math.max(0, total - completed);
  const isComplete = total > 0 && completed >= total;
  const isPartial = completed > 0 && completed < total;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { total, completed, pending, isComplete, isPartial, percent, uploadedFiles, isMulti: false };
};

window.renderFolderStatusBadge = function(fld, fldRec) {
  const { total, completed, pending, isComplete, isPartial, isMulti, uploadedFiles } = window.getFolderProgress(fld, fldRec);

  if (!fldRec) {
    if (fld?.isPermanent || isMulti) {
      return `<span class="ios-status-tag" style="background: #EEF2FF; color: #4338CA; border: 1.5px solid #C7D2FE; font-weight: 800;"><i class="fas fa-layer-group"></i> Ready for Multiple Reports</span>`;
    }
    const hasTemplate = fld && fld.files && fld.files.length > 0;
    return hasTemplate
      ? `<span class="ios-status-tag" style="background: #EFF6FF; color: #1E40AF; border: 1.5px solid #BFDBFE;"><i class="fas fa-file-download"></i> Ready for Upload (0/${fld.files.length})</span>`
      : `<span class="ios-status-tag" style="background: #F1F5F9; color: #94A3B8;">Awaiting Release</span>`;
  }

  // Status priority check:
  if (fldRec.status === 'returned_for_revision' || fldRec.status === 'rejected') {
    return `<span class="ios-status-tag status-rejected" style="background: #FEF2F2; color: #DC2626; border: 1.5px solid #FCA5A5; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-undo"></i> Rejected / Needs Revision</span>`;
  }

  const countLabel = isMulti ? `${uploadedFiles.length} Report(s)` : `${completed}/${total}`;

  if (fldRec.status === 'iqac_verified' || fldRec.status === 'verified_by_iqac') {
    return `<span class="ios-status-tag status-iqac-verified" style="background: #ECFDF5; color: #047857; border: 1.5px solid #6EE7B7; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-shield-alt"></i> IQAC Verified (${countLabel})</span>`;
  }

  if (fldRec.status === 'approved_by_hod') {
    return `<span class="ios-status-tag status-hod-approved" style="background: #F0FDF4; color: #15803D; border: 1.5px solid #86EFAC; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-check-circle"></i> HOD Approved (${countLabel})</span>`;
  }

  if (fldRec.status === 'approved_by_principal') {
    return `<span class="ios-status-tag status-principal-approved" style="background: #FAF5FF; color: #7E22CE; border: 1.5px solid #D8B4FE; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-crown"></i> Principal Approved (${countLabel})</span>`;
  }

  if (fldRec.status === 'endorsed_by_president') {
    return `<span class="ios-status-tag status-president-endorsed"><i class="fas fa-star"></i> Presidential Endorsed (${countLabel})</span>`;
  }

  if (fldRec.status === 'submitted_to_hod') {
    if (isPartial) {
      return `<span class="ios-status-tag" style="background: #FFFBEB; color: #B45309; border: 1.5px solid #FBBF24; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-hourglass-half"></i> Submitted to HOD (${countLabel})</span>`;
    }
    return `<span class="ios-status-tag status-submitted" style="background: #EFF6FF; color: #1D4ED8; border: 1.5px solid #93C5FD; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-check-double"></i> Submitted to HOD (${countLabel})</span>`;
  }

  if (completed === 0) {
    return `<span class="ios-status-tag" style="background: #F1F5F9; color: #64748B; border: 1.5px solid #CBD5E1;"><i class="fas fa-clock"></i> 0 Uploaded</span>`;
  }

  if (isMulti) {
    return `<span class="ios-status-tag status-draft" style="background: #F0FDF4; color: #15803D; border: 1.5px solid #86EFAC; font-weight: 800;"><i class="fas fa-layer-group"></i> ${uploadedFiles.length} Report(s) Uploaded</span>`;
  }

  if (isPartial) {
    return `<span class="ios-status-tag" style="background: #FEF3C7; color: #92400E; border: 1.5px solid #F59E0B; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-edit"></i> Draft (${completed}/${total} Completed • ${pending} Pending)</span>`;
  }

  return `<span class="ios-status-tag status-draft" style="background: #F0FDF4; color: #15803D; border: 1.5px solid #86EFAC; font-weight: 800;"><i class="fas fa-file-check"></i> Draft (All ${total} Files Uploaded)</span>`;
};

window.getEffectiveUserDeptId = function() {
  if (state.currentUser?.role === 'tpo') return 'unit-tpo';
  const matched = (state.departments || []).find(d => d.id === state.currentUser?.departmentId);
  return matched ? matched.id : (state.departments?.[0]?.id || state.currentUser?.departmentId);
};

// ==========================================================================
// 1. DEPARTMENT COORDINATOR YEARWISE EXCEL WORKSPACE
// ==========================================================================
function renderCoordinatorYearwiseWorkspace(container) {
  const isTpoUser = state.currentUser?.role === 'tpo';
  const isHodUser = state.currentUser?.role === 'hod';
  const submitTargetLabel = (isHodUser || isTpoUser) ? 'NAAC Coordinator' : 'HOD / NAAC Coordinator';
  const dept = isTpoUser
    ? { id: 'unit-tpo', name: 'Training & Placement Cell (TPO)', code: 'TPO', section: 'Confidential Placement Cell', coordinator: state.currentUser.name, hod: 'Director IQAC (Admin)' }
    : (state.departments.find(d => d.id === state.currentUser.departmentId) || state.departments[0]);
  const folders = (state.formatFolders || []).filter(f =>
    isTpoUser
      ? (f.isTpoFolder || f.id === 'fld-tpo-permanent')
      : (!f.isTpoFolder && f.id !== 'fld-tpo-permanent')
  );

  container.innerHTML = `
    <!-- Top Action Header: Department Identity + Yearwise Selector -->
    <div class="ios-card" style="margin-bottom: 20px;">
      <div class="ios-card-body" style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        
        <div>
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #2563EB; letter-spacing: 0.5px;">Accreditation Data Workspace</div>
          <h3 style="font-size: 18px; font-weight: 800; color: #0F172A; margin: 2px 0;">${dept.name} (${dept.code})</h3>
          <span style="font-size: 12px; font-weight: 600; color: #475569;">${dept.section} • Coordinator: <strong>${state.currentUser.name}</strong></span>
        </div>

        <!-- Academic Year Switcher (2023-2024 through 2026-2027) -->
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span style="font-size: 13px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.3px;">Academic Year:</span>
          <div class="ios-segmented-control" style="margin: 0; padding: 4px; background: #E2E8F0; border: 1.5px solid #CBD5E1; border-radius: 12px;">
            ${state.academicYears.map(yr => {
              const yrRec = state.yearwiseRecords.find(r => r.departmentId === dept.id && r.academicYear === yr && r.excelFile);
              const isSubmitted = yrRec && yrRec.status !== 'draft';
              const isActive = yr === state.selectedAcademicYear;
              return `
                <button class="ios-segment-btn ${isActive ? 'active' : ''}" style="padding: 8px 14px; font-size: 12.5px; font-weight: 800;" onclick="selectAcademicYearTab('${yr}')">
                  ${yr}
                  ${isSubmitted ? `<span style="color:#22C55E; margin-left:4px; font-weight:900;">✓</span>` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    </div>

    <!-- Coordinator Format Folders View (A. Folders Grid vs B. Inside Open Folder) -->
    ${(() => {
      const openFld = state.selectedCoordinatorFolder ? folders.find(f => f.id === state.selectedCoordinatorFolder) : null;

      // VIEW B: INSIDE THE OPEN FOLDER (Download & Upload Workspace)
      if (openFld) {
        const fld = openFld;
        const fldRec = state.yearwiseRecords.find(r => 
          r.departmentId === dept.id && 
          r.academicYear === state.selectedAcademicYear && 
          r.folderId === fld.id
        );
        const prog = window.getFolderProgress(fld, fldRec);
        const hasTemplate = fld.files && fld.files.length > 0;
        const isRejected = fldRec && fldRec.status === 'returned_for_revision';
        const isVerified = fldRec && (fldRec.status === 'iqac_verified' || fldRec.status === 'verified_by_iqac');
        const isHodApproved = fldRec && fldRec.status === 'approved_by_hod';
        const isSubmitted = fldRec && fldRec.status === 'submitted_to_hod';

        return `
          <!-- Top Navigation / Breadcrumb -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <button type="button" class="ios-btn" style="background: #FFF; border: 1.5px solid #CBD5E1; color: #0F172A; font-size: 13px; font-weight: 800; padding: 8px 18px; border-radius: 10px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);" onclick="closeCoordinatorFolder()">
              <i class="fas fa-arrow-left"></i> Back to All Format Folders
            </button>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 13px; font-weight: 700; color: #64748B;">Academic Year:</span>
              <span class="ios-status-tag" style="background: #0F172A; color: #FFF; font-weight: 800;">AY ${state.selectedAcademicYear}</span>
            </div>
          </div>

          <!-- Inside Folder Workspace Card -->
          <div class="ios-card" style="margin-bottom: 0; border: 2px solid ${isRejected ? '#FCA5A5' : (isVerified || isHodApproved ? '#86EFAC' : (isSubmitted || prog.completed > 0 ? '#FCD34D' : '#CBD5E1'))}; border-left: 6px solid ${isRejected ? '#DC2626' : (isVerified ? '#059669' : (isHodApproved ? '#16A34A' : (isSubmitted || prog.completed > 0 ? '#F59E0B' : '#2563EB')))}; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
            <div class="ios-card-header" style="background: ${isRejected ? '#FEF2F2' : (isVerified || isHodApproved ? '#F0FDF4' : (isSubmitted || prog.completed > 0 ? '#FFFBEB' : '#F8FAFC'))}; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas ${isRejected ? 'fa-undo' : (isVerified ? 'fa-folder-check' : (isHodApproved ? 'fa-check-circle' : (prog.completed > 0 ? 'fa-folder-open' : 'fa-folder')))}" style="font-size: 32px; color: ${isRejected ? '#DC2626' : (isVerified ? '#047857' : (isHodApproved ? '#16A34A' : (isSubmitted || prog.completed > 0 ? '#D97706' : '#2563EB')))};"></i>
                <div>
                  <h4 style="font-size: 17px; font-weight: 800; color: #0F172A; margin: 0; display: flex; align-items: center; gap: 8px;">
                    <span>${fld.title}</span>
                  </h4>
                  <span style="font-size: 12.5px; font-weight: 600; color: #64748B;">${fld.description || 'Official NAAC Accreditation Format'} • Created by ${fld.createdBy || 'Admin IQAC'} • ${prog.total} Official Template(s)</span>
                </div>
              </div>
              <div>
                ${window.renderFolderStatusBadge(fld, fldRec)}
              </div>
            </div>

            <div class="ios-card-body" style="padding: 22px;">
              
              <!-- 0. Prominent Rejection Alert Box with Notes (If returned for revision) -->
              ${isRejected ? `
                <div style="background: #FEF2F2; border: 2px solid #F87171; border-radius: 12px; padding: 14px 18px; margin-bottom: 18px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.08);">
                  <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px; color: #DC2626; margin-top: 2px;"></i>
                    <div style="flex: 1;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
                        <span style="font-size: 13.5px; font-weight: 800; color: #991B1B; text-transform: uppercase; letter-spacing: 0.3px;">
                          🚨 Returned for Revision by ${fldRec.rejectedBy || fldRec.rejectedRole || 'Reviewer'}
                        </span>
                        <span style="font-size: 11.5px; font-weight: 700; color: #B91C1C;">
                          ${fldRec.rejectedAt || 'Recent'}
                        </span>
                      </div>
                      <div style="background: #FFF; border: 1.5px solid #FECACA; border-radius: 8px; padding: 12px 14px; font-size: 13.5px; font-weight: 700; color: #7F1D1D; line-height: 1.5; margin-bottom: 10px;">
                        <i class="fas fa-comment-dots" style="color: #DC2626; margin-right: 6px;"></i>
                        Rejection Remarks: "${fldRec.rejectionNotes}"
                      </div>
                      <!-- File Deleted Notification Banner Right Below Note -->
                      <div style="background: #FFF1F2; border: 2px dashed #E11D48; border-radius: 10px; padding: 12px 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 8px rgba(225, 29, 72, 0.08);">
                        <div style="width: 36px; height: 36px; border-radius: 8px; background: #FFE4E6; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                          <i class="fas fa-trash-alt" style="color: #E11D48; font-size: 17px;"></i>
                        </div>
                        <div>
                          <div style="font-size: 13.5px; font-weight: 900; color: #9F1239; letter-spacing: -0.2px; display: flex; align-items: center; gap: 6px;">
                            <span>Your file is deleted, please re-upload it.</span>
                            <span style="background: #E11D48; color: #FFF; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">File Cleared</span>
                          </div>
                          <div style="font-size: 11.5px; font-weight: 700; color: #BE123C; margin-top: 2px;">
                            Purani response file reject hone par delete kar di gayi hai. Kripya niche diye gaye official template slot me corrected file upload karein.
                          </div>
                        </div>
                      </div>
                      <div style="font-size: 12px; font-weight: 600; color: #991B1B;">
                        <i class="fas fa-info-circle"></i> Please review the reviewer's remarks above, re-upload the corrected response file(s), then click <strong>"Submit to ${submitTargetLabel}"</strong> to resubmit.
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- 0B. Prominent Submission Banner (When Submitted / Approved) -->
              ${isSubmitted ? `
                <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 2px solid #3B82F6; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.12);">
                  <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                      <div style="width: 44px; height: 44px; border-radius: 12px; background: #2563EB; color: #FFF; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);">
                        <i class="fas fa-check-double"></i>
                      </div>
                      <div>
                        <div style="font-size: 15px; font-weight: 900; color: #1E40AF; text-transform: uppercase; letter-spacing: 0.3px; display: flex; align-items: center; gap: 8px;">
                          <span>✓ SUBMITTED TO ${submitTargetLabel.toUpperCase()} FOR SCRUTINY</span>
                          <span style="background: #1E40AF; color: #FFF; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 12px;">SUBMITTED</span>
                        </div>
                        <div style="font-size: 12.5px; font-weight: 700; color: #1E3A8A; margin-top: 3px;">
                          Submission Recorded on <strong>${fldRec.coordinatorSubmittedAt || 'Recently'}</strong> • Under Review by ${(isHodUser || isTpoUser) ? '<strong>NAAC Coordinator (Director IQAC)</strong>' : `HOD <strong>(${dept.hod})</strong>`}
                        </div>
                      </div>
                    </div>
                    <div style="background: #FFFFFF; border: 1.5px solid #93C5FD; border-radius: 10px; padding: 7px 16px; font-size: 12px; font-weight: 800; color: #1E40AF; display: flex; align-items: center; gap: 6px;">
                      <i class="fas fa-clock" style="color: #2563EB;"></i> Status: Submitted to ${submitTargetLabel}
                    </div>
                  </div>
                </div>
              ` : (isHodApproved ? `
                <div style="background: #F0FDF4; border: 2px solid #22C55E; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.1);">
                  <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: #16A34A; color: #FFF; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">
                      <i class="fas fa-check-circle"></i>
                    </div>
                    <div>
                      <div style="font-size: 15px; font-weight: 900; color: #15803D;">✓ APPROVED BY HOD • FORWARDED TO IQAC</div>
                      <div style="font-size: 12.5px; font-weight: 600; color: #166534; margin-top: 2px;">
                        Approved on ${fldRec.hodApprovedAt} • HOD Remarks: "${fldRec.hodRemarks || 'Approved'}"
                      </div>
                    </div>
                  </div>
                </div>
              ` : (isVerified ? `
                <div style="background: #ECFDF5; border: 2px solid #059669; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.1);">
                  <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: #059669; color: #FFF; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">
                      <i class="fas fa-shield-alt"></i>
                    </div>
                    <div>
                      <div style="font-size: 15px; font-weight: 900; color: #065F46;">🛡️ VERIFIED & SANCTIONED BY IQAC CENTRAL DIRECTORATE</div>
                      <div style="font-size: 12.5px; font-weight: 600; color: #047857; margin-top: 2px;">
                        Institutional verification complete • Cleared for Final SSR Dossier
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''))}

              <!-- 1. Folder Progress Meter Bar -->
              <div style="background: #FFF; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                  <span style="font-size: 13px; font-weight: 800; color: #0F172A; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-tasks" style="color: #2563EB;"></i>
                    <span>Folder Completion Progress:</span>
                  </span>
                  <span style="font-size: 12.5px; font-weight: 800; color: ${prog.isComplete ? '#15803D' : (prog.completed > 0 ? '#B45309' : '#64748B')};">
                    ${prog.completed} of ${prog.total} Template(s) Completed (${prog.percent}%)
                    ${prog.isPartial ? ` • <span style="color: #DC2626;">${prog.pending} Pending</span>` : ''}
                  </span>
                </div>
                <div style="height: 9px; background: #E2E8F0; border-radius: 999px; overflow: hidden;">
                  <div style="width: ${prog.percent}%; height: 100%; background: ${prog.isComplete ? 'linear-gradient(90deg, #10B981, #059669)' : (prog.completed > 0 ? 'linear-gradient(90deg, #F59E0B, #D97706)' : '#CBD5E1')}; transition: width 0.3s ease;"></div>
                </div>
              </div>

              <!-- 2. Official Templates & Directly Paired Responses -->
              <div style="background: #FFF; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
                  <div style="font-size: 12.5px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.3px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-copy" style="color: #2563EB; font-size: 15px;"></i>
                    <span>${!hasTemplate ? `Uploaded Reports (${prog.uploadedFiles ? prog.uploadedFiles.length : 0}):` : `Official Templates & Response Submissions (${fld.files ? fld.files.length : 0}):`}</span>
                  </div>
                  ${(fld.isPermanent || fld.isMultiReport || !hasTemplate) ? `
                    <span class="ios-status-tag" style="background: #EEF2FF; color: #4338CA; border: 1.5px solid #C7D2FE; font-size: 11px; font-weight: 800;">
                      <i class="fas fa-layer-group"></i> Multiple Reports Allowed
                    </span>
                  ` : ''}
                </div>

                ${!hasTemplate ? `
                  <div style="background: #F8FAFC; border: 2px dashed #93C5FD; border-radius: 12px; padding: 18px 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                      <div>
                        <div style="font-size: 13.5px; font-weight: 800; color: #1E293B; display: flex; align-items: center; gap: 6px;">
                          <i class="fas fa-cloud-upload-alt" style="color: #2563EB; font-size: 17px;"></i>
                          <span>${fld.isPermanent ? 'Upload Any Departmental / Faculty Report to Admin' : 'Upload Department Reports & Documents'}</span>
                        </div>
                        <div style="font-size: 12px; color: #475569; font-weight: 600; margin-top: 4px;">
                          Faculty and Coordinators can upload <strong>multiple reports</strong> (.pdf, .xlsx, .docx, .pptx, images, zip, or any format). Each upload is added as a separate report.
                        </div>
                      </div>
                      <div>
                        <input type="file" id="direct-upload-input-${fld.id}-multi" accept="*/*" style="display: none;" onchange="handleFolderUpload('${fld.id}', event, 'direct-upload-input-${fld.id}-multi', '__multi__', 'Department Report')" />
                        <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFF; font-size: 12.5px; font-weight: 800; padding: 10px 20px; border-radius: 9px; box-shadow: 0 3px 10px rgba(37, 99, 235, 0.35); display: inline-flex; align-items: center; gap: 8px;" onclick="document.getElementById('direct-upload-input-${fld.id}-multi').click()">
                          <i class="fas fa-plus-circle"></i> Upload New Report / File
                        </button>
                      </div>
                    </div>

                    ${(prog.uploadedFiles && prog.uploadedFiles.length > 0) ? `
                      <div style="margin-top: 16px; padding-top: 16px; border-top: 1.5px solid #E2E8F0; display: grid; gap: 10px;">
                        ${prog.uploadedFiles.map((respFile, rIdx) => {
                          const fIcon = window.getFileIconInfo(respFile.name);
                          const delTarget = respFile.templateFileId || encodeURIComponent(respFile.name);
                          return `
                            <div style="display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; border: 1.5px solid #86EFAC; border-left: 4px solid #16A34A; border-radius: 10px; padding: 12px 16px; flex-wrap: wrap; gap: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                              <div style="display: flex; align-items: center; gap: 12px;">
                                <i class="fas ${fIcon.icon}" style="color: ${fIcon.color}; font-size: 22px;"></i>
                                <div>
                                  <div style="font-size: 13.5px; font-weight: 800; color: #0F172A;">
                                    <span style="color: #16A34A;">#${rIdx + 1}</span> ${respFile.name}
                                    <span style="font-size: 11px; font-weight: 600; color: #64748B;">(${respFile.size || 'Document'})</span>
                                  </div>
                                  <div style="font-size: 11.5px; color: #475569; font-weight: 600; margin-top: 2px;">
                                    Uploaded: ${respFile.uploadDate || 'Recent'} by <strong>${respFile.author || state.currentUser.name}</strong>
                                  </div>
                                </div>
                              </div>
                              <div style="display: flex; gap: 6px; align-items: center;">
                                <button type="button" class="ios-btn" style="background: #2563EB; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px;" onclick="openFileViewer('${encodeURIComponent(JSON.stringify(respFile))}', '${respFile.name}')">
                                  <i class="fas fa-eye"></i> View
                                </button>
                                <a href="${getFileDownloadUrl(respFile)}" download="${respFile.name}" target="_blank" class="ios-btn" style="background: #16A34A; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px; text-decoration: none;">
                                  <i class="fas fa-download"></i> Download
                                </a>
                                <button type="button" class="ios-btn" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; font-size: 11px; font-weight: 800; padding: 6px 10px; border-radius: 8px;" onclick="handleDeleteUploadedFile('${fldRec?.id}', '${encodeURIComponent(respFile.name)}', '${fld.id}', '${delTarget}')" title="Remove this report">
                                  <i class="fas fa-trash-alt"></i>
                                </button>
                              </div>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    ` : `
                      <div style="margin-top: 14px; font-size: 12.5px; color: #64748B; font-style: italic; font-weight: 600;">
                        No reports uploaded yet for AY ${state.selectedAcademicYear}. Click "Upload New Report / File" above to add reports.
                      </div>
                    `}
                  </div>
                ` : `
                  <div style="display: grid; gap: 14px;">
                    ${fld.files.map((file, fileIdx) => {
                      const respFile = prog.uploadedFiles.find(uf => 
                        uf.templateFileId === file.id || 
                        (!uf.templateFileId && fileIdx === 0)
                      );
                      const hasResp = !!respFile;

                      return `
                        <div style="border: 1.5px solid ${hasResp ? '#86EFAC' : '#CBD5E1'}; border-radius: 12px; overflow: hidden; background: #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                          
                          <!-- Top Strip: Official Template Information & Download Button -->
                          <div style="display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; padding: 12px 16px; border-bottom: 1.5px solid ${hasResp ? '#BBF7D0' : '#E2E8F0'}; flex-wrap: wrap; gap: 10px;">
                            ${(() => {
                              const tplIcon = window.getFileIconInfo(file.name);
                              return `
                                <span style="font-size: 13.5px; font-weight: 700; color: #0F172A; display: flex; align-items: center; gap: 10px;">
                                  <i class="fas ${tplIcon.icon}" style="color: ${tplIcon.color}; font-size: 20px;"></i>
                                  <span>${file.name}</span>
                                  <span style="font-size: 11.5px; color: #64748B; font-weight: 600;">(${file.size || 'Official Template'})</span>
                                </span>
                              `;
                            })()}
                            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                              <button type="button" class="ios-btn" style="background: #EFF6FF; border: 1.5px solid #BFDBFE; color: #1D4ED8; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 5px;" onclick="openFileViewer('${encodeURIComponent(JSON.stringify(file))}', 'Official Template: ${file.name}')">
                                <i class="fas fa-eye"></i> View Template
                              </button>
                              <a href="${getFileDownloadUrl(file)}" download="${file.name}" target="_blank" class="ios-btn" style="background: linear-gradient(135deg, #10B981 0%, #047857 100%); color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                                <i class="fas fa-download"></i> Download
                              </a>
                            </div>
                          </div>

                          <!-- Bottom Strip: Paired Response Status & Upload / Replace Action -->
                          ${hasResp ? `
                            <div style="display: flex; justify-content: space-between; align-items: center; background: #F0FDF4; padding: 12px 16px; flex-wrap: wrap; gap: 10px;">
                              <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fas ${isSubmitted || isHodApproved || isVerified ? 'fa-check-double' : 'fa-check-circle'}" style="color: #16A34A; font-size: 22px;"></i>
                                <div>
                                  <div style="font-size: 13.5px; font-weight: 800; color: #15803D; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                    <span>✓ ${respFile.name}</span>
                                    <span style="font-size: 11px; font-weight: 600; color: #64748B;">(${respFile.size})</span>
                                    ${isSubmitted ? `
                                      <span class="ios-status-tag" style="background: #EFF6FF; color: #1D4ED8; border: 1.5px solid #93C5FD; font-size: 11px; font-weight: 900; padding: 2px 8px; display: inline-flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-check-double"></i> SUBMITTED TO HOD
                                      </span>
                                    ` : (isHodApproved ? `
                                      <span class="ios-status-tag" style="background: #F0FDF4; color: #15803D; border: 1.5px solid #86EFAC; font-size: 11px; font-weight: 900; padding: 2px 8px; display: inline-flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-check-circle"></i> HOD APPROVED
                                      </span>
                                    ` : (isVerified ? `
                                      <span class="ios-status-tag" style="background: #ECFDF5; color: #047857; border: 1.5px solid #6EE7B7; font-size: 11px; font-weight: 900; padding: 2px 8px; display: inline-flex; align-items: center; gap: 4px;">
                                        <i class="fas fa-shield-alt"></i> IQAC VERIFIED
                                      </span>
                                    ` : `
                                      <span class="ios-status-tag" style="background: #FEF3C7; color: #92400E; border: 1.5px solid #FCD34D; font-size: 11px; font-weight: 900; padding: 2px 8px;">
                                        <i class="fas fa-edit"></i> DRAFT (Ready to Submit)
                                      </span>
                                    `))}
                                  </div>
                                  <div style="font-size: 11.5px; color: #475569; font-weight: 600; margin-top: 2px;">
                                    Uploaded: ${respFile.uploadDate || 'Recent'} by <strong>${respFile.author || fldRec.author || state.currentUser.name}</strong>
                                    ${isSubmitted ? ` • <span style="color: #1D4ED8; font-weight: 800;"><i class="fas fa-paper-plane" style="font-size: 10px;"></i> Submitted on ${fldRec.coordinatorSubmittedAt || 'Recently'}</span>` : ''}
                                  </div>
                                </div>
                              </div>
                              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                                <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 14px; border-radius: 8px; box-shadow: 0 2px 6px rgba(37,99,235,0.3); display: inline-flex; align-items: center; gap: 5px;" onclick="openFileViewer('${encodeURIComponent(JSON.stringify(respFile))}', 'Uploaded Response: ${respFile.name}')">
                                  <i class="fas fa-eye"></i> View Response
                                </button>
                                <a href="${getFileDownloadUrl(respFile)}" download="${respFile.name}" target="_blank" class="ios-btn" style="background: #16A34A; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                                  <i class="fas fa-download"></i> Download
                                </a>
                                <input type="file" id="direct-upload-input-${fld.id}-${file.id}" accept="*/*" style="display: none;" onchange="handleFolderUpload('${fld.id}', event, 'direct-upload-input-${fld.id}-${file.id}', '${file.id}', '${encodeURIComponent(file.name)}')" />
                                <button type="button" class="ios-btn" style="background: #EFF6FF; color: #1D4ED8; border: 1.5px solid #BFDBFE; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 5px;" onclick="document.getElementById('direct-upload-input-${fld.id}-${file.id}').click()" title="Replace response file for this template">
                                  <i class="fas fa-sync-alt"></i> Replace
                                </button>
                                <button type="button" class="ios-btn" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; font-size: 11px; font-weight: 800; padding: 6px 10px; border-radius: 8px;" title="Remove this response" onclick="handleDeleteUploadedFile('${fldRec.id}', '${encodeURIComponent(respFile.name)}', '${fld.id}', '${file.id}')">
                                  <i class="fas fa-trash-alt"></i>
                                </button>
                              </div>
                            </div>
                          ` : `
                            <div style="display: flex; justify-content: space-between; align-items: center; background: #FFFBEB; padding: 12px 16px; flex-wrap: wrap; gap: 10px;">
                              <div style="display: flex; align-items: center; gap: 10px;">
                                <i class="fas fa-clock" style="color: #D97706; font-size: 20px;"></i>
                                <div>
                                  <div style="font-size: 13px; font-weight: 800; color: #92400E;">○ Response Pending for this Template</div>
                                  <div style="font-size: 11px; color: #B45309; font-weight: 600;">Download official template above, fill metrics, and upload completed response file here (all formats supported).</div>
                                </div>
                              </div>
                              <div>
                                <input type="file" id="direct-upload-input-${fld.id}-${file.id}" accept="*/*" style="display: none;" onchange="handleFolderUpload('${fld.id}', event, 'direct-upload-input-${fld.id}-${file.id}', '${file.id}', '${encodeURIComponent(file.name)}')" />
                                <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3); display: inline-flex; align-items: center; gap: 6px;" onclick="document.getElementById('direct-upload-input-${fld.id}-${file.id}').click()" title="Upload completed response for this template">
                                  <i class="fas fa-cloud-upload-alt"></i> Upload Response
                                </button>
                              </div>
                            </div>
                          `}

                        </div>
                      `;
                    }).join('')}
                  </div>
                `}
              </div>

              <!-- 3. Coordinator Remarks & Submission Bar -->
              <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 18px 20px;">
                <div class="ios-form-group" style="margin-bottom: 14px;">
                  <label class="ios-label" style="font-size: 12px; font-weight: 800; color: #0F172A;">Coordinator Remarks for this Folder:</label>
                  <textarea id="folder-remarks-${fld.id}" class="ios-input" rows="2" style="font-size: 12.5px; font-weight: 600;" placeholder="Add verification notes for this folder...">${fldRec?.coordinatorRemarks || ''}</textarea>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid #E2E8F0; padding-top: 14px; flex-wrap: wrap; gap: 10px;">
                  <button type="button" class="ios-btn" style="background: #FFF; color: #0F172A; font-weight: 800; border: 1.5px solid #CBD5E1; padding: 9px 16px; font-size: 12.5px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);" onclick="saveFolderDraft('${fld.id}')">
                    <i class="fas fa-save"></i> Save Draft
                  </button>

                  ${isSubmitted ? `
                    <!-- ALREADY SUBMITTED -->
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                      <div style="background: #EFF6FF; border: 2px solid #60A5FA; border-radius: 10px; padding: 10px 18px; display: inline-flex; align-items: center; gap: 10px; color: #1D4ED8; font-size: 13.5px; font-weight: 900; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);">
                        <i class="fas fa-check-circle" style="color: #2563EB; font-size: 18px;"></i>
                        <span>✓ SUBMITTED TO ${submitTargetLabel.toUpperCase()} (${fldRec.coordinatorSubmittedAt || 'Recorded'})</span>
                      </div>
                      <button type="button" class="ios-btn" style="background: #FFFFFF; color: #1E293B; font-weight: 800; border: 1.5px solid #CBD5E1; padding: 10px 18px; font-size: 12.5px; border-radius: 9px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);" onclick="submitFolderToHOD('${fld.id}')" title="Click to update remarks or resubmit modified responses to ${submitTargetLabel}">
                        <i class="fas fa-sync-alt" style="color: #2563EB;"></i>
                        <span>Re-Submit / Update</span>
                      </button>
                    </div>
                  ` : (isHodApproved ? `
                    <!-- HOD APPROVED -->
                    <div style="background: #F0FDF4; border: 2px solid #86EFAC; border-radius: 10px; padding: 10px 20px; display: inline-flex; align-items: center; gap: 10px; color: #15803D; font-size: 13.5px; font-weight: 900; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.12);">
                      <i class="fas fa-check-double" style="color: #16A34A; font-size: 18px;"></i>
                      <span>✓ APPROVED BY HOD (${fldRec.hodApprovedAt || 'Recorded'})</span>
                    </div>
                  ` : (isVerified ? `
                    <!-- IQAC VERIFIED -->
                    <div style="background: #ECFDF5; border: 2px solid #6EE7B7; border-radius: 10px; padding: 10px 20px; display: inline-flex; align-items: center; gap: 10px; color: #047857; font-size: 13.5px; font-weight: 900; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.12);">
                      <i class="fas fa-shield-alt" style="color: #059669; font-size: 18px;"></i>
                      <span>✓ VERIFIED BY IQAC CENTRAL DIRECTORATE</span>
                    </div>
                  ` : (prog.completed === 0 ? `
                    <button type="button" class="ios-btn" style="background: #94A3B8; color: #FFF; padding: 10px 20px; font-size: 13px; font-weight: 800; border-radius: 9px; cursor: not-allowed;" onclick="showToast('Please upload at least one completed response file before submitting to ${submitTargetLabel}.', 'warning')">
                      <i class="fas fa-paper-plane"></i> Submit to ${submitTargetLabel} (0 Files Uploaded)
                    </button>
                  ` : (prog.isPartial ? `
                    <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #D97706 0%, #B45309 100%); color: #FFF; padding: 10px 22px; font-size: 13px; font-weight: 800; border-radius: 9px; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35); display: inline-flex; align-items: center; gap: 6px;" onclick="submitFolderToHOD('${fld.id}')" title="Submit partial progress to ${submitTargetLabel}">
                      <i class="fas fa-paper-plane"></i> Submit Partial Progress (${prog.completed}/${prog.total} Files) to ${submitTargetLabel}
                    </button>
                  ` : `
                    <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFF; padding: 10px 24px; font-size: 13.5px; font-weight: 900; border-radius: 9px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); display: inline-flex; align-items: center; gap: 6px;" onclick="submitFolderToHOD('${fld.id}')">
                      <i class="fas fa-paper-plane"></i> Submit Complete ${fld.title} (${prog.total}/${prog.total} Files) to ${submitTargetLabel}
                    </button>
                  `))))}
                </div>

                ${fldRec?.hodRemarks ? `
                  <div style="margin-top: 14px; background: #DCFCE7; border: 1px solid #86EFAC; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #15803D;">
                    <strong>HOD Review Note (${fldRec.hodApprovedAt || 'Recorded'}):</strong> ${fldRec.hodRemarks}
                  </div>
                ` : ''}
              </div>

            </div>
          </div>
        `;
      }

      // VIEW A: ALL FORMAT FOLDERS DIRECTORY (Clean Grid View)
      return `
        <!-- Mandatory Template Guidance Box -->
        <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 2px solid #93C5FD; border-radius: 14px; padding: 14px 20px; margin-bottom: 22px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.06);">
          <i class="fas fa-folder-tree" style="font-size: 28px; color: #2563EB;"></i>
          <div>
            <div style="font-size: 14px; font-weight: 800; color: #1E40AF;">Official Template Folders (Academic Year ${state.selectedAcademicYear})</div>
            <div style="font-size: 12.5px; font-weight: 600; color: #1E3A8A; margin-top: 2px;">
              Click any format folder below to open it, download official templates, and upload your department's completed responses.
            </div>
          </div>
        </div>

        ${folders.length === 0 ? `
          <div class="ios-card" style="text-align: center; padding: 36px; color: #64748B;">
            <i class="fas fa-folder-open" style="font-size: 40px; color: #CBD5E1; margin-bottom: 12px; display: block;"></i>
            <h4 style="font-size: 16px; font-weight: 800; color: #0F172A; margin-bottom: 4px;">No Template Folders Published Yet</h4>
            <p style="font-size: 13px; font-weight: 600; color: #64748B;">IQAC Admin has not created any format folders yet. Once Admin releases official templates, their folders will appear here.</p>
          </div>
        ` : `
          <div class="responsive-folder-grid">
            ${folders.map(fld => {
              const fldRec = state.yearwiseRecords.find(r => 
                r.departmentId === dept.id && 
                r.academicYear === state.selectedAcademicYear && 
                r.folderId === fld.id
              );
              const prog = window.getFolderProgress(fld, fldRec);
              const isRejected = fldRec && fldRec.status === 'returned_for_revision';
              const isVerified = fldRec && (fldRec.status === 'iqac_verified' || fldRec.status === 'verified_by_iqac');
              const isHodApproved = fldRec && fldRec.status === 'approved_by_hod';
              const isSubmitted = fldRec && fldRec.status === 'submitted_to_hod';

              const cardClass = isRejected ? 'card-revision' : (isVerified || isHodApproved ? 'card-success' : (isSubmitted || prog.completed > 0 ? 'card-partial' : ''));
              const squircleClass = isRejected ? 'folder-squircle-red' : (isVerified || isHodApproved ? 'folder-squircle-green' : (isSubmitted || prog.completed > 0 ? 'folder-squircle-amber' : (fld.files && fld.files.length ? 'folder-squircle-blue' : 'folder-squircle-amber')));

              return `
                <div class="premium-folder-card ${cardClass}" onclick="openCoordinatorFolder('${fld.id}')">
                  <div>
                    <!-- Top Row: Squircle Folder Icon + Full-Width Title & Description -->
                    <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
                      <div class="folder-icon-squircle ${squircleClass}" style="flex-shrink: 0;">
                        <i class="fas ${prog.isComplete ? 'fa-folder-check' : (prog.completed > 0 ? 'fa-folder-open' : 'fa-folder')}"></i>
                      </div>
                      <div style="flex: 1; min-width: 0;">
                        <h4 style="font-size: 16px; font-weight: 800; color: #0F172A; margin: 0 0 4px 0; letter-spacing: -0.01em; line-height: 1.3; word-break: break-word;">${fld.title}</h4>
                        <div style="font-size: 12px; font-weight: 600; color: #64748B; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${(fld.description || 'Official Format Folder').replace(/"/g, '&quot;')}">${fld.description || 'Official Format Folder'}</div>
                      </div>
                    </div>

                    <!-- Status Badge Row -->
                    <div style="margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                      ${window.renderFolderStatusBadge(fld, fldRec)}
                    </div>

                    <!-- Chips / Key Metrics Row -->
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 16px 0;">
                      ${fld.isPermanent ? `
                        <span class="folder-meta-chip" style="background: #EEF2FF; color: #4338CA; border: 1.5px solid #C7D2FE;">
                          <i class="fas fa-shield-alt"></i>
                          <span>Permanent Report Folder</span>
                        </span>
                      ` : ''}
                      ${prog.isMulti ? `
                        <span class="folder-meta-chip ${prog.uploadedFiles.length > 0 ? 'folder-meta-chip-success' : 'folder-meta-chip-neutral'}">
                          <i class="fas fa-layer-group" style="color: ${prog.uploadedFiles.length > 0 ? '#16A34A' : '#2563EB'};"></i>
                          <span><strong>${prog.uploadedFiles.length}</strong> Report(s) Uploaded</span>
                        </span>
                      ` : `
                        <span class="folder-meta-chip folder-meta-chip-neutral">
                          <i class="fas fa-file-excel" style="color: #2563EB;"></i>
                          <span><strong>${prog.total}</strong> Official Template(s)</span>
                        </span>
                        ${prog.completed === 0 ? `
                          <span class="folder-meta-chip folder-meta-chip-pending">
                            <i class="fas fa-clock"></i>
                            <span>0/${prog.total} Completed</span>
                          </span>
                        ` : (prog.isPartial ? `
                          <span class="folder-meta-chip folder-meta-chip-pending" style="background: #FEF3C7; color: #92400E; border: 1.5px solid #FCD34D;">
                            <i class="fas fa-hourglass-half"></i>
                            <span><strong>${prog.completed} of ${prog.total}</strong> Completed (${prog.pending} Pending)</span>
                          </span>
                        ` : `
                          <span class="folder-meta-chip folder-meta-chip-success">
                            <i class="fas fa-check-circle"></i>
                            <span><strong>All ${prog.total}</strong> Completed</span>
                          </span>
                        `)}
                      `}
                      ${fldRec && fldRec.coordinatorRemarks ? `
                        <span class="folder-meta-chip folder-meta-chip-neutral" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${fldRec.coordinatorRemarks}">
                          <i class="fas fa-comment-dots" style="color: #881337;"></i>
                          <span>Note: "${fldRec.coordinatorRemarks}"</span>
                        </span>
                      ` : ''}
                      ${isRejected ? `
                        <div style="width: 100%; margin-top: 6px; padding: 7px 11px; background: #FEF2F2; border: 1.5px dashed #F87171; border-radius: 8px; font-size: 11.5px; font-weight: 800; color: #BE123C; display: flex; align-items: center; gap: 8px;">
                          <i class="fas fa-trash-alt" style="color: #DC2626;"></i>
                          <span>Your file is deleted due to rejection. Please open folder to re-upload.</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Bottom Row: Creator / AY + Open Folder Action Button -->
                  <div style="border-top: 1.5px solid #F1F5F9; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div style="font-size: 11.5px; font-weight: 700; color: #64748B; display: flex; align-items: center; gap: 6px;">
                      <i class="fas fa-shield-alt" style="color: #881337;"></i>
                      <span>Admin IQAC</span>
                      <span>•</span>
                      <span>AY ${state.selectedAcademicYear}</span>
                    </div>
                    <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 16px; border-radius: 9px; box-shadow: 0 3px 10px rgba(15, 23, 42, 0.2); display: inline-flex; align-items: center; gap: 6px;">
                      <span>Open Folder</span>
                      <i class="fas fa-arrow-right" style="font-size: 11px;"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      `;
    })()}
  `;
}

// Coordinator Folder Navigation Handlers
window.openCoordinatorFolder = function(folderId) {
  state.selectedCoordinatorFolder = folderId;
  renderActiveView();
};

window.closeCoordinatorFolder = function() {
  state.selectedCoordinatorFolder = null;
  renderActiveView();
};

// Folder-Specific Upload Handlers (Directly Paired to Template Slots)
window.handleFolderUpload = async function(folderId, event, customInputId, templateFileId, templateFileName) {
  let fileInput = null;
  if (customInputId) {
    fileInput = document.getElementById(customInputId);
  } else if (event && event.target) {
    fileInput = event.target;
  } else {
    fileInput = document.getElementById(`folder-excel-input-${folderId}`);
  }
  if (!fileInput || !fileInput.files.length) {
    showToast('Please select a file to upload.', 'warning');
    return;
  }

  const file = fileInput.files[0];

  try {
    const uploadRes = await window.uploadFileWithLiveProgress(file);
    if (!uploadRes || !uploadRes.success) {
      window.updateUploadProgress({ isError: true, errorText: uploadRes?.error || 'Unable to upload file. Please retry.' });
      showToast('Unable to upload file. Please retry.', 'error');
      return;
    }
    window.updateUploadProgress({ percent: 96, statusText: 'Saving response record to database...' });

    const deptId = window.getEffectiveUserDeptId();
    const year = state.selectedAcademicYear;
    const remarks = document.getElementById(`folder-remarks-${folderId}`)?.value || '';

    let rec = state.yearwiseRecords.find(r => 
      r.departmentId === deptId && 
      r.academicYear === year && 
      r.folderId === folderId
    ) || {
      departmentId: deptId,
      academicYear: year,
      folderId: folderId,
      uploadedFiles: [],
      evidenceFiles: []
    };

    rec.uploadedFiles = rec.uploadedFiles || [];

    const effectiveTemplateId = (templateFileId === '__multi__')
      ? `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      : (templateFileId || null);

    const newResponseFile = {
      ...uploadRes.file,
      author: state.currentUser?.name || 'Coordinator',
      templateFileId: effectiveTemplateId,
      templateFileName: templateFileName ? decodeURIComponent(templateFileName) : uploadRes.file.name
    };

    if (templateFileId === '__multi__') {
      rec.uploadedFiles.push(newResponseFile);
    } else if (effectiveTemplateId) {
      const matchIdx = rec.uploadedFiles.findIndex(f => f.templateFileId === effectiveTemplateId);
      if (matchIdx >= 0) {
        rec.uploadedFiles[matchIdx] = newResponseFile;
      } else {
        rec.uploadedFiles.push(newResponseFile);
      }
    } else {
      const matchIdx = rec.uploadedFiles.findIndex(f => f.name === newResponseFile.name || f.filename === newResponseFile.filename);
      if (matchIdx >= 0) {
        rec.uploadedFiles[matchIdx] = newResponseFile;
      } else {
        rec.uploadedFiles.push(newResponseFile);
      }
    }

    rec.excelFile = newResponseFile;
    rec.folderId = folderId;
    rec.author = state.currentUser.name;
    if (rec.status === 'returned_for_revision' || rec.status === 'rejected') {
      rec.status = 'draft';
    }
    if (remarks) rec.coordinatorRemarks = remarks;

    const saveRes = await fetch('/api/yearwise-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rec)
    }).then(r => r.json());

    if (saveRes.success) {
      if (saveRes.record) {
        const idx = state.yearwiseRecords.findIndex(r => r.id === saveRes.record.id);
        if (idx >= 0) state.yearwiseRecords[idx] = saveRes.record;
        else state.yearwiseRecords.push(saveRes.record);
      }
      window.updateUploadProgress({ isDone: true });
      setTimeout(() => {
        window.closeUploadProgress();
      }, 700);
      showToast(`Response file "${uploadRes.file.name}" uploaded successfully!`, 'success');
      renderActiveView();
      await loadInitialData();
      if (saveRes.record && !state.yearwiseRecords.some(r => r.id === saveRes.record.id)) {
        state.yearwiseRecords.push(saveRes.record);
      }
      renderActiveView();
    } else {
      window.updateUploadProgress({ isError: true, errorText: saveRes.error || 'Failed to save record.' });
    }
  } catch (err) {
    console.debug('Folder upload error:', err);
    window.updateUploadProgress({ isError: true, errorText: err.message || 'File upload failed. Please retry.' });
    showToast('File upload failed. Please retry.', 'error');
  }
};

window.handleDeleteUploadedFile = async function(recId, filename, folderId, templateFileId) {
  const cleanName = decodeURIComponent(filename);
  window.showConfirmDialog({
    title: `Remove "${cleanName}"?`,
    message: `Are you sure you want to remove response file "${cleanName}"? You can re-upload your revised file at any time.`,
    confirmText: 'Yes, Remove File',
    onConfirm: async () => {
      try {
        const deleteTarget = templateFileId || encodeURIComponent(cleanName);
        const res = await fetch(`/api/yearwise-records/${recId}/files/${deleteTarget}`, {
          method: 'DELETE'
        }).then(r => r.json());
        if (res.success) {
          showToast('Response file removed.', 'info');
          await loadInitialData();
          renderActiveView();
        } else {
          showToast(res.error || 'Failed to remove file.', 'error');
        }
      } catch (err) {
        showToast('Failed to remove file.', 'error');
      }
    }
  });
};

window.handleAdminDeleteResponseFile = async function(recId, filename, folderId, templateFileId) {
  const cleanName = decodeURIComponent(filename);
  window.showConfirmDialog({
    title: `Delete Department Response File?`,
    message: `Are you sure you want to delete the submitted file "${cleanName}"? The official format template will NOT be touched.`,
    confirmText: 'Yes, Delete Response',
    onConfirm: async () => {
      try {
        const deleteTarget = templateFileId || encodeURIComponent(cleanName);
        const res = await fetch(`/api/yearwise-records/${recId}/files/${deleteTarget}`, {
          method: 'DELETE'
        }).then(r => r.json());
        if (res.success) {
          showToast(`Response file "${cleanName}" removed. Template remains safe.`, 'success');
          await loadInitialData();
          renderActiveView();
        } else {
          showToast(res.error || 'Failed to remove response file.', 'error');
        }
      } catch (err) {
        showToast('Failed to remove response file.', 'error');
      }
    }
  });
};

window.submitFolderToHOD = async function(folderId) {
  const deptId = window.getEffectiveUserDeptId();
  const year = state.selectedAcademicYear;
  const targetLabel = (state.currentUser?.role === 'hod' || state.currentUser?.role === 'tpo') ? 'NAAC Coordinator' : 'HOD / NAAC Coordinator';

  const fld = (state.formatFolders || []).find(f => f.id === folderId);
  let rec = state.yearwiseRecords.find(r => 
    r.departmentId === deptId && 
    r.academicYear === year && 
    r.folderId === folderId
  );

  const prog = window.getFolderProgress(fld, rec);

  if (prog.completed === 0) {
    showToast(`Please upload at least one completed response file in this folder before submitting to ${targetLabel}.`, 'warning');
    return;
  }

  if (prog.isPartial) {
    const confirmed = confirm(`Notice: This folder has ${prog.total} official templates, but only ${prog.completed} response file(s) have been uploaded (${prog.pending} pending).\n\nDo you want to submit this partial progress to ${targetLabel} now?`);
    if (!confirmed) return;
  }

  const remarks = document.getElementById(`folder-remarks-${folderId}`)?.value || rec?.coordinatorRemarks || (prog.isPartial ? `Partially submitted (${prog.completed}/${prog.total} files).` : `Submitted for ${targetLabel} scrutiny.`);

  try {
    showToast(`Submitting folder responses to ${targetLabel}...`, 'info');

    let recId = rec?.id || `yr-${deptId}-${year}-${folderId}`;
    if (!rec) {
      const createRes = await fetch('/api/yearwise-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: deptId,
          academicYear: year,
          folderId: folderId,
          author: state.currentUser.name,
          coordinatorRemarks: remarks
        })
      }).then(r => r.json());
      if (createRes.record) {
        rec = createRes.record;
        recId = rec.id;
      }
    }

    const res = await fetch(`/api/yearwise-records/${recId}/workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit_to_hod',
        remarks,
        actorName: state.currentUser.name,
        actorRole: state.currentUser.role
      })
    }).then(r => r.json());

    if (res.success) {
      showToast(prog.isPartial ? `✓ Partial progress (${prog.completed}/${prog.total} files) SUBMITTED to HOD!` : `✓ All ${prog.total} responses SUBMITTED to HOD successfully!`, 'success');
      await loadInitialData();
      renderActiveView();
    } else {
      showToast(res.error || 'Failed to submit to HOD.', 'error');
    }
  } catch (err) {
    console.error('Submit error:', err);
    showToast('Network error while submitting to HOD.', 'error');
  }
};

window.saveFolderDraft = async function(folderId) {
  const deptId = window.getEffectiveUserDeptId();
  const year = state.selectedAcademicYear;
  const remarks = document.getElementById(`folder-remarks-${folderId}`)?.value || '';

  let rec = state.yearwiseRecords.find(r => 
    r.departmentId === deptId && 
    r.academicYear === year && 
    r.folderId === folderId
  );

  if (rec) {
    rec.coordinatorRemarks = remarks;
    rec.author = state.currentUser.name;

    const saveRes = await fetch('/api/yearwise-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rec)
    }).then(r => r.json());

    if (saveRes.success) {
      showToast('Draft remarks saved!', 'success');
      await loadInitialData();
      renderActiveView();
    }
  }
};

window.selectAcademicYearTab = function(year) {
  state.selectedAcademicYear = year;
  renderActiveView();
};

window.handleYearwiseExcelUpload = async function() {
  const fileInput = document.getElementById('year-excel-input');
  if (!fileInput || !fileInput.files.length) {
    showToast('Please select an Excel sheet (.xlsx / .xls) to upload', 'warning');
    return;
  }

  const file = fileInput.files[0];

  try {
    const uploadRes = await window.uploadFileWithLiveProgress(file);
    if (!uploadRes || !uploadRes.success) {
      window.updateUploadProgress({ isError: true, errorText: uploadRes?.error || 'Unable to upload sheet. Please verify and retry.' });
      showToast('Unable to upload sheet. Please verify the file and retry.', 'error');
      return;
    }
    window.updateUploadProgress({ percent: 96, statusText: 'Saving academic year record...' });

    const deptId = window.getEffectiveUserDeptId();
    const year = state.selectedAcademicYear;

    let rec = state.yearwiseRecords.find(r => r.departmentId === deptId && r.academicYear === year) || {
      departmentId: deptId,
      academicYear: year,
      evidenceFiles: []
    };

    rec.excelFile = uploadRes.file;
    rec.author = state.currentUser.name;

    const saveRes = await fetch('/api/yearwise-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rec)
    }).then(r => r.json());

    if (saveRes.success) {
      window.updateUploadProgress({ isDone: true });
      setTimeout(() => {
        window.closeUploadProgress();
      }, 700);
      showToast(`Excel sheet for Academic Year ${year} uploaded successfully!`, 'success');
      await loadInitialData();
      renderActiveView();
    } else {
      window.updateUploadProgress({ isError: true, errorText: saveRes.error || 'Failed to update academic record.' });
    }
  } catch (err) {
    console.debug('Upload notice:', err);
    window.updateUploadProgress({ isError: true, errorText: err.message || 'Sheet upload failed. Please retry.' });
    showToast('File upload could not be processed. Please retry.', 'error');
  }
};

window.saveYearwiseDraft = async function() {
  const deptId = state.currentUser.departmentId;
  const year = state.selectedAcademicYear;
  const remarks = document.getElementById('year-remarks-input')?.value || '';

  let rec = state.yearwiseRecords.find(r => r.departmentId === deptId && r.academicYear === year) || {
    departmentId: deptId,
    academicYear: year,
    evidenceFiles: []
  };

  rec.coordinatorRemarks = remarks;
  rec.author = state.currentUser.name;

  const saveRes = await fetch('/api/yearwise-records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rec)
  }).then(r => r.json());

  if (saveRes.success) {
    showToast(`Draft saved for Academic Year ${year}!`, 'success');
    await loadInitialData();
    renderActiveView();
  }
};

window.submitYearToHOD = async function(recId) {
  await saveYearwiseDraft();
  const deptId = state.currentUser.departmentId;
  const year = state.selectedAcademicYear;

  let rec = state.yearwiseRecords.find(r => r.departmentId === deptId && r.academicYear === year);
  if (!rec || !rec.excelFile) {
    showToast('Please upload your department criteria Excel sheet before submitting to HOD.', 'warning');
    return;
  }

  const remarks = document.getElementById('year-remarks-input')?.value || 'Submitted completed response file.';
  const res = await fetch(`/api/yearwise-records/${rec.id}/workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'submit_to_hod',
      remarks,
      actorName: state.currentUser.name,
      actorRole: state.currentUser.role
    })
  }).then(r => r.json());

  if (res.success) {
    showToast(`Academic Year ${year} submitted to HOD successfully!`, 'success');
    await loadInitialData();
    renderActiveView();
  }
};

// ==========================================================================
// 2. HEAD OF DEPARTMENT (HOD) YEARWISE REVIEW DESK
// ==========================================================================
function renderHodYearwiseReview(container) {
  const dept = state.departments.find(d => d.id === state.currentUser.departmentId) || state.departments[0];
  const deptRecords = state.yearwiseRecords.filter(r => r.departmentId === dept.id && r.folderId !== 'fld-tpo-permanent');

  container.innerHTML = `
    <div class="ios-card">
      <div class="ios-card-header">
        <h3><i class="fas fa-check-circle" style="color: var(--ios-primary);"></i> HOD Scrutiny: ${dept.name} (${dept.code})</h3>
        <span class="ios-status-tag status-hod-approved">Head: ${state.currentUser.name}</span>
      </div>
      <div class="ios-card-body">
        <p style="font-size: 13px; color: var(--ios-text-secondary); margin-bottom: 18px;">
          Review annual criteria Excel sheets submitted by Department Coordinator <strong>${dept.coordinator}</strong> for each academic year:
        </p>

        <div class="ios-table-container">
          <table class="ios-table">
            <thead>
              <tr>
                <th>Academic Year</th>
                <th>Status</th>
                <th>Uploaded Excel Sheet</th>
                <th>Coordinator Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${state.academicYears.map(yr => {
                const yrRecs = deptRecords.filter(r => r.academicYear === yr);
                if (yrRecs.length === 0) {
                  return `
                    <tr>
                      <td><strong>AY ${yr}</strong></td>
                      <td><span style="color:#888; font-size:11px;">Not Uploaded</span></td>
                      <td><span style="color:#999; font-size:11px;">Pending</span></td>
                      <td style="font-size: 12px; color: #555;">-</td>
                      <td><span style="color:#aaa; font-size:11px;">Awaiting file</span></td>
                    </tr>
                  `;
                }
                return yrRecs.map(rec => {
                  const fld = (state.formatFolders || []).find(f => f.id === rec.folderId) || { title: 'Master NAAC Format', files: [] };
                  const prog = window.getFolderProgress(fld, rec);
                  return `
                    <tr>
                      <td>
                        <strong>AY ${yr}</strong><br>
                        <span style="font-size: 11px; font-weight: 700; color: #2563EB;">📁 ${fld.title}</span>
                      </td>
                      <td>${window.renderFolderStatusBadge(fld, rec)}</td>
                      <td>
                        ${prog.completed > 0 ? `
                          <div style="font-size: 12px; font-weight: 800; color: #15803D; margin-bottom: 4px;">
                            ${prog.completed} of ${prog.total} File(s) Uploaded
                          </div>
                          <div style="display: flex; flex-direction: column; gap: 4px;">
                            ${prog.uploadedFiles.map(f => `
                              <a href="${getFileDownloadUrl(f)}" target="_blank" class="ios-btn ios-btn-subtle" style="font-size: 11px; padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px;">
                                <i class="fas fa-file-excel" style="color:#16A34A;"></i> ${f.name}
                              </a>
                            `).join('')}
                          </div>
                        ` : '<span style="color:#999; font-size:11px;">Pending</span>'}
                      </td>
                      <td style="font-size: 12px; color: #555; max-width: 180px;">
                        ${rec?.coordinatorRemarks || '-'}
                      </td>
                      <td>
                        ${prog.completed > 0 ? `
                          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                            <button class="ios-btn" style="background: var(--ios-primary); color: #FFF; font-size: 11.5px; padding: 5px 12px; border-radius: 8px;" onclick="openHodYearInspectModal('${rec.id}')">
                              <i class="fas fa-stamp"></i> Scrutinize & Approve
                            </button>
                            <button class="ios-btn" style="background: #DC2626; color: #FFF; font-size: 11.5px; padding: 5px 10px; border-radius: 8px; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);" onclick="openRejectNotesModal('${rec.id}', 'yearwise')" title="Reject / Return with Notes">
                              <i class="fas fa-undo"></i> Reject with Notes
                            </button>
                          </div>
                        ` : '<span style="color:#aaa; font-size:11px;">Awaiting file</span>'}
                      </td>
                    </tr>
                  `;
                }).join('');
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderHodAllRecords(container) {
  renderHodYearwiseReview(container);
}

window.openHodYearInspectModal = function(recId) {
  const rec = state.yearwiseRecords.find(r => r.id === recId);
  if (!rec) return;
  const dept = state.departments.find(d => d.id === rec.departmentId);
  const fld = (state.formatFolders || []).find(f => f.id === rec.folderId) || { title: 'Master NAAC Criteria Format', files: [] };
  const prog = window.getFolderProgress(fld, rec);

  const modalOverlay = document.getElementById('workflow-modal-overlay');
  const modalContent = document.getElementById('workflow-modal-content');

  modalContent.innerHTML = `
    <div class="ios-modal-head">
      <h3><i class="fas fa-stamp" style="color: var(--ios-primary);"></i> HOD Scrutiny: ${dept?.shortName} - ${fld.title} (AY ${rec.academicYear})</h3>
      <button class="ios-modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="ios-modal-body" style="padding: 20px;">
      <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; font-size: 13px;">
        <div class="modal-two-col">
          <div><strong style="color: #0F172A;">Department:</strong> ${dept?.name} (${dept?.code})</div>
          <div><strong style="color: #0F172A;">Academic Year:</strong> AY ${rec.academicYear}</div>
          <div><strong style="color: #0F172A;">Format Folder:</strong> ${fld.title}</div>
          <div><strong style="color: #0F172A;">Submitted By:</strong> ${rec.author || dept?.coordinator || 'Coordinator'}</div>
          <div><strong style="color: #0F172A;">Submitted At:</strong> ${rec.coordinatorSubmittedAt || rec.createdAt || 'N/A'}</div>
          <div><strong style="color: #0F172A;">Current Status:</strong> ${window.renderFolderStatusBadge(fld, rec)}</div>
        </div>
        ${rec.coordinatorRemarks ? `
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #CBD5E1; font-size: 12.5px; color: #334155;">
            <strong>Coordinator Remarks:</strong> <em>"${rec.coordinatorRemarks}"</em>
          </div>
        ` : ''}
      </div>

      <!-- Completion Meter & Warning Banner -->
      ${prog.isPartial ? `
        <div style="background: #FFFBEB; border: 1.5px solid #FCD34D; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; color: #92400E; display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 20px; color: #D97706;"></i>
          <div>
            <strong>Partial Submission Alert:</strong> Coordinator has submitted ${prog.completed} of ${prog.total} template response(s). <strong>${prog.pending} template(s) are still pending</strong> response upload.
          </div>
        </div>
      ` : ''}

      <!-- Detailed Template Breakdown -->
      <h4 style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 10px; letter-spacing: 0.3px;">
        Official Templates & Completed Responses (${prog.completed}/${prog.total} Fulfilled):
      </h4>

      <div style="display: grid; gap: 10px; margin-bottom: 18px;">
        ${(fld.files && fld.files.length > 0) ? fld.files.map((file, idx) => {
          const resp = prog.uploadedFiles.find(uf => uf.templateFileId === file.id || (!uf.templateFileId && idx === 0));
          return `
            <div style="border: 1.5px solid ${resp ? '#86EFAC' : '#FCD34D'}; border-radius: 10px; overflow: hidden; background: #FFF;">
              <div style="display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 12.5px;">
                <span style="font-weight: 700; color: #0F172A;">
                  <i class="fas fa-file-excel" style="color: #2563EB; margin-right: 6px;"></i> Template ${idx + 1}: ${file.name}
                </span>
                <span style="font-size: 11px; color: #64748B;">Size: ${file.size || 'Format'}</span>
              </div>
              <div style="padding: 10px 14px; background: ${resp ? '#F0FDF4' : '#FFFBEB'}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                ${resp ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-check-circle" style="color: #16A34A; font-size: 18px;"></i>
                    <div>
                      <div style="font-weight: 800; font-size: 13px; color: #15803D;">✓ ${resp.name}</div>
                      <div style="font-size: 11px; color: #64748B;">Uploaded: ${resp.uploadDate || 'Recent'} • Size: ${resp.size}</div>
                    </div>
                  </div>
                  <a href="${getFileDownloadUrl(resp)}" download="${resp.name}" target="_blank" class="ios-btn" style="background: #16A34A; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 5px 12px; border-radius: 6px; text-decoration: none;">
                    <i class="fas fa-download"></i> Open & Scrutinize
                  </a>
                ` : `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-clock" style="color: #D97706; font-size: 18px;"></i>
                    <span style="font-weight: 700; font-size: 12.5px; color: #92400E;">⚠️ Response Pending (Not Uploaded by Coordinator)</span>
                  </div>
                  <span class="ios-status-tag" style="background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D;">Missing Response</span>
                `}
              </div>
            </div>
          `;
        }).join('') : `
          ${prog.uploadedFiles.map(file => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 10px; padding: 12px 14px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-file-excel" style="font-size: 22px; color: #16A34A;"></i>
                <div>
                  <div style="font-weight: 700; font-size: 13px; color: #15803D;">${file.name}</div>
                  <div style="font-size: 11px; color: #64748B;">Size: ${file.size} • Uploaded: ${file.uploadDate}</div>
                </div>
              </div>
              <a href="${getFileDownloadUrl(file)}" target="_blank" class="ios-btn" style="background: #16A34A; color: #FFF; font-size: 11.5px; padding: 5px 12px; border-radius: 6px;">
                <i class="fas fa-download"></i> Open & Scrutinize
              </a>
            </div>
          `).join('')}
        `}
      </div>

      <div class="ios-form-group">
        <label class="ios-label" style="font-size: 12.5px; font-weight: 800; color: #0F172A;">HOD Formal Verification Remarks:</label>
        <textarea id="hod-year-remarks" class="ios-input" rows="3">Verified with Departmental Academic Advisory Board. All criteria metrics approved. Recommended for IQAC.</textarea>
      </div>
    </div>
    <div class="ios-modal-foot" style="display: flex; justify-content: space-between; gap: 10px;">
      <button class="ios-btn ios-btn-danger" style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); font-weight: 800;" onclick="openRejectNotesModal('${rec.id}', 'yearwise')">
        <i class="fas fa-undo"></i> Reject with Notes
      </button>
      <button class="ios-btn ios-btn-success" onclick="executeHodYearAction('${rec.id}', 'approve_by_hod')">
        <i class="fas fa-check-circle"></i> Grant HOD Approval & Forward
      </button>
    </div>
  `;

  modalOverlay.style.display = 'flex';
};

window.executeHodYearAction = async function(recId, action) {
  const remarks = document.getElementById('hod-year-remarks')?.value || '';
  const res = await fetch(`/api/yearwise-records/${recId}/workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      remarks,
      actorName: state.currentUser.name,
      actorRole: state.currentUser.role
    })
  }).then(r => r.json());

  if (res.success) {
    closeModal();
    showToast(action === 'approve_by_hod' ? 'HOD Approval granted successfully!' : 'Returned for revision.', 'success');
    await loadInitialData();
    renderActiveView();
  }
};

// ==========================================================================
// 3. ADMIN MASTER FORMAT MANAGEMENT WORKSPACE
// ==========================================================================
function renderAdminMasterTemplateManager(container) {
  const folders = state.formatFolders || [];

  container.innerHTML = `
    <!-- Registered Users Quick Navigation Banner -->
    <div style="background: linear-gradient(135deg, #EFF6FF 0%, #EEF2F6 100%); border: 1.5px solid #CBD5E1; border-radius: 14px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);">
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-users" style="font-size: 20px; color: var(--ios-primary);"></i>
        <span style="font-size: 13.5px; font-weight: 800; color: #0F172A;">
          Registered Users Directory: <span style="color: #2563EB;">${(state.allUsers || []).length} Accounts Active</span>
        </span>
      </div>
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <button type="button" class="ios-btn" style="background: #2563EB; color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 14px; border-radius: 8px;" onclick="switchNavTab('admin-dept-folders', event)">
          <i class="fas fa-folder"></i>
          <span style="margin-left: 6px;">14 Department Folders</span>
        </button>
        <button type="button" class="ios-btn" style="background: #1D4ED8; color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 14px; border-radius: 8px;" onclick="switchNavTab('admin-overview', event)">
          <i class="fas fa-th"></i>
          <span style="margin-left: 6px;">14 Departments Matrix</span>
        </button>
        <button type="button" class="ios-btn" style="background: #0F172A; color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 14px; border-radius: 8px;" onclick="switchNavTab('admin-registered-users', event)">
          <span>View Users Directory</span>
          <i class="fas fa-arrow-right" style="margin-left: 6px;"></i>
        </button>
      </div>
    </div>

    <!-- Quick Access to 14 Department Folders -->
    <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 2px solid #93C5FD; border-radius: 14px; padding: 16px 20px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.06);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <i class="fas fa-folder-tree" style="font-size: 32px; color: #2563EB;"></i>
        <div>
          <div style="font-size: 15px; font-weight: 800; color: #1E40AF;">Department Submissions are Organized in "14 Department Folders"</div>
          <div style="font-size: 12.5px; font-weight: 600; color: #1E3A8A; margin-top: 2px;">
            To inspect, audit, or verify any department's criteria files, open their respective folder in the 14 Department Folders tab.
          </div>
        </div>
      </div>
      <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFF; font-size: 12.5px; font-weight: 800; padding: 8px 18px; border-radius: 9px; box-shadow: 0 3px 10px rgba(15, 23, 42, 0.2); display: inline-flex; align-items: center; gap: 6px;" onclick="switchNavTab('admin-dept-folders', event)">
        <span>Open 14 Department Folders</span>
        <i class="fas fa-arrow-right" style="font-size: 11px;"></i>
      </button>
    </div>

    <!-- 1. Master Format Folders Management -->
    <div class="ios-card">
      <div class="ios-card-header">
        <h3 style="font-size: 18px; font-weight: 800; color: #0F172A;">
          <i class="fas fa-folder-open" style="color: #D97706;"></i>
          <span>Institutional Format Folders & Templates Management (Admin IQAC)</span>
        </h3>
        <span class="ios-status-tag status-iqac-verified">
          <i class="fas fa-shield-alt"></i> IQAC Central Secretariat
        </span>
      </div>
      <div class="ios-card-body">
        <p style="font-size: 13.5px; font-weight: 600; color: #1E293B; margin-bottom: 20px;">
          Create format folders for Criteria 1 to 7, MSBTE Diploma, and Support Units, and upload templates (.xlsx, .docx, .pdf) into them. All 14 Department Coordinators can browse and download these folders directly.
        </p>

        <!-- A. Create New Format Folder Box -->
        <div style="background: #EFF6FF; border: 2px solid #93C5FD; border-radius: 16px; padding: 18px 22px; margin-bottom: 26px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);">
          <h4 style="font-size: 15px; font-weight: 800; color: #1E40AF; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-folder-plus"></i> Create New Format Folder:
          </h4>
          <div class="responsive-admin-folder-form" style="display: grid; grid-template-columns: 1fr 1.5fr auto; gap: 12px; align-items: end;">
            <div class="ios-form-group" style="margin-bottom: 0;">
              <label class="ios-label" style="font-size: 11.5px; font-weight: 800; color: #1E40AF;">Folder Title</label>
              <input type="text" id="new-folder-title-input" class="ios-input" placeholder="e.g. Criteria 1 Formats" style="padding: 9px 12px; font-size: 13px; font-weight: 700;" />
            </div>
            <div class="ios-form-group" style="margin-bottom: 0;">
              <label class="ios-label" style="font-size: 11.5px; font-weight: 800; color: #1E40AF;">Description (Optional)</label>
              <input type="text" id="new-folder-desc-input" class="ios-input" placeholder="e.g. Curriculum planning and feedback matrices" style="padding: 9px 12px; font-size: 13px; font-weight: 700;" />
            </div>
            <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFF; font-size: 13.5px; font-weight: 800; padding: 11px 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35); white-space: nowrap;" onclick="handleCreateFormatFolder()">
              <i class="fas fa-plus-circle"></i> Create Folder
            </button>
          </div>
        </div>

        <!-- B. Existing Folders Grid -->
        <h4 style="font-size: 15px; font-weight: 800; color: #0F172A; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-folder-tree"></i> Available Format Folders (${folders.length}):
        </h4>

        ${folders.length === 0 ? `
          <div style="background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 14px; padding: 24px; text-align: center; color: #64748B; font-size: 13.5px; font-weight: 700;">
            No format folders created yet. Use the form above to create your first format folder.
          </div>
        ` : `
          <div style="display: grid; gap: 18px;">
            ${folders.map(fld => `
              <div style="background: #FFFFFF; border: 2px solid #CBD5E1; border-left: 5px solid #D97706; border-radius: 16px; padding: 18px 22px; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);">
                
                <!-- Folder Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fas ${fld.isPermanent ? 'fa-shield-alt' : 'fa-folder'}" style="font-size: 26px; color: ${fld.isPermanent ? '#4338CA' : '#F59E0B'};"></i>
                    <div>
                      <span style="font-size: 16px; font-weight: 800; color: #0F172A;">${fld.title}</span>
                      ${fld.isTpoFolder ? `
                        <span class="ios-status-tag" style="background: #FAF5FF; color: #6B21A8; border: 1.5px solid #D8B4FE; font-size: 11px; font-weight: 800; margin-left: 8px;">
                          <i class="fas fa-lock"></i> Confidential: Admin & TPO Only (${(fld.files || []).length} Templates)
                        </span>
                      ` : (fld.isPermanent ? `
                        <span class="ios-status-tag" style="background: #EEF2FF; color: #4338CA; border: 1.5px solid #C7D2FE; font-size: 11px; font-weight: 800; margin-left: 8px;">
                          <i class="fas fa-layer-group"></i> Permanent Multi-Report Folder
                        </span>
                      ` : `
                        <span class="ios-status-tag" style="background: #FEF3C7; color: #92400E; border: 1.5px solid #F59E0B; font-size: 11px; font-weight: 800; margin-left: 8px;">
                          ${(fld.files || []).length} Files
                        </span>
                      `)}
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <button type="button" class="ios-btn" style="background: #EFF6FF; color: #1D4ED8; border: 1.5px solid #BFDBFE; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px;" onclick="openEditFolderModal('${fld.id}')" title="Edit folder name & description">
                      <i class="fas fa-edit"></i> Edit Folder
                    </button>
                    ${!fld.isPermanent ? `
                      <button type="button" class="ios-btn" style="background: #FEE2E2; color: #DC2626; border: 1.5px solid #FCA5A5; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px;" onclick="handleDeleteFormatFolder('${fld.id}')">
                        <i class="fas fa-trash-alt"></i> Delete Folder
                      </button>
                    ` : ''}
                  </div>
                </div>

                ${fld.description ? `
                  <p style="font-size: 12.5px; font-weight: 600; color: #475569; margin-bottom: 14px; margin-left: 38px;">
                    ${fld.description}
                  </p>
                ` : ''}

                <!-- Files List Inside Folder -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 12px 16px; margin-bottom: 14px;">
                  <div style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; margin-bottom: 8px;">
                    <i class="fas fa-file-invoice"></i> Format Files Inside This Folder:
                  </div>

                  ${(!fld.files || fld.files.length === 0) ? `
                    <div style="font-size: 12.5px; color: #94A3B8; font-style: italic; padding: 6px 0;">
                      No files uploaded in this folder yet. Select a file below to upload into this folder.
                    </div>
                  ` : `
                    <div style="display: grid; gap: 8px;">
                      ${fld.files.map(file => {
                        const fileIcon = window.getFileIconInfo(file.name);
                        return `
                          <div style="display: flex; justify-content: space-between; align-items: center; background: #FFF; border: 1.5px solid #CBD5E1; padding: 8px 14px; border-radius: 10px; font-size: 13px; font-weight: 700;">
                            <span style="display: flex; align-items: center; gap: 10px;">
                              <i class="fas ${fileIcon.icon}" style="color: ${fileIcon.color}; font-size: 18px;"></i>
                              <strong style="color: #0F172A;">${file.name}</strong>
                              <span style="font-size: 11.5px; font-weight: 600; color: #64748B;">(${file.size}) • Uploaded: ${file.uploadedAt}</span>
                            </span>
                            <div style="display: flex; gap: 8px; align-items: center;">
                              <a href="${getFileDownloadUrl(file)}" download="${file.name}" target="_blank" class="ios-btn" style="background: #DCFCE7; color: #15803D; border: 1.5px solid #86EFAC; font-size: 11.5px; font-weight: 800; padding: 5px 12px; border-radius: 8px; text-decoration: none;">
                                <i class="fas fa-download"></i> Download
                              </a>
                              <button type="button" class="ios-btn" style="background: #FEE2E2; color: #DC2626; border: 1.5px solid #FCA5A5; font-size: 11px; font-weight: 800; padding: 5px 9px; border-radius: 8px;" title="Delete this file" onclick="handleDeleteFileFromFolder('${fld.id}', '${file.id}')">
                                <i class="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `}
                </div>

                <!-- Upload New File to this Specific Folder -->
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap; background: #FFF; border: 1.5px dashed #CBD5E1; padding: 10px 14px; border-radius: 10px;">
                  <span style="font-size: 12px; font-weight: 800; color: #1E293B;">
                    <i class="fas fa-cloud-upload-alt" style="color: #16A34A;"></i> Add File to this Folder (All Formats Supported):
                  </span>
                  <input type="file" id="folder-upload-input-${fld.id}" class="ios-input" accept="*/*" style="width: auto; padding: 7px 12px; font-size: 12px; font-weight: 700;" />
                  <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #10B981 0%, #047857 100%); color: #FFF; font-size: 12.5px; font-weight: 800; padding: 8px 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);" onclick="handleUploadFileToFolder('${fld.id}')">
                    <i class="fas fa-plus"></i> Upload File into "${fld.title}"
                  </button>
                </div>

              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>

    <!-- 14 Departments Yearwise Submission Tracker -->
    <div class="ios-card">
      <div class="ios-card-header">
        <h3 style="font-size: 17px; font-weight: 800; color: #0F172A;"><i class="fas fa-th" style="color: var(--ios-primary);"></i> 14 Departments Yearwise Excel Tracker (2023 - 2027)</h3>
      </div>
      <div class="ios-card-body">
        <div class="ios-table-container">
          <table class="ios-table">
            <thead>
              <tr>
                <th>Department / Branch</th>
                <th>AY 2023-24</th>
                <th>AY 2024-25</th>
                <th>AY 2025-26</th>
                <th>AY 2026-27</th>
              </tr>
            </thead>
            <tbody>
              ${state.departments.map(d => {
                return `
                  <tr>
                    <td>
                      <strong style="color: #0F172A;">${d.name}</strong> (${d.code})<br>
                      <span style="font-size: 11.5px; font-weight: 600; color: #475569;">Coord: ${d.coordinator} | HOD: ${d.hod}</span>
                    </td>
                    ${state.academicYears.map(yr => {
                      const rec = state.yearwiseRecords.find(r => r.departmentId === d.id && r.academicYear === yr);
                      return `
                        <td>
                          ${rec?.excelFile ? `
                            <a href="${getFileDownloadUrl(rec.excelFile)}" target="_blank" class="ios-btn" style="background: #DCFCE7; color: #15803D; border: 1.5px solid #86EFAC; font-size: 11px; font-weight: 800; padding: 4px 9px; border-radius: 8px; text-decoration: none;">
                              <i class="fas fa-file-excel" style="color:#16A34A;"></i> ${rec.status === 'approved_by_hod' ? 'Approved' : 'Submitted'}
                            </a>
                          ` : '<span style="color:#94A3B8; font-size:12px; font-weight:700;">Pending</span>'}
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// Coordinator Format Folders Modal
window.openFormatFoldersModal = function() {
  const modalOverlay = document.getElementById('workflow-modal-overlay');
  const modalBody = document.getElementById('workflow-modal-body');
  if (!modalOverlay || !modalBody) return;

  const folders = state.formatFolders || [];

  modalBody.innerHTML = `
    <div style="padding: 10px 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 2px solid #E2E8F0; padding-bottom: 12px;">
        <h3 style="font-size: 18px; font-weight: 800; color: #0F172A; margin: 0; display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-folder-open" style="color: #D97706;"></i>
          <span>Institutional Format Folders (${folders.length})</span>
        </h3>
        <button class="ios-btn" style="background: #F1F5F9; color: #0F172A; font-weight: 800; padding: 6px 12px; border-radius: 8px; border: 1.5px solid #CBD5E1;" onclick="closeModal()">
          <i class="fas fa-times"></i> Close
        </button>
      </div>

      <p style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 16px;">
        Browse through official NAAC Criteria & Institutional format templates uploaded by IQAC Admin. Select any folder below to download:
      </p>

      <div style="display: grid; gap: 14px; max-height: 60vh; overflow-y: auto; padding-right: 4px;">
        ${folders.length === 0 ? `
          <div style="background: #F8FAFC; border: 2px dashed #CBD5E1; border-radius: 14px; padding: 28px; text-align: center; color: #64748B;">
            <i class="fas fa-folder-open" style="font-size: 32px; color: #94A3B8; margin-bottom: 10px; display: block;"></i>
            <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 4px;">No Format Folders Published Yet</div>
            <div style="font-size: 12px; font-weight: 600; color: #64748B;">Admin IQAC has not created any format folders yet. When Admin publishes folders, they will appear here for download.</div>
          </div>
        ` : folders.map(fld => `
          <div style="background: #FFFFFF; border: 2px solid #CBD5E1; border-left: 5px solid #D97706; border-radius: 14px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-folder" style="font-size: 24px; color: #F59E0B;"></i>
                <div>
                  <div style="font-size: 15px; font-weight: 800; color: #0F172A;">${fld.title}</div>
                  <div style="font-size: 11.5px; font-weight: 600; color: #64748B;">${fld.description || 'Institutional NAAC Format Folder'}</div>
                </div>
              </div>
              <span class="ios-status-tag" style="background: #EFF6FF; color: #1E40AF; border: 1.5px solid #93C5FD; font-size: 11px; font-weight: 800;">
                <i class="fas fa-file-alt"></i> ${(fld.files || []).length} Files
              </span>
            </div>

            <!-- Files inside folder -->
            <div style="margin-top: 12px; background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 10px 12px;">
              ${(!fld.files || fld.files.length === 0) ? `
                <div style="font-size: 12px; color: #94A3B8; font-style: italic;">No format files in this folder yet.</div>
              ` : `
                <div style="display: grid; gap: 8px;">
                  ${fld.files.map(file => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #FFF; border: 1.5px solid #CBD5E1; padding: 8px 14px; border-radius: 8px;">
                      <span style="font-size: 13px; font-weight: 700; color: #0F172A; display: flex; align-items: center; gap: 8px;">
                        <i class="fas ${file.name.endsWith('.pdf') ? 'fa-file-pdf' : (file.name.match(/\.(xlsx?|csv)$/) ? 'fa-file-excel' : 'fa-file-word')}" style="color: ${file.name.endsWith('.pdf') ? '#DC2626' : '#16A34A'}; font-size: 16px;"></i>
                        ${file.name} <span style="font-size: 11.5px; color: #64748B; font-weight: 600;">(${file.size || 'Format'})</span>
                      </span>
                      <a href="${getFileDownloadUrl(file)}" download="${file.name}" target="_blank" class="ios-btn" style="background: linear-gradient(135deg, #10B981 0%, #047857 100%); color: #FFF; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 8px; text-decoration: none;">
                        <i class="fas fa-download"></i> Download
                      </a>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  modalOverlay.style.display = 'flex';
};

// Admin Folder Handlers
window.handleCreateFormatFolder = async function() {
  const titleInput = document.getElementById('new-folder-title-input');
  const descInput = document.getElementById('new-folder-desc-input');
  const title = titleInput?.value.trim();
  const description = descInput?.value.trim();

  if (!title) {
    showToast('Please enter a folder title (e.g. Criteria 1 Formats)', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/format-folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    }).then(r => r.json());

    if (res.success) {
      showToast(`Format folder "${title}" created successfully!`, 'success');
      titleInput.value = '';
      if (descInput) descInput.value = '';
      await loadInitialData();
      renderActiveView();
    } else {
      showToast('Unable to create format folder. Please try again.', 'error');
    }
  } catch (err) {
    console.debug('Folder create notice:', err);
    showToast('Unable to create format folder.', 'error');
  }
};

window.handleDeleteFormatFolder = async function(folderId) {
  const fld = (state.formatFolders || []).find(f => f.id === folderId);
  const folderTitle = fld ? fld.title : 'this folder';

  window.showConfirmDialog({
    title: `Delete "${folderTitle}"?`,
    message: `Are you sure you want to delete format folder "${folderTitle}"? This will permanently remove the folder and any associated coordinator submissions across all 14 departments.`,
    confirmText: 'Yes, Delete Folder',
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/format-folders/${folderId}`, {
          method: 'DELETE'
        }).then(r => r.json());

        if (res.success) {
          showToast(`Folder "${folderTitle}" deleted successfully.`, 'info');
          state.selectedAdminFormatFolder = null;
          await loadInitialData();
          renderActiveView();
        } else {
          showToast(res.error || 'Unable to delete folder.', 'error');
        }
      } catch (err) {
        console.debug('Folder delete notice:', err);
        showToast('Unable to delete folder.', 'error');
      }
    }
  });
};

window.openEditFolderModal = function(folderId) {
  const fld = (state.formatFolders || []).find(f => f.id === folderId);
  if (!fld) {
    showToast('Folder not found.', 'error');
    return;
  }

  const overlay = document.getElementById('workflow-modal-overlay');
  const content = document.getElementById('workflow-modal-content');
  if (!overlay || !content) return;

  content.innerHTML = `
    <div style="padding: 22px 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center; font-size: 18px;">
            <i class="fas fa-edit"></i>
          </div>
          <div>
            <h3 style="font-size: 17px; font-weight: 800; color: #0F172A; margin: 0;">Edit Folder Name & Details</h3>
            <span style="font-size: 12px; font-weight: 600; color: #64748B;">Changes will reflect immediately across all 14 departments</span>
          </div>
        </div>
        <button type="button" class="ios-btn" style="background: #F1F5F9; color: #475569; font-weight: 800; padding: 6px 12px; border-radius: 8px;" onclick="window.closeModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form onsubmit="handleSaveEditedFolder('${fld.id}', event)">
        <div class="ios-form-group" style="margin-bottom: 16px;">
          <label class="ios-label" style="font-size: 12px; font-weight: 800; color: #1E293B;">Folder Name / Title <span style="color:#DC2626;">*</span></label>
          <input type="text" id="edit-folder-title-input" class="ios-input" value="${(fld.title || '').replace(/"/g, '&quot;')}" required style="padding: 10px 14px; font-size: 14px; font-weight: 700;" />
        </div>

        <div class="ios-form-group" style="margin-bottom: 22px;">
          <label class="ios-label" style="font-size: 12px; font-weight: 800; color: #1E293B;">Description / Instructions</label>
          <textarea id="edit-folder-desc-input" class="ios-input" rows="3" style="padding: 10px 14px; font-size: 13px; font-weight: 600; resize: vertical;">${fld.description || ''}</textarea>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="ios-btn" style="background: #F1F5F9; color: #334155; font-size: 13px; font-weight: 800; padding: 10px 20px; border-radius: 9px;" onclick="window.closeModal()">
            Cancel
          </button>
          <button type="submit" class="ios-btn" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFF; font-size: 13px; font-weight: 800; padding: 10px 24px; border-radius: 9px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);">
            <i class="fas fa-save" style="margin-right: 6px;"></i> Save Folder Name
          </button>
        </div>
      </form>
    </div>
  `;
  overlay.style.display = 'flex';
  setTimeout(() => document.getElementById('edit-folder-title-input')?.focus(), 50);
};

window.handleSaveEditedFolder = async function(folderId, event) {
  if (event) event.preventDefault();
  const title = document.getElementById('edit-folder-title-input')?.value?.trim();
  const description = document.getElementById('edit-folder-desc-input')?.value?.trim() || '';

  if (!title) {
    showToast('Folder title cannot be empty.', 'warning');
    return;
  }

  try {
    const res = await fetch(`/api/format-folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    }).then(r => r.json());

    if (res.success) {
      window.closeModal();
      showToast(`Folder renamed to "${title}" successfully!`, 'success');
      await loadInitialData();
      renderActiveView();
    } else {
      showToast(res.error || 'Failed to update folder.', 'error');
    }
  } catch (err) {
    console.debug('Update folder error:', err);
    showToast('Failed to update folder.', 'error');
  }
};

window.handleUploadFileToFolder = async function(folderId) {
  const fileInput = document.getElementById(`folder-upload-input-${folderId}`);
  if (!fileInput || !fileInput.files.length) {
    showToast('Please select a file to upload into this folder.', 'warning');
    return;
  }

  const file = fileInput.files[0];

  try {
    const uploadRes = await window.uploadFileWithLiveProgress(file);
    if (!uploadRes || !uploadRes.success) {
      window.updateUploadProgress({ isError: true, errorText: uploadRes?.error || 'File upload failed. Please retry.' });
      showToast('File upload failed. Please try again.', 'error');
      return;
    }

    window.updateUploadProgress({ percent: 96, statusText: 'Attaching template to format folder...' });

    const payload = {
      name: file.name,
      url: uploadRes.file.url,
      size: uploadRes.file.size,
      type: file.type
    };

    const addRes = await fetch(`/api/format-folders/${folderId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json());

    if (addRes.success) {
      window.updateUploadProgress({ isDone: true });
      setTimeout(() => {
        window.closeUploadProgress();
      }, 700);
      showToast(`File "${file.name}" added to folder successfully!`, 'success');
      fileInput.value = '';
      await loadInitialData();
      renderActiveView();
    } else {
      window.updateUploadProgress({ isError: true, errorText: addRes.error || 'Unable to save file to folder.' });
      showToast('Unable to save file to folder.', 'error');
    }
  } catch (err) {
    console.debug('File upload notice:', err);
    window.updateUploadProgress({ isError: true, errorText: err.message || 'Unable to upload file to folder.' });
    showToast('Unable to upload file to folder.', 'error');
  }
};

window.handleDeleteFileFromFolder = async function(folderId, fileId) {
  window.showConfirmDialog({
    title: 'Delete Format File?',
    message: 'Are you sure you want to delete this template file from the folder?',
    confirmText: 'Yes, Delete File',
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/format-folders/${folderId}/files/${fileId}`, {
          method: 'DELETE'
        }).then(r => r.json());

        if (res.success) {
          showToast('Format file deleted.', 'info');
          await loadInitialData();
          renderActiveView();
        } else {
          showToast(res.error || 'Unable to delete file.', 'error');
        }
      } catch (err) {
        console.debug('Delete file notice:', err);
        showToast('Unable to delete file.', 'error');
      }
    }
  });
};

// ==========================================================================
// 3B. ADMIN REGISTERED USERS DIRECTORY (Who has registered)
// ==========================================================================
async function renderAdminRegisteredUsers(container) {
  // Fetch fresh users from server
  try {
    const freshUsers = await fetch('/api/users').then(r => r.json());
    if (Array.isArray(freshUsers)) state.allUsers = freshUsers;
  } catch (e) {}

  const users = state.allUsers || [];
  const coords = users.filter(u => u.role === 'dept_coordinator');
  const hods = users.filter(u => u.role === 'hod');
  const tpos = users.filter(u => u.role === 'tpo');
  const executives = users.filter(u => ['admin_coordinator', 'principal', 'president'].includes(u.role));

  container.innerHTML = `
    <!-- Top Action Card: User Overview & Stats -->
    <div class="ios-card" style="margin-bottom: 20px;">
      <div class="ios-card-header">
        <div>
          <h3 style="font-size: 18px; font-weight: 800; color: #0F172A;">
            <i class="fas fa-users-cog" style="color: var(--ios-primary); margin-right: 8px;"></i>
            Institutional Registered Users & Access Directory
          </h3>
          <p style="font-size: 12.5px; font-weight: 700; color: #475569; margin-top: 4px;">
            Full administrative overview of all coordinators & HODs who have registered on the portal.
          </p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <span class="ios-status-tag" style="background: #DCFCE7; color: #166534; border: 1.5px solid #86EFAC; font-size: 12px; font-weight: 800; padding: 5px 12px;">
            <i class="fas fa-user-check"></i> Total Registered: ${users.length}
          </span>
          <span class="ios-status-tag" style="background: #E0E7FF; color: #3730A3; border: 1.5px solid #A5B4FC; font-size: 12px; font-weight: 800; padding: 5px 12px;">
            <i class="fas fa-user-tag"></i> Coordinators: ${coords.length}
          </span>
          <span class="ios-status-tag" style="background: #FEE2E2; color: #991B1B; border: 1.5px solid #FCA5A5; font-size: 12px; font-weight: 800; padding: 5px 12px;">
            <i class="fas fa-user-tie"></i> HODs: ${hods.length}
          </span>
        </div>
      </div>

      <div class="ios-card-body" style="padding-top: 14px;">
        <!-- Search & Filter Controls -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 18px;">
          <div style="display: flex; align-items: center; gap: 10px; flex: 1; max-width: 440px;">
            <div class="input-icon-wrapper" style="width: 100%;">
              <i class="fas fa-search input-icon-left" style="font-size: 13px; left: 11px;"></i>
              <input type="text" id="user-search-input" class="ios-input has-icon-left" placeholder="Search by name, username, department..." oninput="filterRegisteredUsersTable()" style="padding: 8px 10px 8px 32px; font-size: 12.5px; height: 36px; border-radius: 10px;" />
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <select id="user-role-filter" class="ios-input" onchange="filterRegisteredUsersTable()" style="height: 36px; font-size: 12px; font-weight: 800; border-radius: 10px; padding: 4px 10px;">
              <option value="all">All Roles (${users.length})</option>
              <option value="dept_coordinator">Department Coordinators (${coords.length})</option>
              <option value="hod">Head of Departments (${hods.length})</option>
              <option value="tpo">Training & Placement Officers (${tpos.length})</option>
              <option value="exec">College Leadership (${executives.length})</option>
            </select>
          </div>
        </div>

        <!-- Users Table -->
        <div class="ios-table-container">
          <table class="ios-table" id="registered-users-table">
            <thead>
              <tr>
                <th style="width: 45px;">#</th>
                <th>User / Faculty Member</th>
                <th>Username / ID</th>
                <th>Assigned Role</th>
                <th>Department</th>
                <th>Email Address</th>
                <th>Registration Date</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="registered-users-tbody">
              ${renderUsersTableRows(users)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderUsersTableRows(usersList) {
  if (!usersList || usersList.length === 0) {
    return `
      <tr>
        <td colspan="8" style="text-align: center; padding: 30px; color: #64748B; font-weight: 700;">
          <i class="fas fa-user-slash" style="font-size: 24px; margin-bottom: 8px; display: block; color: #94A3B8;"></i>
          No registered users found matching the filter criteria.
        </td>
      </tr>
    `;
  }

  return usersList.map((u, idx) => {
    const dept = (state.departments || []).find(d => d.id === u.departmentId);
    const isLeadership = ['usr-admin', 'usr-principal', 'usr-president'].includes(u.id) || ['admin', 'principal', 'president'].includes(u.username);

    let roleBadge = '';
    if (u.role === 'dept_coordinator') {
      roleBadge = `<span class="ios-status-tag" style="background: #DCFCE7; color: #166534; border: 1.5px solid #86EFAC; font-size: 11px; font-weight: 800;"><i class="fas fa-user-tag"></i> Coordinator</span>`;
    } else if (u.role === 'hod') {
      roleBadge = `<span class="ios-status-tag" style="background: #DBEAFE; color: #1E40AF; border: 1.5px solid #93C5FD; font-size: 11px; font-weight: 800;"><i class="fas fa-user-tie"></i> Head of Department</span>`;
    } else if (u.role === 'admin_coordinator') {
      roleBadge = `<span class="ios-status-tag" style="background: #F3E8FF; color: #6B21A8; border: 1.5px solid #D8B4FE; font-size: 11px; font-weight: 800;"><i class="fas fa-shield-alt"></i> IQAC Director</span>`;
    } else if (u.role === 'principal') {
      roleBadge = `<span class="ios-status-tag" style="background: #FFE4E6; color: #9F1239; border: 1.5px solid #FDA4AF; font-size: 11px; font-weight: 800;"><i class="fas fa-graduation-cap"></i> Principal</span>`;
    } else if (u.role === 'president') {
      roleBadge = `<span class="ios-status-tag" style="background: #FEF3C7; color: #92400E; border: 1.5px solid #F59E0B; font-size: 11px; font-weight: 800;"><i class="fas fa-award"></i> Hon. President</span>`;
    } else {
      roleBadge = `<span class="ios-status-tag">${u.role}</span>`;
    }

    return `
      <tr class="user-row" data-name="${(u.name || '').toLowerCase()}" data-username="${(u.username || '').toLowerCase()}" data-dept="${dept ? dept.name.toLowerCase() : ''}" data-role="${u.role}">
        <td style="font-weight: 800; color: #64748B;">${idx + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #1E293B, #334155); color: #FFF; font-weight: 800; font-size: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
              ${(u.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <strong style="color: #0F172A; font-size: 13px;">${u.name}</strong>
              <div style="font-size: 11px; color: #64748B; font-weight: 700;">${u.designation || 'Institutional User'}</div>
            </div>
          </div>
        </td>
        <td>
          <code style="font-family: var(--font-mono); font-size: 12px; background: #F1F5F9; padding: 2px 8px; border-radius: 6px; font-weight: 800; color: #0F172A; border: 1px solid #CBD5E1;">
            @${u.username}
          </code>
        </td>
        <td>${roleBadge}</td>
        <td>
          ${dept ? `
            <strong style="font-size: 12px; color: #0F172A;">${dept.name}</strong>
            <div style="font-size: 10.5px; font-weight: 800; color: #64748B;">${dept.code} • ${dept.section}</div>
          ` : `
            <span style="font-size: 11.5px; font-weight: 800; color: #64748B;">Institutional Directorate</span>
          `}
        </td>
        <td>
          <a href="mailto:${u.email}" style="font-size: 12px; font-weight: 700; color: #2563EB; text-decoration: none;">
            ${u.email || `${u.username}@gmail.com`}
          </a>
        </td>
        <td style="font-size: 12px; font-weight: 700; color: #475569;">
          ${u.registeredAt || 'Active Official'}
        </td>
        <td style="text-align: right;">
          ${isLeadership ? `
            <span class="ios-status-tag" style="background: #F1F5F9; color: #475569; font-size: 11px; font-weight: 800; border: 1px solid #CBD5E1;">
              <i class="fas fa-lock"></i> Protected
            </span>
          ` : `
            <button class="ios-btn" style="background: #FEE2E2; color: #DC2626; border: 1.5px solid #FCA5A5; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px; cursor: pointer;" onclick="handleDeleteRegisteredUser('${u.id}', '${u.name}')" title="Revoke this user account">
              <i class="fas fa-trash-alt"></i> Revoke
            </button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

window.filterRegisteredUsersTable = function() {
  const query = (document.getElementById('user-search-input')?.value || '').toLowerCase().trim();
  const roleFilter = document.getElementById('user-role-filter')?.value || 'all';
  const rows = document.querySelectorAll('#registered-users-tbody .user-row');

  rows.forEach(row => {
    const name = row.getAttribute('data-name') || '';
    const username = row.getAttribute('data-username') || '';
    const dept = row.getAttribute('data-dept') || '';
    const role = row.getAttribute('data-role') || '';

    const matchesQuery = !query || name.includes(query) || username.includes(query) || dept.includes(query);
    let matchesRole = true;
    if (roleFilter === 'exec') {
      matchesRole = ['admin_coordinator', 'principal', 'president'].includes(role);
    } else if (roleFilter !== 'all') {
      matchesRole = (role === roleFilter);
    }

    row.style.display = (matchesQuery && matchesRole) ? '' : 'none';
  });
};

window.handleDeleteRegisteredUser = async function(userId, userName) {
  window.showConfirmDialog({
    title: `Revoke User Account?`,
    message: `Are you sure you want to revoke and delete the account for "${userName}"? This cannot be undone.`,
    confirmText: 'Yes, Revoke Account',
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' }).then(r => r.json());
        if (res.success) {
          showToast(`Account for "${userName}" revoked successfully.`, 'info');
          await loadInitialData();
          renderActiveView();
        } else {
          showToast(res.error || 'Failed to revoke user account.', 'error');
        }
      } catch (err) {
        console.debug('Delete user notice:', err);
        showToast('Unable to revoke account.', 'error');
      }
    }
  });
};
// ==========================================================================
// 3B. ADMIN 14 DEPARTMENT-WISE ARCHIVE & SUBMISSION FOLDERS
// ==========================================================================
function renderAdminDepartmentFolders(container) {
  const selectedDeptId = state.selectedDeptFolder;
  const departments = state.departments || [];
  const records = state.yearwiseRecords || [];

  if (selectedDeptId) {
    const isTpoDept = selectedDeptId === 'unit-tpo';
    const dept = isTpoDept
      ? { id: 'unit-tpo', name: 'Training & Placement Cell (TPO)', code: 'TPO', section: 'Confidential Placement Cell', coordinator: 'TPO Officer', hod: 'Director IQAC (Admin)', established: 2001, intake: 0 }
      : (departments.find(d => d.id === selectedDeptId) || departments[0]);
    const deptRecords = records.filter(r => r.departmentId === dept.id);
    const folders = (state.formatFolders || []).filter(f =>
      isTpoDept
        ? (f.isTpoFolder || f.id === 'fld-tpo-permanent')
        : (!f.isTpoFolder && f.id !== 'fld-tpo-permanent')
    );
    const openFormatFolderId = state.selectedAdminFormatFolder;
    const openFld = openFormatFolderId ? folders.find(f => f.id === openFormatFolderId) : null;

    if (openFld) {
      // LEVEL 3: INSIDE FORMAT FOLDER (Template-by-template paired responses & audit workspace)
      const fld = openFld;
      const fldRec = deptRecords.find(r => 
        r.academicYear === state.selectedAcademicYear && 
        r.folderId === fld.id
      );
      const prog = window.getFolderProgress(fld, fldRec);
      const hasTemplate = fld.files && fld.files.length > 0;
      const isRejected = fldRec && fldRec.status === 'returned_for_revision';
      const isVerified = fldRec && (fldRec.status === 'iqac_verified' || fldRec.status === 'verified_by_iqac');
      const isHodApproved = fldRec && fldRec.status === 'approved_by_hod';
      const isSubmitted = fldRec && fldRec.status === 'submitted_to_hod';

      container.innerHTML = `
        <!-- Top Navigation / Breadcrumb -->
        <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 800; color: #0F172A; flex-wrap: wrap;">
            <button type="button" class="ios-btn" style="background: #0F172A; color: #FFF; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;" onclick="closeAdminFormatFolder()">
              <i class="fas fa-arrow-left"></i> Back to ${dept.code} Folders
            </button>
            <span style="color: #94A3B8;">/</span>
            <span style="color: #2563EB; font-weight: 800; cursor: pointer;" onclick="closeAdminFormatFolder()">${dept.name} (${dept.code})</span>
            <span style="color: #94A3B8;">/</span>
            <span style="color: #0F172A; font-weight: 800; display: flex; align-items: center; gap: 6px;">
              <i class="fas fa-folder-open" style="color: #D97706;"></i>
              <span>${fld.title}</span>
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="ios-status-tag" style="background: #0F172A; color: #FFF; font-weight: 800;">AY ${state.selectedAcademicYear}</span>
            ${window.renderFolderStatusBadge(fld, fldRec)}
          </div>
        </div>

        <!-- Inside Folder Workspace Card -->
        <div class="ios-card" style="margin-bottom: 0; border: 2px solid ${isRejected ? '#FCA5A5' : (isVerified || isHodApproved ? '#86EFAC' : (isSubmitted || prog.completed > 0 ? '#FCD34D' : '#CBD5E1'))}; border-left: 6px solid ${isRejected ? '#DC2626' : (isVerified ? '#059669' : (isHodApproved ? '#16A34A' : (isSubmitted || prog.completed > 0 ? '#F59E0B' : '#2563EB')))}; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
          <div class="ios-card-header" style="background: ${isRejected ? '#FEF2F2' : (isVerified ? '#ECFDF5' : (isHodApproved ? '#F0FDF4' : (isSubmitted || prog.completed > 0 ? '#FFFBEB' : '#F8FAFC')))}; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <i class="fas ${isRejected ? 'fa-undo' : (isVerified ? 'fa-folder-check' : (isHodApproved ? 'fa-check-circle' : (prog.completed > 0 ? 'fa-folder-open' : 'fa-folder')))}" style="font-size: 32px; color: ${isRejected ? '#DC2626' : (isVerified ? '#047857' : (isHodApproved ? '#16A34A' : (isSubmitted || prog.completed > 0 ? '#D97706' : '#2563EB')))};"></i>
              <div>
                <h4 style="font-size: 17px; font-weight: 800; color: #0F172A; margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span>${fld.title}</span>
                  <span style="background: #EFF6FF; color: #1E40AF; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px;">${dept.code}</span>
                </h4>
                <span style="font-size: 12.5px; font-weight: 600; color: #64748B;">${fld.description || 'Official NAAC Accreditation Format'} • Coordinator: <strong>${dept.coordinator}</strong> • Head: <strong>${dept.hod}</strong></span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${(state.currentUser?.role === 'admin_coordinator') ? `
                <button type="button" class="ios-btn" style="background: #EFF6FF; color: #1D4ED8; border: 1.5px solid #BFDBFE; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;" onclick="openEditFolderModal('${fld.id}')" title="Edit folder title & description">
                  <i class="fas fa-edit"></i> Edit Folder
                </button>
                ${!fld.isPermanent ? `
                  <button type="button" class="ios-btn" style="background: #FEE2E2; color: #DC2626; border: 1.5px solid #FCA5A5; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;" onclick="handleDeleteFormatFolder('${fld.id}')" title="Delete this format folder across all departments">
                    <i class="fas fa-trash-alt"></i> Delete Folder
                  </button>
                ` : ''}
              ` : ''}
              ${window.renderFolderStatusBadge(fld, fldRec)}
            </div>
          </div>

          <div class="ios-card-body" style="padding: 22px;">
            <!-- Revision Banner if Rejected -->
            ${isRejected ? `
              <div style="background: #FEF2F2; border: 2px solid #F87171; border-radius: 12px; padding: 14px 18px; margin-bottom: 18px;">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                  <i class="fas fa-exclamation-circle" style="font-size: 24px; color: #DC2626; margin-top: 2px;"></i>
                  <div style="flex: 1;">
                    <span style="font-size: 13.5px; font-weight: 800; color: #991B1B; text-transform: uppercase;">
                      Returned for Revision by ${fldRec.rejectedBy || 'Reviewer'} (${fldRec.rejectedAt || 'Recent'})
                    </span>
                    <div style="background: #FFF; border: 1.5px solid #FECACA; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 700; color: #7F1D1D; margin-top: 6px;">
                      "${fldRec.rejectionNotes}"
                    </div>
                    <div style="margin-top: 8px; padding: 8px 12px; background: #FFF1F2; border: 1.5px dashed #F43F5E; border-radius: 8px; font-size: 12px; font-weight: 800; color: #BE123C; display: flex; align-items: center; gap: 8px;">
                      <i class="fas fa-trash-alt" style="color: #E11D48; font-size: 14px;"></i>
                      <span>Previous response file(s) deleted upon rejection. Department Coordinator must re-upload.</span>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Folder Completion Progress Meter -->
            <div style="background: #FFF; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <span style="font-size: 13px; font-weight: 800; color: #0F172A; display: flex; align-items: center; gap: 8px;">
                  <i class="fas fa-tasks" style="color: #2563EB;"></i>
                  <span>Criteria Fulfillment Progress:</span>
                </span>
                <span style="font-size: 12.5px; font-weight: 800; color: ${prog.isComplete ? '#15803D' : (prog.completed > 0 ? '#B45309' : '#64748B')};">
                  ${prog.completed} of ${prog.total} Template(s) Completed (${prog.percent}%)
                  ${prog.isPartial ? ` • <span style="color: #DC2626;">${prog.pending} Pending</span>` : ''}
                </span>
              </div>
              <div style="height: 9px; background: #E2E8F0; border-radius: 999px; overflow: hidden;">
                <div style="width: ${prog.percent}%; height: 100%; background: ${prog.isComplete ? 'linear-gradient(90deg, #10B981, #059669)' : (prog.completed > 0 ? 'linear-gradient(90deg, #F59E0B, #D97706)' : '#CBD5E1')}; transition: width 0.3s ease;"></div>
              </div>
            </div>

            <!-- Official Templates & Department Response Pairs -->
            ${(fld.isTpoFolder && state.currentUser?.role === 'admin_coordinator') ? `
              <div style="background: #FAF5FF; border: 2px dashed #C084FC; border-radius: 12px; padding: 14px 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                  <div style="font-size: 13.5px; font-weight: 800; color: #581C87; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-cloud-upload-alt" style="color: #7E22CE;"></i>
                    <span>Upload Official Template for TPO</span>
                  </div>
                  <div style="font-size: 11.5px; color: #6B21A8; font-weight: 600; margin-top: 2px;">
                    Admin can directly add Excel, Word, or PDF templates here — TPO will immediately see and download them.
                  </div>
                </div>
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                  <input type="file" id="folder-upload-input-${fld.id}" class="ios-input" accept="*/*" style="width: auto; padding: 6px 10px; font-size: 12px; font-weight: 700; background: #FFF;" />
                  <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #7E22CE 0%, #6B21A8 100%); color: #FFF; font-size: 12px; font-weight: 800; padding: 8px 16px; border-radius: 8px;" onclick="handleUploadFileToFolder('${fld.id}')">
                    <i class="fas fa-plus"></i> Upload Template to TPO
                  </button>
                </div>
              </div>
            ` : ''}

            <div style="background: #FFF; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 18px 20px; margin-bottom: 20px;">
              <div style="font-size: 12.5px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.3px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-copy" style="color: #2563EB; font-size: 15px;"></i>
                <span>${!hasTemplate ? `Uploaded Reports (${prog.uploadedFiles ? prog.uploadedFiles.length : 0}):` : `Official Templates & Department Response Files (${fld.files ? fld.files.length : 0}):`}</span>
              </div>

              ${!hasTemplate ? `
                ${(prog.uploadedFiles && prog.uploadedFiles.length > 0) ? `
                  <div style="display: grid; gap: 10px;">
                    ${prog.uploadedFiles.map((respFile, rIdx) => {
                      const fIcon = window.getFileIconInfo(respFile.name);
                      return `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: #F0FDF4; border: 1.5px solid #86EFAC; border-left: 4px solid #16A34A; border-radius: 10px; padding: 12px 16px; flex-wrap: wrap; gap: 10px;">
                          <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas ${fIcon.icon}" style="color: ${fIcon.color}; font-size: 22px;"></i>
                            <div>
                              <div style="font-size: 13.5px; font-weight: 800; color: #0F172A;">
                                <span style="color: #16A34A;">#${rIdx + 1}</span> ${respFile.name}
                                <span style="font-size: 11px; font-weight: 600; color: #64748B;">(${respFile.size || 'Document'})</span>
                              </div>
                              <div style="font-size: 11.5px; color: #475569; font-weight: 600; margin-top: 2px;">
                                Uploaded: ${respFile.uploadDate || 'Recent'} by <strong>${respFile.author || fldRec?.author || dept.coordinator}</strong>
                              </div>
                            </div>
                          </div>
                          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                            <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFF; font-size: 12px; font-weight: 900; padding: 7px 14px; border-radius: 8px; box-shadow: 0 3px 8px rgba(37, 99, 235, 0.3);" onclick="openFileViewer('${encodeURIComponent(JSON.stringify(respFile))}', '${dept.code} Report: ${respFile.name}')">
                              <i class="fas fa-eye"></i> View Report
                            </button>
                            <a href="${getFileDownloadUrl(respFile)}" download="${respFile.name}" target="_blank" class="ios-btn" style="background: #16A34A; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 7px 14px; border-radius: 8px; text-decoration: none;">
                              <i class="fas fa-download"></i> Download
                            </a>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : `
                  <div style="background: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: 8px; padding: 14px; font-size: 13px; color: #64748B; font-weight: 600;">
                    <i class="fas fa-clock" style="color: #D97706; margin-right: 6px;"></i> No reports submitted yet by ${dept.code} for AY ${state.selectedAcademicYear}.
                  </div>
                `}
              ` : `
                <div style="display: grid; gap: 14px;">
                  ${fld.files.map((file, fileIdx) => {
                    const respFile = prog.uploadedFiles.find(uf => 
                      uf.templateFileId === file.id || 
                      (!uf.templateFileId && fileIdx === 0)
                    );
                    const hasResp = !!respFile;

                    return `
                      <div style="border: 1.5px solid ${hasResp ? '#86EFAC' : '#CBD5E1'}; border-radius: 12px; overflow: hidden; background: #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                        <!-- Official Template Strip -->
                        <div style="display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; padding: 12px 16px; border-bottom: 1.5px solid ${hasResp ? '#BBF7D0' : '#E2E8F0'}; flex-wrap: wrap; gap: 10px;">
                          <span style="font-size: 13.5px; font-weight: 700; color: #0F172A; display: flex; align-items: center; gap: 10px;">
                            <i class="fas ${file.name.endsWith('.pdf') ? 'fa-file-pdf' : (file.name.match(/\.(xlsx?|csv)$/) ? 'fa-file-excel' : 'fa-file-word')}" style="color: ${file.name.endsWith('.pdf') ? '#DC2626' : '#16A34A'}; font-size: 20px;"></i>
                            <span>Template ${fileIdx + 1}: ${file.name}</span>
                            <span style="font-size: 11.5px; color: #64748B; font-weight: 600;">(${file.size || 'Official Template'})</span>
                          </span>
                          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                            <button type="button" class="ios-btn" style="background: #EFF6FF; border: 1.5px solid #BFDBFE; color: #1D4ED8; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 5px;" onclick="openFileViewer('${encodeURIComponent(JSON.stringify(file))}', 'Official Template: ${file.name}')" title="View template spreadsheet directly in browser">
                              <i class="fas fa-eye"></i> View Template
                            </button>
                            <a href="${getFileDownloadUrl(file)}" download="${file.name}" target="_blank" class="ios-btn" style="background: #FFF; border: 1.5px solid #CBD5E1; color: #0F172A; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                              <i class="fas fa-download"></i> Download
                            </a>
                          </div>
                        </div>

                        <!-- Paired Department Response Strip -->
                        ${hasResp ? `
                          <div style="display: flex; justify-content: space-between; align-items: center; background: #F0FDF4; padding: 12px 16px; flex-wrap: wrap; gap: 10px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                              <i class="fas fa-check-circle" style="color: #16A34A; font-size: 20px;"></i>
                              <div>
                                <div style="font-size: 13px; font-weight: 800; color: #15803D; display: flex; align-items: center; gap: 6px;">
                                  <span>✓ Department Response: ${respFile.name}</span>
                                  <span style="font-size: 11px; font-weight: 600; color: #64748B;">(${respFile.size})</span>
                                </div>
                                <div style="font-size: 11px; color: #64748B; font-weight: 600;">Uploaded: ${respFile.uploadDate || 'Recent'} by ${respFile.author || fldRec.author || dept.coordinator}</div>
                              </div>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                              <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFF; font-size: 12px; font-weight: 900; padding: 7px 16px; border-radius: 8px; box-shadow: 0 3px 8px rgba(37, 99, 235, 0.3); display: inline-flex; align-items: center; gap: 6px;" onclick="openFileViewer('${encodeURIComponent(JSON.stringify(respFile))}', '${dept.code} Response: ${respFile.name}')" title="View submitted response directly in browser">
                                <i class="fas fa-eye"></i> View Response
                              </button>
                              <a href="${getFileDownloadUrl(respFile)}" download="${respFile.name}" target="_blank" class="ios-btn" style="background: #16A34A; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                                <i class="fas fa-download"></i> Download
                              </a>
                              ${fldRec ? `
                                <button type="button" class="ios-btn" style="background: #1E293B; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 14px; border-radius: 8px; display: inline-flex; align-items: center; gap: 5px;" onclick="openAdminYearInspectModal('${fldRec.id}')">
                                  <i class="fas fa-search-plus"></i> Audit & Verify
                                </button>
                                <button type="button" class="ios-btn" style="background: #FEE2E2; color: #DC2626; border: 1.5px solid #FCA5A5; font-size: 11px; font-weight: 800; padding: 6px 10px; border-radius: 8px; display: inline-flex; align-items: center; gap: 5px;" onclick="handleAdminDeleteResponseFile('${fldRec.id}', '${encodeURIComponent(respFile.name)}', '${fld.id}', '${respFile.templateFileId || ''}')" title="Delete ONLY this response file (Keeps template safe)">
                                  <i class="fas fa-trash-alt"></i> Delete Response Only
                                </button>
                              ` : ''}
                            </div>
                          </div>
                        ` : (isRejected ? `
                          <div style="display: flex; justify-content: space-between; align-items: center; background: #FFF1F2; padding: 12px 16px; flex-wrap: wrap; gap: 10px; border-top: 1.5px dashed #FDA4AF;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                              <i class="fas fa-trash-alt" style="color: #E11D48; font-size: 20px;"></i>
                              <div>
                                <div style="font-size: 13px; font-weight: 800; color: #9F1239;">Response File Automatically Deleted Upon Rejection</div>
                                <div style="font-size: 11px; color: #BE123C; font-weight: 600;">The official template above is 100% safe. Coordinator will re-upload revised file.</div>
                              </div>
                            </div>
                            <span class="ios-status-tag" style="background: #FFE4E6; color: #E11D48; border: 1.5px solid #FDA4AF; font-size: 11.5px; font-weight: 800;">
                              <i class="fas fa-undo"></i> Awaiting Re-Upload
                            </span>
                          </div>
                        ` : `
                          <div style="display: flex; justify-content: space-between; align-items: center; background: #FFFBEB; padding: 12px 16px; flex-wrap: wrap; gap: 10px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                              <i class="fas fa-clock" style="color: #D97706; font-size: 20px;"></i>
                              <div>
                                <div style="font-size: 13px; font-weight: 800; color: #92400E;">○ Response Pending from ${dept.coordinator}</div>
                                <div style="font-size: 11px; color: #B45309; font-weight: 600;">Department has not yet uploaded response file for this template slot.</div>
                              </div>
                            </div>
                            <span class="ios-status-tag" style="background: #FEF3C7; color: #92400E; border: 1.5px solid #FCD34D; font-size: 11.5px; font-weight: 800;">
                              Pending Coordinator
                            </span>
                          </div>
                        `)}
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>

            <!-- Remarks & Review Notes -->
            ${fldRec && (fldRec.coordinatorRemarks || fldRec.hodRemarks) ? `
              <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; display: grid; gap: 10px;">
                ${fldRec.coordinatorRemarks ? `
                  <div style="font-size: 12.5px; color: #334155;">
                    <strong style="color: #0F172A;"><i class="fas fa-user-edit" style="color: #2563EB;"></i> Coordinator Remarks (${fldRec.author || dept.coordinator}):</strong>
                    <div style="margin-top: 4px; padding: 8px 12px; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; font-size: 13px; font-weight: 600; color: #1E40AF;">
                      "${fldRec.coordinatorRemarks}"
                    </div>
                  </div>
                ` : ''}
                ${fldRec.hodRemarks ? `
                  <div style="font-size: 12.5px; color: #15803D;">
                    <strong style="color: #14532D;"><i class="fas fa-user-tie" style="color: #881337;"></i> HOD Review Note (${fldRec.hodApprovedAt || 'Recorded'}):</strong>
                    <div style="margin-top: 4px; padding: 8px 12px; background: #DCFCE7; border: 1px solid #86EFAC; border-radius: 8px; font-size: 13px; font-weight: 600; color: #15803D;">
                      "${fldRec.hodRemarks}"
                    </div>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- IQAC Central Directorate Verification & Audit Action Bar -->
            <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 18px 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                <div style="font-size: 13.5px; font-weight: 800; color: #0F172A; display: flex; align-items: center; gap: 8px;">
                  <i class="fas fa-shield-alt" style="color: #881337;"></i>
                  <span>IQAC Central Directorate Audit & Verification</span>
                </div>
                <div>
                  ${window.renderFolderStatusBadge(fld, fldRec)}
                </div>
              </div>

              ${fldRec ? `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-top: 1.5px solid #E2E8F0; padding-top: 14px;">
                  <button type="button" class="ios-btn" style="background: #DC2626; color: #FFF; font-size: 12.5px; font-weight: 800; padding: 8px 16px; border-radius: 8px; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);" onclick="openRejectNotesModal('${fldRec.id}', 'yearwise')">
                    <i class="fas fa-undo"></i> Reject with Notes
                  </button>

                  <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button type="button" class="ios-btn" style="background: #1E293B; color: #FFF; font-size: 12.5px; font-weight: 800; padding: 8px 16px; border-radius: 8px;" onclick="openAdminYearInspectModal('${fldRec.id}')">
                      <i class="fas fa-search-plus"></i> Audit in Scrutiny Inspector
                    </button>
                    ${!isVerified ? `
                      <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFF; font-size: 12.5px; font-weight: 800; padding: 8px 18px; border-radius: 8px; box-shadow: 0 3px 10px rgba(16, 185, 129, 0.3);" onclick="quickGrantIQACVerification('${fldRec.id}')">
                        <i class="fas fa-check-circle"></i> Grant Official IQAC Verification
                      </button>
                    ` : `
                      <span class="ios-status-tag" style="background: #DCFCE7; color: #15803D; border: 1.5px solid #86EFAC; font-size: 12.5px; font-weight: 800; padding: 6px 14px;">
                        <i class="fas fa-check-double"></i> Verified by IQAC Central Directorate
                      </span>
                    `}
                  </div>
                </div>
              ` : `
                <div style="color: #64748B; font-size: 13px; font-weight: 600; padding: 8px 0;">
                  <i class="fas fa-info-circle" style="color: #3B82F6;"></i> No responses submitted by ${dept.coordinator} for this folder in AY ${state.selectedAcademicYear} yet.
                </div>
              `}
            </div>

          </div>
        </div>
      `;
      return;
    }

    // LEVEL 2: DEPARTMENT'S FORMAT FOLDERS GRID (AY Tabs + Format Folders Grid)
    const activeYearsCount = state.academicYears.filter(yr => 
      deptRecords.some(r => r.academicYear === yr && (r.excelFile || (r.uploadedFiles && r.uploadedFiles.length > 0)))
    ).length;

    container.innerHTML = `
      <!-- Breadcrumb Navigation Bar -->
      <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 800; color: #0F172A;">
          <button type="button" class="ios-btn" style="background: #0F172A; color: #FFF; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;" onclick="closeDepartmentFolder()">
            <i class="fas fa-arrow-left"></i> All 14 Department Folders
          </button>
          <span style="color: #94A3B8;">/</span>
          <span style="color: #2563EB; display: flex; align-items: center; gap: 6px;">
            <i class="fas fa-folder-open" style="color: #F59E0B;"></i>
            <span>${dept.name} (${dept.code})</span>
          </span>
        </div>
        <span class="ios-status-tag" style="background: #EFF6FF; color: #1E40AF; border: 1.5px solid #93C5FD; font-size: 12px; font-weight: 800;">
          ${activeYearsCount} / ${state.academicYears.length} Academic Years Active
        </span>
      </div>

      <!-- Department Info Header -->
      <div class="ios-card" style="border: 2px solid #CBD5E1; margin-bottom: 24px;">
        <div class="ios-card-body" style="padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; letter-spacing: 0.5px;">Department Accreditation Archive</div>
            <h2 style="font-size: 22px; font-weight: 900; color: #0F172A; margin: 4px 0;">${dept.name}</h2>
            <div style="font-size: 13px; font-weight: 700; color: #334155; margin-top: 4px;">
              <span><strong>Code:</strong> ${dept.code}</span> • 
              <span><strong>Section:</strong> ${dept.section}</span> • 
              <span><strong>Intake:</strong> ${dept.intake || '60'}</span> • 
              <span><strong>Established:</strong> ${dept.established || '2001'}</span>
            </div>
            <div style="font-size: 12.5px; font-weight: 700; color: #475569; margin-top: 6px;">
              <i class="fas fa-user-edit" style="color: #2563EB;"></i> Coordinator: <strong>${dept.coordinator}</strong> &nbsp;|&nbsp; 
              <i class="fas fa-user-tie" style="color: #881337;"></i> Head: <strong>${dept.hod}</strong>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="ios-btn" style="background: #2563EB; color: #FFF; font-size: 12.5px; font-weight: 800; padding: 8px 16px; border-radius: 8px;" onclick="switchNavTab('admin-overview', event)">
              <i class="fas fa-th"></i> View Matrix Table
            </button>
          </div>
        </div>
      </div>

      <!-- Academic Year Switcher Bar -->
      <div style="background: #FFFFFF; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-calendar-alt" style="color: #2563EB; font-size: 18px;"></i>
          <span style="font-size: 13.5px; font-weight: 800; color: #0F172A;">Select Academic Year:</span>
        </div>
        <div class="ios-segmented-control" style="max-width: 100%; overflow-x: auto;">
          ${state.academicYears.map(yr => {
            const isActive = yr === state.selectedAcademicYear;
            const yrRecs = deptRecords.filter(r => r.academicYear === yr && (r.excelFile || (r.uploadedFiles && r.uploadedFiles.length > 0)));
            const yrFilesCount = yrRecs.reduce((acc, r) => acc + ((r.uploadedFiles && r.uploadedFiles.length) ? r.uploadedFiles.length : 1), 0);
            return `
              <button class="ios-segment-btn ${isActive ? 'active' : ''}" style="padding: 8px 16px; font-size: 12.5px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;" onclick="selectAcademicYearTab('${yr}')">
                <span>AY ${yr}</span>
                ${yrFilesCount > 0 ? `<span style="background: ${isActive ? '#FFF' : '#DCFCE7'}; color: ${isActive ? '#15803D' : '#15803D'}; font-size: 10.5px; font-weight: 900; padding: 1px 6px; border-radius: 999px;">${yrFilesCount}</span>` : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Mandatory Template Guidance Box -->
      <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 2px solid #93C5FD; border-radius: 14px; padding: 14px 20px; margin-bottom: 22px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.06);">
        <i class="fas fa-folder-tree" style="font-size: 28px; color: #2563EB;"></i>
        <div>
          <div style="font-size: 14px; font-weight: 800; color: #1E40AF;">Official Template Folders for ${dept.code} (AY ${state.selectedAcademicYear})</div>
          <div style="font-size: 12.5px; font-weight: 600; color: #1E3A8A; margin-top: 2px;">
            Click any format folder below to open it, review submitted department responses, and grant official IQAC verification.
          </div>
        </div>
      </div>

      <!-- Format Folders Grid for Department -->
      ${folders.length === 0 ? `
        <div class="ios-card" style="text-align: center; padding: 36px; color: #64748B;">
          <i class="fas fa-folder-open" style="font-size: 40px; color: #CBD5E1; margin-bottom: 12px; display: block;"></i>
          <h4 style="font-size: 16px; font-weight: 800; color: #0F172A; margin-bottom: 4px;">No Template Folders Published Yet</h4>
          <p style="font-size: 13px; font-weight: 600; color: #64748B;">No criteria format folders have been created yet. Create a format folder in Master Management to release templates.</p>
        </div>
      ` : `
        <div class="responsive-folder-grid">
          ${folders.map(fld => {
            const fldRec = deptRecords.find(r => 
              r.academicYear === state.selectedAcademicYear && 
              r.folderId === fld.id
            );
            const prog = window.getFolderProgress(fld, fldRec);
            const isRejected = fldRec && fldRec.status === 'returned_for_revision';
            const isVerified = fldRec && (fldRec.status === 'iqac_verified' || fldRec.status === 'verified_by_iqac');
            const isHodApproved = fldRec && fldRec.status === 'approved_by_hod';
            const isSubmitted = fldRec && fldRec.status === 'submitted_to_hod';

            const cardClass = isRejected ? 'card-revision' : (isVerified || isHodApproved ? 'card-success' : (isSubmitted || prog.completed > 0 ? 'card-partial' : ''));
            const squircleClass = isRejected ? 'folder-squircle-red' : (isVerified || isHodApproved ? 'folder-squircle-green' : (isSubmitted || prog.completed > 0 ? 'folder-squircle-amber' : (fld.files && fld.files.length ? 'folder-squircle-blue' : 'folder-squircle-amber')));

            return `
              <div class="premium-folder-card ${cardClass}" onclick="openAdminFormatFolder('${fld.id}')">
                <div>
                  <!-- Top Row: Squircle Folder Icon + Full-Width Title & Description -->
                  <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px;">
                    <div class="folder-icon-squircle ${squircleClass}" style="flex-shrink: 0;">
                      <i class="fas ${isRejected ? 'fa-undo' : (isVerified ? 'fa-shield-alt' : (isHodApproved ? 'fa-check-circle' : (prog.completed > 0 ? 'fa-folder-open' : 'fa-folder')))}"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                      <h4 style="font-size: 16px; font-weight: 800; color: #0F172A; margin: 0 0 4px 0; letter-spacing: -0.01em; line-height: 1.3; word-break: break-word;">${fld.title}</h4>
                      <div style="font-size: 12px; font-weight: 600; color: #64748B; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${(fld.description || 'Official Format Folder').replace(/"/g, '&quot;')}">${fld.description || 'Official Format Folder'}</div>
                    </div>
                  </div>

                  <!-- Status Badge Row -->
                  <div style="margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                    ${window.renderFolderStatusBadge(fld, fldRec)}
                  </div>

                  <!-- Chips / Key Metrics Row -->
                  <div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 16px 0;">
                    ${fld.isPermanent ? `
                      <span class="folder-meta-chip" style="background: #EEF2FF; color: #4338CA; border: 1.5px solid #C7D2FE;">
                        <i class="fas fa-shield-alt"></i>
                        <span>Permanent Report Folder</span>
                      </span>
                    ` : ''}
                    ${prog.isMulti ? `
                      <span class="folder-meta-chip ${prog.uploadedFiles.length > 0 ? 'folder-meta-chip-success' : 'folder-meta-chip-neutral'}">
                        <i class="fas fa-layer-group" style="color: ${prog.uploadedFiles.length > 0 ? '#16A34A' : '#2563EB'};"></i>
                        <span><strong>${prog.uploadedFiles.length}</strong> Report(s) Uploaded</span>
                      </span>
                    ` : `
                      <span class="folder-meta-chip folder-meta-chip-neutral">
                        <i class="fas fa-file-excel" style="color: #2563EB;"></i>
                        <span><strong>${prog.total}</strong> Official Template(s)</span>
                      </span>
                      ${prog.completed === 0 ? `
                        <span class="folder-meta-chip folder-meta-chip-pending">
                          <i class="fas fa-clock"></i>
                          <span>0/${prog.total} Completed</span>
                        </span>
                      ` : (prog.isPartial ? `
                        <span class="folder-meta-chip folder-meta-chip-pending" style="background: #FEF3C7; color: #92400E; border: 1.5px solid #FCD34D;">
                          <i class="fas fa-hourglass-half"></i>
                          <span><strong>${prog.completed} of ${prog.total}</strong> Completed (${prog.pending} Pending)</span>
                        </span>
                      ` : `
                        <span class="folder-meta-chip folder-meta-chip-success">
                          <i class="fas fa-check-circle"></i>
                          <span><strong>All ${prog.total}</strong> Completed</span>
                        </span>
                      `)}
                    `}
                    ${fldRec && fldRec.coordinatorRemarks ? `
                      <span class="folder-meta-chip folder-meta-chip-neutral" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${fldRec.coordinatorRemarks}">
                        <i class="fas fa-comment-dots" style="color: #881337;"></i>
                        <span>Note: "${fldRec.coordinatorRemarks}"</span>
                      </span>
                    ` : ''}
                  </div>
                </div>

                <!-- Bottom Row: Coordinator / AY + Direct View File & Open Folder Action Button -->
                <div style="border-top: 1.5px solid #F1F5F9; padding-top: 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <div style="font-size: 11.5px; font-weight: 700; color: #64748B; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-user-edit" style="color: #2563EB;"></i>
                    <span>${dept.coordinator}</span>
                    <span>•</span>
                    <span>AY ${state.selectedAcademicYear}</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    ${(state.currentUser?.role === 'admin_coordinator') ? `
                      <button type="button" class="ios-btn" style="background: #EFF6FF; color: #1D4ED8; border: 1.5px solid #BFDBFE; font-size: 11.5px; font-weight: 800; padding: 7px 12px; border-radius: 9px; display: inline-flex; align-items: center; gap: 5px;" onclick="event.stopPropagation(); openEditFolderModal('${fld.id}')" title="Edit folder name & description">
                        <i class="fas fa-edit"></i>
                        <span>Edit</span>
                      </button>
                      ${!fld.isPermanent ? `
                        <button type="button" class="ios-btn" style="background: #FEE2E2; color: #DC2626; border: 1.5px solid #FCA5A5; font-size: 11.5px; font-weight: 800; padding: 7px 12px; border-radius: 9px; display: inline-flex; align-items: center; gap: 5px;" onclick="event.stopPropagation(); handleDeleteFormatFolder('${fld.id}')" title="Delete this format folder across all departments">
                          <i class="fas fa-trash-alt"></i>
                          <span>Delete</span>
                        </button>
                      ` : ''}
                    ` : ''}
                    ${(fldRec && fldRec.uploadedFiles && fldRec.uploadedFiles.length > 0) ? `
                      <button type="button" class="ios-btn" style="background: #EFF6FF; border: 1.5px solid #93C5FD; color: #1D4ED8; font-size: 12px; font-weight: 800; padding: 7px 14px; border-radius: 9px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(37,99,235,0.08);" onclick="event.stopPropagation(); openFileViewer('${encodeURIComponent(JSON.stringify(fldRec.uploadedFiles[0]))}', '${dept.code} Response: ${fldRec.uploadedFiles[0].name}')" title="View submitted response directly without leaving">
                        <i class="fas fa-eye" style="color: #2563EB;"></i>
                        <span>View File</span>
                      </button>
                    ` : ''}
                    <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 16px; border-radius: 9px; box-shadow: 0 3px 10px rgba(15, 23, 42, 0.2); display: inline-flex; align-items: center; gap: 6px;">
                      <span>Open Folder</span>
                      <i class="fas fa-arrow-right" style="font-size: 11px;"></i>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  } else {
    // Render 14 Department Folders Grid
    const submittedDepts = departments.filter(d => records.some(r => r.departmentId === d.id && r.excelFile));

    container.innerHTML = `
      <!-- Top Stats Banner -->
      <div class="responsive-stats-grid" style="margin-bottom: 22px;">
        <div class="ios-card" style="margin-bottom: 0; padding: 16px 20px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFF;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94A3B8;">Central Archive</div>
          <div style="font-size: 26px; font-weight: 900; color: #FFF; margin-top: 4px;">14 Department Folders</div>
          <div style="font-size: 11.5px; color: #CBD5E1; font-weight: 600; margin-top: 2px;">6 UG Branches • 6 Diploma Streams • PG</div>
        </div>
        <div class="ios-card" style="margin-bottom: 0; padding: 16px 20px; background: #F0FDF4; border: 2px solid #86EFAC;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #166534;">Active Submissions</div>
          <div style="font-size: 26px; font-weight: 900; color: #16A34A; margin-top: 4px;">${submittedDepts.length} / 14 Uploaded</div>
          <div style="font-size: 11.5px; color: #15803D; font-weight: 700; margin-top: 2px;">Departments with active criteria files</div>
        </div>
      </div>

      <!-- 14 Department Folders Card -->
      <div class="ios-card">
        <div class="ios-card-header" style="flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 800; color: #0F172A; margin: 0; display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-folder-tree" style="color: #D97706;"></i>
              <span>Department-Wise Accreditation Folders (14 Departments)</span>
            </h3>
            <span style="font-size: 12.5px; font-weight: 600; color: #64748B;">Click any department folder below to inspect criteria files and templates.</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="ios-btn" style="background: #2563EB; color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 14px; border-radius: 8px;" onclick="switchNavTab('admin-overview', event)">
              <i class="fas fa-th"></i> View Matrix Table
            </button>
          </div>
        </div>
        <div class="ios-card-body">
          ${(() => {
            const tpoRecs = records.filter(r => (r.departmentId === 'unit-tpo' || r.folderId === 'fld-tpo-permanent') && (r.excelFile || (r.uploadedFiles && r.uploadedFiles.length > 0)));
            const tpoFilesCount = tpoRecs.reduce((acc, r) => acc + ((r.uploadedFiles && r.uploadedFiles.length) ? r.uploadedFiles.length : (r.excelFile ? 1 : 0)), 0);
            const tpoFld = (state.formatFolders || []).find(f => f.isTpoFolder || f.id === 'fld-tpo-permanent');
            const tpoTplCount = tpoFld?.files ? tpoFld.files.length : 0;
            return `
              <div onclick="openDepartmentFolder('unit-tpo')" style="cursor: pointer; background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%); border: 2px solid #C084FC; border-left: 6px solid #7E22CE; border-radius: 16px; padding: 16px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 4px 14px rgba(126, 34, 206, 0.08);">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <div style="width: 48px; height: 48px; border-radius: 14px; background: #7E22CE; color: #FFF; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">
                    <i class="fas fa-briefcase"></i>
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                      <h4 style="font-size: 16px; font-weight: 800; color: #4C1D95; margin: 0;">Training & Placement Cell (TPO) — Confidential Folder</h4>
                      <span class="ios-status-tag" style="background: #FFFFFF; color: #6B21A8; border: 1.5px solid #D8B4FE; font-size: 10.5px; font-weight: 800;"><i class="fas fa-lock"></i> Admin & TPO Only</span>
                    </div>
                    <div style="font-size: 12.5px; font-weight: 600; color: #6B21A8; margin-top: 3px;">
                      <strong>${tpoTplCount}</strong> Template(s) Released by Admin • <strong>${tpoFilesCount}</strong> TPO Report(s) Uploaded
                    </div>
                  </div>
                </div>
                <button type="button" class="ios-btn" style="background: #7E22CE; color: #FFF; font-size: 12px; font-weight: 800; padding: 8px 16px; border-radius: 9px;">
                  <i class="fas fa-folder-open"></i> Open TPO Workspace
                </button>
              </div>
            `;
          })()}
          <div class="responsive-dept-grid">
            ${departments.filter(d => d.id !== 'unit-tpo').map(d => {
              const deptRecs = records.filter(r => r.departmentId === d.id && (r.excelFile || (r.uploadedFiles && r.uploadedFiles.length > 0)));
              const hasUploads = deptRecs.length > 0;
              const hasRejected = deptRecs.some(r => r.status === 'returned_for_revision' || r.status === 'rejected');
              const hasPending = deptRecs.some(r => r.status === 'submitted_to_hod');
              const allVerified = deptRecs.length > 0 && deptRecs.every(r => r.status === 'iqac_verified' || r.status === 'verified_by_iqac');
              const allHodApproved = deptRecs.length > 0 && deptRecs.every(r => r.status === 'approved_by_hod' || r.status === 'iqac_verified');
              const totalFiles = deptRecs.reduce((acc, r) => acc + ((r.uploadedFiles && r.uploadedFiles.length) ? r.uploadedFiles.length : (r.excelFile ? 1 : 0)), 0);

              let cardClass = '';
              let squircleClass = 'folder-squircle-blue';
              let badgeHtml = '<span class="ios-status-tag" style="background: #F8FAFC; color: #94A3B8; font-size: 11px; border: 1px solid #E2E8F0;">0 Submissions</span>';
              let bottomText = 'No Active Submissions';
              let bottomColor = '#94A3B8';
              let bottomIcon = 'fa-circle-notch';

              if (hasUploads) {
                if (hasRejected) {
                  cardClass = 'card-revision';
                  squircleClass = 'folder-squircle-red';
                  badgeHtml = `<span class="ios-status-tag" style="background: #FEF2F2; color: #DC2626; border: 1.5px solid #FCA5A5; font-size: 11px; font-weight: 800;"><i class="fas fa-undo"></i> Needs Revision (${deptRecs.length})</span>`;
                  bottomText = 'Returned for Revision';
                  bottomColor = '#DC2626';
                  bottomIcon = 'fa-undo';
                } else if (hasPending) {
                  cardClass = 'card-partial';
                  squircleClass = 'folder-squircle-amber';
                  badgeHtml = `<span class="ios-status-tag" style="background: #FFFBEB; color: #B45309; border: 1.5px solid #FBBF24; font-size: 11px; font-weight: 800;"><i class="fas fa-clock"></i> ${deptRecs.length} Submission(s) • ${totalFiles} File(s)</span>`;
                  bottomText = 'Awaiting Review / Scrutiny';
                  bottomColor = '#D97706';
                  bottomIcon = 'fa-clock';
                } else if (allVerified) {
                  cardClass = 'card-success';
                  squircleClass = 'folder-squircle-green';
                  badgeHtml = `<span class="ios-status-tag" style="background: #DCFCE7; color: #15803D; border: 1.5px solid #86EFAC; font-size: 11px; font-weight: 800;"><i class="fas fa-shield-alt"></i> IQAC Verified (${totalFiles} Files)</span>`;
                  bottomText = 'IQAC Verified & Approved';
                  bottomColor = '#16A34A';
                  bottomIcon = 'fa-check-double';
                } else if (allHodApproved) {
                  cardClass = 'card-success';
                  squircleClass = 'folder-squircle-green';
                  badgeHtml = `<span class="ios-status-tag" style="background: #DCFCE7; color: #15803D; border: 1.5px solid #86EFAC; font-size: 11px; font-weight: 800;"><i class="fas fa-check-circle"></i> HOD Approved (${totalFiles} Files)</span>`;
                  bottomText = 'HOD Approved';
                  bottomColor = '#16A34A';
                  bottomIcon = 'fa-check-circle';
                } else {
                  cardClass = 'card-partial';
                  squircleClass = 'folder-squircle-amber';
                  badgeHtml = `<span class="ios-status-tag" style="background: #EFF6FF; color: #1E40AF; border: 1.5px solid #93C5FD; font-size: 11px; font-weight: 800;"><i class="fas fa-edit"></i> Draft (${totalFiles} Files)</span>`;
                  bottomText = 'In Progress (Draft)';
                  bottomColor = '#2563EB';
                  bottomIcon = 'fa-edit';
                }
              }

              return `
                <div class="premium-folder-card ${cardClass}" onclick="openDepartmentFolder('${d.id}')">
                  <div>
                    <!-- Top Header: Squircle Badge + Code + Status Tag -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; gap: 10px;">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="folder-icon-squircle ${squircleClass}">
                          <i class="fas ${hasRejected ? 'fa-undo' : (allVerified ? 'fa-shield-alt' : (allHodApproved ? 'fa-check-circle' : (hasPending ? 'fa-folder-open' : 'fa-folder')))}"></i>
                        </div>
                        <div>
                          <span style="background: #1E293B; color: #FFF; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 6px; letter-spacing: 0.3px;">${d.code}</span>
                          <span style="font-size: 11.5px; color: #64748B; font-weight: 700; margin-left: 4px;">${d.section}</span>
                        </div>
                      </div>
                      <div>
                        ${badgeHtml}
                      </div>
                    </div>

                    <!-- Department Name -->
                    <h4 style="font-size: 16px; font-weight: 800; color: #0F172A; margin: 0 0 10px 0; line-height: 1.35; letter-spacing: -0.01em;">
                      ${d.name}
                    </h4>

                    <!-- Coordinator & HOD Info Chips -->
                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 9px 12px; margin-bottom: 14px; font-size: 11.5px; font-weight: 700; color: #334155; display: flex; flex-direction: column; gap: 4px;">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-user-edit" style="color: #2563EB;"></i>
                        <span>Coord: <strong>${d.coordinator}</strong></span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-user-tie" style="color: #881337;"></i>
                        <span>Head: <strong>${d.hod}</strong></span>
                      </div>
                    </div>
                  </div>

                  <!-- Bottom Row -->
                  <div style="border-top: 1.5px solid #F1F5F9; padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11.5px; font-weight: 800; color: ${bottomColor}; display: flex; align-items: center; gap: 5px;">
                      <i class="fas ${bottomIcon}"></i>
                      ${bottomText}
                    </span>
                    <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 14px; border-radius: 8px;">
                      <span>Open Folder</span>
                      <i class="fas fa-arrow-right" style="margin-left: 4px; font-size: 10px;"></i>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }
}

window.openDepartmentFolder = function(deptId) {
  state.selectedDeptFolder = deptId;
  state.selectedAdminFormatFolder = null;
  state.activeTab = 'admin-dept-folders';
  renderActiveView();
};

window.closeDepartmentFolder = function() {
  state.selectedDeptFolder = null;
  state.selectedAdminFormatFolder = null;
  state.activeTab = 'admin-dept-folders';
  renderActiveView();
};

window.openAdminFormatFolder = function(folderId) {
  state.selectedAdminFormatFolder = folderId;
  renderActiveView();
};

window.closeAdminFormatFolder = function() {
  state.selectedAdminFormatFolder = null;
  renderActiveView();
};

// ==========================================================================
// 4. ADMIN 14 DEPARTMENTS ACCREDITATION MATRIX & IQAC AUDIT DESK
// ==========================================================================
function renderAdminMatrix(container) {
  const records = state.yearwiseRecords || [];
  const submittedCount = records.filter(r => r.excelFile).length;
  const pendingCount = records.filter(r => r.status === 'submitted_to_hod').length;
  const verifiedCount = records.filter(r => r.status === 'iqac_verified' || r.status === 'approved_by_hod').length;

  container.innerHTML = `
    <!-- Top Summary Metrics Banner -->
    <div class="responsive-stats-grid" style="margin-bottom: 22px;">
      <div class="ios-card" style="margin-bottom: 0; padding: 16px 20px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFF;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94A3B8; letter-spacing: 0.5px;">Accreditation Scope</div>
        <div style="font-size: 26px; font-weight: 900; color: #FFF; margin-top: 4px;">14 Departments</div>
        <div style="font-size: 11.5px; color: #CBD5E1; font-weight: 600; margin-top: 2px;">6 UG Branches • 6 Diploma Streams • PG</div>
      </div>
      <div class="ios-card" style="margin-bottom: 0; padding: 16px 20px; background: #EFF6FF; border: 2px solid #93C5FD;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1E40AF; letter-spacing: 0.5px;">Criteria Submissions</div>
        <div style="font-size: 26px; font-weight: 900; color: #1D4ED8; margin-top: 4px;">${submittedCount} Received</div>
        <div style="font-size: 11.5px; color: #2563EB; font-weight: 700; margin-top: 2px;">Annual criteria sheets uploaded</div>
      </div>
      <div class="ios-card" style="margin-bottom: 0; padding: 16px 20px; background: #FEFCE8; border: 2px solid #FDE047;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #854D0E; letter-spacing: 0.5px;">Pending Scrutiny</div>
        <div style="font-size: 26px; font-weight: 900; color: #CA8A04; margin-top: 4px;">${pendingCount} Awaiting Review</div>
        <div style="font-size: 11.5px; color: #A16207; font-weight: 700; margin-top: 2px;">Coordinator submissions requiring audit</div>
      </div>
      <div class="ios-card" style="margin-bottom: 0; padding: 16px 20px; background: #F0FDF4; border: 2px solid #86EFAC;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #166534; letter-spacing: 0.5px;">IQAC Endorsed</div>
        <div style="font-size: 26px; font-weight: 900; color: #16A34A; margin-top: 4px;">${verifiedCount} Verified</div>
        <div style="font-size: 11.5px; color: #15803D; font-weight: 700; margin-top: 2px;">Cleared for Principal SSR consolidation</div>
      </div>
    </div>

    <!-- 14 Departments Matrix Card -->
    <div class="ios-card">
      <div class="ios-card-header" style="flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 800; color: #0F172A; margin: 0; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-th" style="color: var(--ios-primary);"></i>
            <span>14 Departments Accreditation Matrix (2023 - 2027)</span>
          </h3>
          <span style="font-size: 12.5px; font-weight: 600; color: #64748B;">Central Quality Matrix • Real-Time Cloud Synchronization</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button type="button" class="ios-btn" style="background: #2563EB; color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 14px; border-radius: 8px;" onclick="switchNavTab('admin-iqac', event)">
            <i class="fas fa-shield-alt"></i> Open IQAC Audit Desk
          </button>
        </div>
      </div>
      <div class="ios-card-body">
        <p style="font-size: 13.5px; font-weight: 600; color: #334155; margin-bottom: 20px;">
          Direct audit dashboard for all 14 Academic Departments. View uploaded criteria Excel sheets and verify annual accreditation milestones.
        </p>

        <div class="ios-table-container">
          <table class="ios-table">
            <thead>
              <tr>
                <th style="min-width: 220px;">Department & Leadership</th>
                <th style="min-width: 170px;">AY 2023-24</th>
                <th style="min-width: 170px;">AY 2024-25</th>
                <th style="min-width: 170px;">AY 2025-26</th>
                <th style="min-width: 170px;">AY 2026-27</th>
              </tr>
            </thead>
            <tbody>
              ${state.departments.map(d => {
                return `
                  <tr>
                    <td>
                      <strong style="color: #0F172A; font-size: 14px;">${d.name}</strong><br>
                      <span style="display: inline-block; background: #F1F5F9; color: #0F172A; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 6px; margin: 3px 0;">${d.code}</span>
                      <span style="font-size: 11px; color: #64748B; font-weight: 600;"> • ${d.section}</span><br>
                      <span style="font-size: 11.5px; font-weight: 700; color: #475569;">
                        <i class="fas fa-user-edit" style="color: #2563EB;"></i> Coord: ${d.coordinator}<br>
                        <i class="fas fa-user-tie" style="color: #881337;"></i> Head: ${d.hod}
                      </span>
                    </td>
                    ${state.academicYears.map(yr => {
                      const rec = records.find(r => r.departmentId === d.id && r.academicYear === yr);
                      if (rec && rec.excelFile) {
                        return `
                          <td style="background: #FAFAFA; vertical-align: top;">
                            <div style="background: #FFF; border: 1.5px solid #CBD5E1; border-radius: 10px; padding: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                ${renderIOSStatusTag(rec.status)}
                              </div>
                              <div style="font-size: 11.5px; font-weight: 700; color: #0F172A; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${rec.excelFile.name}">
                                <i class="fas fa-file-excel" style="color: #16A34A;"></i> ${rec.excelFile.name}
                              </div>
                              <div style="font-size: 10.5px; color: #64748B; font-weight: 600; margin-bottom: 8px;">
                                By: <strong>${rec.author || d.coordinator}</strong>
                              </div>
                              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                <a href="${getFileDownloadUrl(rec.excelFile)}" target="_blank" class="ios-btn" style="background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC; font-size: 10.5px; font-weight: 800; padding: 4px 8px; border-radius: 6px; text-decoration: none;" title="Download Excel Sheet">
                                  <i class="fas fa-download"></i> Excel
                                </a>
                                <button type="button" class="ios-btn" style="background: #1E293B; color: #FFF; font-size: 10.5px; font-weight: 800; padding: 4px 8px; border-radius: 6px;" onclick="openAdminYearInspectModal('${rec.id}')" title="Audit & Verify Submission">
                                  <i class="fas fa-shield-alt"></i> Audit
                                </button>
                                <button type="button" class="ios-btn" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; font-size: 10.5px; font-weight: 800; padding: 4px 8px; border-radius: 6px;" onclick="openRejectNotesModal('${rec.id}', 'yearwise')" title="Reject / Return with Notes">
                                  <i class="fas fa-times-circle"></i> Reject
                                </button>
                              </div>
                            </div>
                          </td>
                        `;
                      } else {
                        return `
                          <td style="vertical-align: middle; text-align: center; color: #94A3B8; font-size: 12px; font-weight: 700; background: #F8FAFC;">
                            <span style="display: inline-block; padding: 6px 10px; border-radius: 8px; background: #F1F5F9; color: #94A3B8;">
                              Pending
                            </span>
                          </td>
                        `;
                      }
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderAdminIQACDesk(container) {
  renderAdminDepartmentFolders(container);
}

// Admin Modal: Scrutinize & Verify Department Criteria Record
window.openAdminYearInspectModal = function(recId) {
  const rec = state.yearwiseRecords.find(r => r.id === recId);
  if (!rec) return;
  const dept = state.departments.find(d => d.id === rec.departmentId);
  const fld = (state.formatFolders || []).find(f => f.id === rec.folderId) || { title: 'Master NAAC Criteria Format', files: [] };
  const prog = window.getFolderProgress(fld, rec);

  const modalOverlay = document.getElementById('workflow-modal-overlay');
  const modalContent = document.getElementById('workflow-modal-content');

  modalContent.innerHTML = `
    <div class="ios-modal-head">
      <h3 style="font-size: 17px; font-weight: 800; color: #0F172A; margin: 0; display: flex; align-items: center; gap: 8px;">
        <i class="fas fa-shield-alt" style="color: var(--ios-primary);"></i>
        <span>IQAC Audit: ${dept?.name || rec.departmentId} - ${fld.title} (AY ${rec.academicYear})</span>
      </h3>
      <button class="ios-modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="ios-modal-body" style="padding: 20px;">
      <!-- Submission Details Box -->
      <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 14px; margin-bottom: 18px;">
        <div class="modal-two-col" style="font-size: 13px;">
          <div><strong style="color: #0F172A;">Department:</strong> ${dept?.name} (${dept?.code})</div>
          <div><strong style="color: #0F172A;">Academic Year:</strong> AY ${rec.academicYear}</div>
          <div><strong style="color: #0F172A;">Format Folder:</strong> ${fld.title}</div>
          <div><strong style="color: #0F172A;">Submitted By:</strong> ${rec.author || dept?.coordinator}</div>
          <div><strong style="color: #0F172A;">Submission Time:</strong> ${rec.coordinatorSubmittedAt || rec.createdAt || 'N/A'}</div>
          <div><strong style="color: #0F172A;">Current Status:</strong> ${window.renderFolderStatusBadge(fld, rec)}</div>
          <div><strong style="color: #0F172A;">HOD:</strong> ${dept?.hod}</div>
        </div>
        ${rec.coordinatorRemarks ? `
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #CBD5E1; font-size: 12.5px; color: #334155;">
            <strong>Coordinator Remarks:</strong> <em>"${rec.coordinatorRemarks}"</em>
          </div>
        ` : ''}
        ${rec.hodRemarks ? `
          <div style="margin-top: 6px; font-size: 12.5px; color: #15803D;">
            <strong>HOD Review Note:</strong> ${rec.hodRemarks} (${rec.hodApprovedAt || 'Recorded'})
          </div>
        ` : ''}
        ${rec.rejectionNotes ? `
          <div style="margin-top: 8px; padding: 10px 12px; background: #FEF2F2; border: 1.5px solid #FCA5A5; border-radius: 8px; font-size: 12.5px; color: #991B1B;">
            <strong><i class="fas fa-exclamation-circle"></i> Revision Notes (${rec.rejectedBy || 'Reviewer'} on ${rec.rejectedAt || 'Recent'}):</strong> "${rec.rejectionNotes}"
          </div>
        ` : ''}
      </div>

      <!-- Completion Meter & Warning Banner -->
      ${prog.isPartial ? `
        <div style="background: #FFFBEB; border: 1.5px solid #FCD34D; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; color: #92400E; display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 20px; color: #D97706;"></i>
          <div>
            <strong>Partial Submission Notice:</strong> Coordinator has submitted ${prog.completed} of ${prog.total} template response(s). <strong>${prog.pending} template(s) are still pending</strong> response upload.
          </div>
        </div>
      ` : ''}

      <!-- Detailed Template Breakdown -->
      <h4 style="font-size: 13.5px; font-weight: 800; color: #0F172A; text-transform: uppercase; margin-bottom: 8px;">
        Official Templates & Completed Responses (${prog.completed}/${prog.total} Fulfilled):
      </h4>

      <div style="display: grid; gap: 10px; margin-bottom: 18px;">
        ${(fld.files && fld.files.length > 0) ? fld.files.map((file, idx) => {
          const resp = prog.uploadedFiles.find(uf => uf.templateFileId === file.id || (!uf.templateFileId && idx === 0));
          return `
            <div style="border: 1.5px solid ${resp ? '#86EFAC' : '#FCD34D'}; border-radius: 10px; overflow: hidden; background: #FFF;">
              <div style="display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; padding: 10px 14px; border-bottom: 1px solid #E2E8F0; font-size: 12.5px;">
                <span style="font-weight: 700; color: #0F172A;">
                  <i class="fas fa-file-excel" style="color: #2563EB; margin-right: 6px;"></i> Template ${idx + 1}: ${file.name}
                </span>
                <span style="font-size: 11px; color: #64748B;">Size: ${file.size || 'Format'}</span>
              </div>
              <div style="padding: 10px 14px; background: ${resp ? '#F0FDF4' : '#FFFBEB'}; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                ${resp ? `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-check-circle" style="color: #16A34A; font-size: 18px;"></i>
                    <div>
                      <div style="font-weight: 800; font-size: 13px; color: #15803D;">✓ ${resp.name}</div>
                      <div style="font-size: 11px; color: #64748B;">Uploaded: ${resp.uploadDate || 'Recent'} • Size: ${resp.size}</div>
                    </div>
                  </div>
                  <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                    <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 14px; border-radius: 6px; box-shadow: 0 2px 6px rgba(37,99,235,0.3); display: inline-flex; align-items: center; gap: 5px;" onclick="openFileViewer('${encodeURIComponent(JSON.stringify(resp))}', '${dept?.code} Response: ${resp.name}')">
                      <i class="fas fa-eye"></i> View Response
                    </button>
                    <a href="${getFileDownloadUrl(resp)}" download="${resp.name}" target="_blank" class="ios-btn" style="background: #16A34A; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 12px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                      <i class="fas fa-download"></i> Download
                    </a>
                  </div>
                ` : `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-clock" style="color: #D97706; font-size: 18px;"></i>
                    <span style="font-weight: 700; font-size: 12.5px; color: #92400E;">⚠️ Response Pending (Not Uploaded by Coordinator)</span>
                  </div>
                  <span class="ios-status-tag" style="background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D;">Missing Response</span>
                `}
              </div>
            </div>
          `;
        }).join('') : `
          ${prog.uploadedFiles.map(file => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #F0FDF4; border: 2px solid #86EFAC; border-radius: 12px; padding: 12px 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas ${file.name.match(/\.(xlsx?|csv)$/) ? 'fa-file-excel' : (file.name.endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-word')}" style="font-size: 24px; color: ${file.name.match(/\.(xlsx?|csv)$/) ? '#16A34A' : '#DC2626'};"></i>
                <div>
                  <div style="font-weight: 800; font-size: 14px; color: #15803D;">${file.name}</div>
                  <div style="font-size: 11.5px; color: #64748B; font-weight: 600;">Size: ${file.size} • Uploaded: ${file.uploadDate}</div>
                </div>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 14px; border-radius: 7px; display: inline-flex; align-items: center; gap: 5px;" onclick="openFileViewer('${encodeURIComponent(JSON.stringify(file))}', '${dept?.code} Response: ${file.name}')">
                  <i class="fas fa-eye"></i> View Response
                </button>
                <a href="${getFileDownloadUrl(file)}" download="${file.name}" target="_blank" class="ios-btn" style="background: #16A34A; color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 14px; border-radius: 7px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                  <i class="fas fa-download"></i> Download
                </a>
              </div>
            </div>
          `).join('')}
        `}
      </div>

      <!-- Executive Verification Remarks -->
      <div class="ios-form-group" style="margin-bottom: 0;">
        <label class="ios-label" style="font-size: 12.5px; font-weight: 800; color: #0F172A;">
          ${state.currentUser?.role === 'principal' ? 'Principal Executive Sanction Remarks:' : (state.currentUser?.role === 'president' ? 'Presidential Seal & Governing Council Remarks:' : 'IQAC Central Verification Remarks:')}
        </label>
        <textarea id="admin-iqac-remarks-input" class="ios-input" rows="3" style="font-size: 13px; font-weight: 600;">${state.currentUser?.role === 'principal' ? 'Reviewed and sanctioned by Principal. Cleared for Institutional SSR Dossier and Final Presidential Endorsement.' : (state.currentUser?.role === 'president' ? 'Governing Council has ratified and approved this accreditation dossier. Official Presidential Seal Affixed.' : 'Audited and verified by IQAC Central Directorate. All quantitative metrics in Excel sheet validated. Cleared for Institutional SSR Dossier.')}</textarea>
      </div>
    </div>
    <div class="ios-modal-foot" style="display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
      ${state.currentUser?.role === 'president' ? `
        <button type="button" class="ios-btn" style="background: #E2E8F0; color: #334155; font-weight: 800; padding: 9px 18px; border-radius: 8px;" onclick="closeModal()">
          Close
        </button>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #D97706 0%, #B45309 100%); color: #FFF; font-size: 13px; font-weight: 800; padding: 9px 22px; border-radius: 8px; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.35);" onclick="executeAdminYearAction('${rec.id}', 'endorse_by_president')">
            <i class="fas fa-award"></i> Affix Presidential Seal & Endorse
          </button>
        </div>
      ` : (state.currentUser?.role === 'principal' ? `
        <button type="button" class="ios-btn ios-btn-danger" style="font-size: 12.5px; font-weight: 800; padding: 9px 16px; border-radius: 8px; background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);" onclick="openRejectNotesModal('${rec.id}', 'yearwise')">
          <i class="fas fa-undo"></i> Return with Executive Notes
        </button>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #881337 0%, #BE123C 100%); color: #FFF; font-size: 13px; font-weight: 800; padding: 9px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(136, 19, 55, 0.35);" onclick="executeAdminYearAction('${rec.id}', 'approve_by_principal')">
            <i class="fas fa-crown"></i> Grant Principal Executive Sanction
          </button>
        </div>
      ` : `
        <button type="button" class="ios-btn ios-btn-danger" style="font-size: 12.5px; font-weight: 800; padding: 9px 16px; border-radius: 8px; background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);" onclick="openRejectNotesModal('${rec.id}', 'yearwise')">
          <i class="fas fa-undo"></i> Reject / Return with Notes
        </button>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="ios-btn" style="background: #059669; color: #FFF; font-size: 12.5px; font-weight: 800; padding: 9px 16px; border-radius: 8px;" onclick="executeAdminYearAction('${rec.id}', 'approve_by_hod')">
            <i class="fas fa-stamp"></i> Endorse as HOD Approved
          </button>
          <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFF; font-size: 13px; font-weight: 800; padding: 9px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);" onclick="executeAdminYearAction('${rec.id}', 'iqac_verify')">
            <i class="fas fa-shield-alt"></i> Grant Official IQAC Verification
          </button>
        </div>
      `)}
    </div>
  `;

  modalOverlay.style.display = 'flex';
};

window.executeAdminYearAction = async function(recId, action) {
  const defaultNote = (action === 'approve_by_principal') ? 'Approved & Sanctioned by Principal' : ((action === 'endorse_by_president') ? 'Official Presidential Seal Affixed' : 'Verified by IQAC Directorate');
  const remarks = document.getElementById('admin-iqac-remarks-input')?.value || defaultNote;
  try {
    const res = await fetch(`/api/yearwise-records/${recId}/workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        remarks,
        actorName: state.currentUser.name || 'Executive Authority',
        actorRole: state.currentUser.role || 'admin_coordinator'
      })
    }).then(r => r.json());

    if (res.success) {
      closeModal();
      let msg = 'Workflow updated successfully.';
      if (action === 'iqac_verify') msg = 'IQAC Official Verification recorded!';
      else if (action === 'approve_by_hod') msg = 'HOD Endorsement recorded!';
      else if (action === 'approve_by_principal') msg = 'Principal Executive Sanction recorded!';
      else if (action === 'endorse_by_president') msg = 'Presidential Seal Affixed successfully! Institutional SSR Dossier Endorsed.';
      else if (action === 'returned_for_revision') msg = 'Returned for revision with notes.';
      showToast(msg, 'success');
      await loadInitialData();
      renderActiveView();
    } else {
      showToast(res.error || 'Failed to update workflow state.', 'error');
    }
  } catch (err) {
    console.debug('Execute admin workflow notice:', err);
    showToast('Failed to record workflow action.', 'error');
  }
};

window.quickGrantIQACVerification = async function(recId) {
  await executeAdminYearAction(recId, 'iqac_verify');
};

window.grantIQACYearVerification = async function(recId) {
  await executeAdminYearAction(recId, 'iqac_verify');
};

// ==========================================================================
// 5. PRINCIPAL WORKSPACE (Who Submitted What & Executive Sanctions)
// ==========================================================================
function renderPrincipalDesk(container) {
  renderExecutiveSubmissionsDesk(container, 'principal');
}

// ==========================================================================
// 6. PRESIDENT WORKSPACE (Who Submitted What & Presidential Seal)
// ==========================================================================
function renderPresidentDesk(container) {
  renderExecutiveSubmissionsDesk(container, 'president');
}

function renderPresidentSummary(container) {
  renderExecutiveSubmissionsDesk(container, 'president');
}

// Shared Master Executive Submissions Desk for Principal & President
function renderExecutiveSubmissionsDesk(container, executiveRole = 'principal') {
  const isPrincipal = executiveRole === 'principal';
  const records = state.yearwiseRecords || [];
  const departments = state.departments || [];
  const folders = state.formatFolders || [];
  const currentFilterYear = state.selectedExecutiveYearFilter || 'all';

  // Filter records with uploaded criteria responses (exclude confidential TPO-only files from general executive file list)
  let activeRecords = records.filter(r =>
    (r.excelFile || (r.uploadedFiles && r.uploadedFiles.length > 0)) &&
    r.departmentId !== 'unit-tpo' &&
    r.folderId !== 'fld-tpo-permanent'
  );
  if (currentFilterYear !== 'all') {
    activeRecords = activeRecords.filter(r => r.academicYear === currentFilterYear);
  }

  // Confidential TPO Work & Upload Activity Status (Visible to Principal & President, files restricted to Admin & TPO)
  const tpoRecords = records.filter(r => (r.departmentId === 'unit-tpo' || r.folderId === 'fld-tpo-permanent') && (r.excelFile || (r.uploadedFiles && r.uploadedFiles.length > 0)));
  const tpoTotalFiles = tpoRecords.reduce((acc, r) => acc + ((r.uploadedFiles && r.uploadedFiles.length) ? r.uploadedFiles.length : (r.excelFile ? 1 : 0)), 0);
  const tpoLatestRec = [...tpoRecords].sort((a, b) => (b.updatedAt || b.coordinatorSubmittedAt || b.createdAt || '').localeCompare(a.updatedAt || a.coordinatorSubmittedAt || a.createdAt || ''))[0];
  const tpoUsers = (state.allUsers || []).filter(u => u.role === 'tpo');
  const tpoOfficerName = tpoLatestRec?.author || tpoUsers[0]?.name || 'TPO Officer';
  const tpoActiveYears = [...new Set(tpoRecords.map(r => r.academicYear))].join(', ');
  const tpoWorking = tpoTotalFiles > 0;

  // Calculate Key Institutional Metrics
  const totalSubmissions = activeRecords.length;
  const iqacVerifiedCount = activeRecords.filter(r => r.status === 'iqac_verified' || r.status === 'verified_by_iqac').length;
  const principalApprovedCount = activeRecords.filter(r => r.status === 'approved_by_principal').length;
  const presidentEndorsedCount = activeRecords.filter(r => r.status === 'endorsed_by_president').length;

  // Departments pending submission for selected year
  const targetYear = currentFilterYear === 'all' ? state.selectedAcademicYear : currentFilterYear;
  const pendingDepts = departments.filter(d => 
    !records.some(r => r.departmentId === d.id && r.academicYear === targetYear && (r.excelFile || (r.uploadedFiles && r.uploadedFiles.length > 0)))
  );

  container.innerHTML = `
    <!-- Top Executive Persona Header -->
    <div class="ios-card" style="border: 2px solid ${isPrincipal ? '#FCA5A5' : '#FDE047'}; border-left: 6px solid ${isPrincipal ? '#881337' : '#D97706'}; margin-bottom: 22px;">
      <div class="ios-card-body" style="padding: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: ${isPrincipal ? '#881337' : '#D97706'}; letter-spacing: 0.5px;">
            ${isPrincipal ? 'Principal Secretariat • Executive Sanctions' : 'Governing Council • Presidential Seal & Final Sanction'}
          </div>
          <h2 style="font-size: 22px; font-weight: 900; color: #0F172A; margin: 4px 0; display: flex; align-items: center; gap: 10px;">
            <i class="fas ${isPrincipal ? 'fa-user-tie' : 'fa-landmark'}" style="color: ${isPrincipal ? '#881337' : '#D97706'};"></i>
            <span>${isPrincipal ? 'Dr. Anil K. Deshamne (Principal)' : 'Hon. Ravindraji Gaikwad (President & Chairman)'}</span>
          </h2>
          <div style="font-size: 13px; font-weight: 700; color: #475569; margin-top: 4px;">
            <span>B.I.G.C.E. Accreditation Cycle 2 • Target Grade A++</span> • 
            <span>Central Criteria Review & Sanction Desk</span>
          </div>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="ios-btn" style="background: #2563EB; color: #FFF; font-size: 12.5px; font-weight: 800; padding: 8px 16px; border-radius: 8px;" onclick="switchNavTab('${isPrincipal ? 'principal-matrix' : 'president-summary'}', event)">
            <i class="fas fa-th"></i> View 14-Dept Matrix
          </button>
          <button class="ios-btn" style="background: ${isPrincipal ? 'linear-gradient(135deg, #881337 0%, #BE123C 100%)' : 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'}; color: #FFF; font-size: 12.5px; font-weight: 800; padding: 8px 18px; border-radius: 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.15);" onclick="switchNavTab('${isPrincipal ? 'principal-ssr' : 'president-ssr'}', event)">
            <i class="fas fa-file-contract"></i> Official SSR Document
          </button>
        </div>
      </div>
    </div>

    <!-- Institutional KPI Metrics Grid -->
    <div class="responsive-stats-grid" style="margin-bottom: 22px;">
      <div class="ios-card" style="margin-bottom: 0; padding: 16px 20px; background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); color: #FFF;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94A3B8;">Criteria Submissions</div>
        <div style="font-size: 26px; font-weight: 900; color: #FFF; margin-top: 4px;">${totalSubmissions} Total</div>
        <div style="font-size: 11.5px; color: #CBD5E1; font-weight: 600; margin-top: 2px;">Active Criteria Records on File</div>
      </div>
      <div class="ios-card" style="margin-bottom: 0; padding: 16px 20px; background: #ECFDF5; border: 2px solid #6EE7B7;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #065F46;">IQAC Directorate Verified</div>
        <div style="font-size: 26px; font-weight: 900; color: #047857; margin-top: 4px;">${iqacVerifiedCount}</div>
        <div style="font-size: 11.5px; color: #047857; font-weight: 700; margin-top: 2px;">Validated by IQAC Directorate</div>
      </div>
      <div class="ios-card" style="margin-bottom: 0; padding: 16px 20px; background: #FAF5FF; border: 2px solid #D8B4FE;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #6B21A8;">Principal Sanctioned</div>
        <div style="font-size: 26px; font-weight: 900; color: #7E22CE; margin-top: 4px;">${principalApprovedCount}</div>
        <div style="font-size: 11.5px; color: #7E22CE; font-weight: 700; margin-top: 2px;">Executive Clearance Granted</div>
      </div>
      <div class="ios-card" style="margin-bottom: 0; padding: 16px 20px; background: #FFFBEB; border: 2px solid #FCD34D;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #92400E;">Presidential Sealed</div>
        <div style="font-size: 26px; font-weight: 900; color: #B45309; margin-top: 4px;">${presidentEndorsedCount}</div>
        <div style="font-size: 11.5px; color: #B45309; font-weight: 700; margin-top: 2px;">Final Council Seal Affixed</div>
      </div>
    </div>

    <!-- TPO Cell Work & Upload Activity Monitor (Status Only — Files Confidential to Admin & TPO) -->
    <div style="background: ${tpoWorking ? 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)' : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'}; border: 2px solid ${tpoWorking ? '#86EFAC' : '#FCD34D'}; border-left: 6px solid ${tpoWorking ? '#16A34A' : '#D97706'}; border-radius: 14px; padding: 16px 20px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; box-shadow: 0 3px 12px rgba(0,0,0,0.04);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 46px; height: 46px; border-radius: 12px; background: ${tpoWorking ? '#16A34A' : '#D97706'}; color: #FFF; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
          <i class="fas ${tpoWorking ? 'fa-briefcase' : 'fa-hourglass-half'}"></i>
        </div>
        <div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 15px; font-weight: 900; color: #0F172A;">TPO Cell Work & Upload Activity</span>
            <span class="ios-status-tag" style="background: ${tpoWorking ? '#DCFCE7' : '#FEF3C7'}; color: ${tpoWorking ? '#15803D' : '#92400E'}; border: 1.5px solid ${tpoWorking ? '#86EFAC' : '#F59E0B'}; font-size: 11px; font-weight: 800;">
              ${tpoWorking ? `● ACTIVE — ${tpoTotalFiles} File(s) Uploaded` : '○ PENDING — No Uploads Yet'}
            </span>
          </div>
          <div style="font-size: 12.5px; font-weight: 600; color: #334155; margin-top: 4px;">
            ${tpoWorking
              ? `Officer: <strong>${tpoOfficerName}</strong> • Active AY: <strong>${tpoActiveYears}</strong> • Last Activity: <strong>${tpoLatestRec?.updatedAt || tpoLatestRec?.coordinatorSubmittedAt || tpoLatestRec?.createdAt || 'Recent'}</strong>`
              : `TPO Officer (${tpoOfficerName}) has not uploaded placement reports yet.`
            }
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #64748B; margin-top: 3px;">
            <i class="fas fa-lock" style="color: #7E22CE;"></i> Confidential Workspace: Actual placement files are restricted to TPO & IQAC Admin; live work status is visible here.
          </div>
        </div>
      </div>
      <div style="background: #FFFFFF; border: 1.5px solid #CBD5E1; border-radius: 10px; padding: 8px 14px; font-size: 12px; font-weight: 800; color: #0F172A;">
        Status: ${tpoWorking ? (tpoLatestRec?.status === 'iqac_verified' ? '✓ IQAC Verified' : (tpoLatestRec?.status === 'submitted_to_hod' ? 'Submitted to IQAC Admin' : 'Draft / Uploading')) : 'Awaiting Upload'}
      </div>
    </div>

    <!-- Academic Year Filter Switcher -->
    <div style="background: #FFFFFF; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 12px 18px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="fas fa-filter" style="color: #2563EB; font-size: 18px;"></i>
        <span style="font-size: 13.5px; font-weight: 800; color: #0F172A;">Filter by Academic Year:</span>
      </div>
      <div class="ios-segmented-control" style="max-width: 100%; overflow-x: auto;">
        <button class="ios-segment-btn ${currentFilterYear === 'all' ? 'active' : ''}" style="padding: 7px 16px; font-size: 12px; font-weight: 800;" onclick="setExecutiveYearFilter('all')">
          All Academic Years (${records.filter(r => r.excelFile || (r.uploadedFiles && r.uploadedFiles.length > 0)).length})
        </button>
        ${state.academicYears.map(yr => {
          const yrCount = records.filter(r => r.academicYear === yr && (r.excelFile || (r.uploadedFiles && r.uploadedFiles.length > 0))).length;
          return `
            <button class="ios-segment-btn ${currentFilterYear === yr ? 'active' : ''}" style="padding: 7px 16px; font-size: 12px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;" onclick="setExecutiveYearFilter('${yr}')">
              <span>AY ${yr}</span>
              ${yrCount > 0 ? `<span style="background: ${currentFilterYear === yr ? '#FFF' : '#DCFCE7'}; color: #15803D; font-size: 10.5px; font-weight: 900; padding: 1px 6px; border-radius: 999px;">${yrCount}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Section Title: Who Submitted What -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
      <div>
        <h3 style="font-size: 18px; font-weight: 900; color: #0F172A; margin: 0; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-clipboard-list" style="color: #2563EB;"></i>
          <span>Department Submissions Ledger (Kisne Kya Submit Kiya)</span>
        </h3>
        <span style="font-size: 12.5px; font-weight: 600; color: #64748B;">Live departmental criteria files, uploader provenance, completed Excel response sheets, and approval chain.</span>
      </div>
      <span class="ios-status-tag" style="background: #EFF6FF; color: #1E40AF; border: 1.5px solid #93C5FD; font-size: 12px; font-weight: 800;">
        ${activeRecords.length} Active Submission(s) Displayed
      </span>
    </div>

    <!-- Submissions Cards Grid -->
    ${activeRecords.length === 0 ? `
      <div class="ios-card" style="text-align: center; padding: 42px 20px; color: #64748B;">
        <i class="fas fa-folder-open" style="font-size: 42px; color: #CBD5E1; margin-bottom: 12px; display: block;"></i>
        <h4 style="font-size: 16px; font-weight: 800; color: #0F172A; margin-bottom: 4px;">No Submissions Found for This Filter</h4>
        <p style="font-size: 13px; font-weight: 600; color: #64748B; margin: 0;">Department coordinators have not uploaded criteria files for the selected year filter yet.</p>
      </div>
    ` : `
      <div style="display: grid; gap: 18px; margin-bottom: 28px;">
        ${activeRecords.map(rec => {
          const dept = departments.find(d => d.id === rec.departmentId) || { name: rec.departmentId, code: rec.departmentId.toUpperCase(), coordinator: 'Coordinator', hod: 'HOD', section: 'UG' };
          const fld = folders.find(f => f.id === rec.folderId) || { title: 'Criteria Format Folder', files: [] };
          const prog = window.getFolderProgress(fld, rec);
          const recFiles = (rec.uploadedFiles && rec.uploadedFiles.length) ? rec.uploadedFiles : (rec.excelFile ? [rec.excelFile] : []);
          
          const isRejected = rec.status === 'returned_for_revision' || rec.status === 'rejected';
          const isVerified = rec.status === 'iqac_verified' || rec.status === 'verified_by_iqac';
          const isHodApproved = rec.status === 'approved_by_hod';
          const isPrincipalApproved = rec.status === 'approved_by_principal';
          const isPresidentEndorsed = rec.status === 'endorsed_by_president';

          let borderLeftColor = '#2563EB';
          let headerBg = '#F8FAFC';
          let squircleClass = 'folder-squircle-blue';
          let folderIcon = 'fa-folder';

          if (isRejected) {
            borderLeftColor = '#DC2626';
            headerBg = '#FEF2F2';
            squircleClass = 'folder-squircle-red';
            folderIcon = 'fa-undo';
          } else if (isPresidentEndorsed) {
            borderLeftColor = '#D97706';
            headerBg = '#FFFBEB';
            squircleClass = 'folder-squircle-amber';
            folderIcon = 'fa-award';
          } else if (isPrincipalApproved) {
            borderLeftColor = '#7E22CE';
            headerBg = '#FAF5FF';
            squircleClass = 'folder-squircle-blue';
            folderIcon = 'fa-crown';
          } else if (isVerified) {
            borderLeftColor = '#059669';
            headerBg = '#ECFDF5';
            squircleClass = 'folder-squircle-green';
            folderIcon = 'fa-shield-alt';
          } else if (isHodApproved) {
            borderLeftColor = '#16A34A';
            headerBg = '#F0FDF4';
            squircleClass = 'folder-squircle-green';
            folderIcon = 'fa-check-circle';
          }

          return `
            <div class="ios-card" style="margin-bottom: 0; border: 2px solid ${isRejected ? '#FCA5A5' : (isVerified || isHodApproved || isPrincipalApproved || isPresidentEndorsed ? '#86EFAC' : '#CBD5E1')}; border-left: 6px solid ${borderLeftColor}; box-shadow: 0 3px 10px rgba(0,0,0,0.03);">
              
              <!-- Card Header: Department + Folder + Status Badge -->
              <div class="ios-card-header" style="background: ${headerBg}; flex-wrap: wrap; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div class="folder-icon-squircle ${squircleClass}">
                    <i class="fas ${folderIcon}"></i>
                  </div>
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                      <h4 style="font-size: 16.5px; font-weight: 800; color: #0F172A; margin: 0;">${dept.name}</h4>
                      <span style="background: #1E293B; color: #FFF; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 6px;">${dept.code}</span>
                      <span style="background: #EFF6FF; color: #1E40AF; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 6px;">${dept.section}</span>
                    </div>
                    <div style="font-size: 12px; font-weight: 700; color: #64748B; margin-top: 3px;">
                      <i class="fas fa-folder" style="color: #D97706;"></i> Format Folder: <strong>${fld.title}</strong> • Academic Year: <strong>AY ${rec.academicYear}</strong>
                    </div>
                  </div>
                </div>
                <div>
                  ${window.renderFolderStatusBadge(fld, rec)}
                </div>
              </div>

              <div class="ios-card-body" style="padding: 18px 20px;">
                
                <!-- 2-Column Details: Kisne Submit Kiya vs Clearance Chain -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 16px;">
                  
                  <!-- Box 1: Kisne Submit Kiya -->
                  <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 14px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #2563EB; letter-spacing: 0.3px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                      <i class="fas fa-user-edit"></i> Submitted By (Uploader):
                    </div>
                    <div style="font-size: 14px; font-weight: 800; color: #0F172A;">
                      ${rec.author || dept.coordinator}
                    </div>
                    <div style="font-size: 11.5px; color: #64748B; font-weight: 600; margin-top: 2px;">
                      Coordinator • Department of ${dept.name}
                    </div>
                    <div style="font-size: 11.5px; color: #334155; font-weight: 700; margin-top: 6px; display: flex; align-items: center; gap: 5px;">
                      <i class="fas fa-calendar-check" style="color: #10B981;"></i> Submitted on: <strong>${rec.coordinatorSubmittedAt || rec.createdAt}</strong>
                    </div>
                    ${rec.coordinatorRemarks ? `
                      <div style="margin-top: 8px; padding: 6px 10px; background: #FFF; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 12px; color: #475569; font-style: italic;">
                        "${rec.coordinatorRemarks}"
                      </div>
                    ` : ''}
                  </div>

                  <!-- Box 2: Verification Progression History -->
                  <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 14px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #881337; letter-spacing: 0.3px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                      <i class="fas fa-history"></i> Institutional Review Chain:
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
                      <!-- HOD -->
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #334155;">HOD (${dept.hod}):</span>
                        ${rec.hodApprovedAt ? `
                          <span style="color: #15803D; font-weight: 800;"><i class="fas fa-check-circle"></i> Approved (${rec.hodApprovedAt})</span>
                        ` : (rec.status === 'submitted_to_hod' ? `
                          <span style="color: #D97706; font-weight: 800;"><i class="fas fa-clock"></i> Under Scrutiny</span>
                        ` : '<span style="color: #94A3B8;">Pending</span>')}
                      </div>
                      <!-- IQAC -->
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #334155;">IQAC Directorate:</span>
                        ${rec.iqacVerifiedAt ? `
                          <span style="color: #047857; font-weight: 800;"><i class="fas fa-shield-alt"></i> Verified (${rec.iqacVerifiedAt})</span>
                        ` : '<span style="color: #94A3B8;">Awaiting IQAC</span>'}
                      </div>
                      <!-- Principal -->
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #334155;">Principal Secretariat:</span>
                        ${rec.principalApprovedAt ? `
                          <span style="color: #7E22CE; font-weight: 800;"><i class="fas fa-crown"></i> Sanctioned (${rec.principalApprovedAt})</span>
                        ` : '<span style="color: #94A3B8;">Pending Sanction</span>'}
                      </div>
                      <!-- President -->
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: #334155;">Presidential Seal:</span>
                        ${rec.presidentEndorsedAt ? `
                          <span style="color: #B45309; font-weight: 800;"><i class="fas fa-award"></i> Affixed (${rec.presidentEndorsedAt})</span>
                        ` : '<span style="color: #94A3B8;">Pending Seal</span>'}
                      </div>
                    </div>
                  </div>

                </div>

                <!-- Kya Submit Kiya: Completed Response Files List -->
                <div style="margin-bottom: 14px;">
                  <div style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span><i class="fas fa-file-invoice" style="color: #10B981;"></i> Submitted Response File(s) (${recFiles.length}):</span>
                    <span style="font-size: 11.5px; font-weight: 700; color: #15803D;">${prog.completed} of ${prog.total} Template(s) Completed</span>
                  </div>
                  <div style="display: grid; gap: 8px;">
                    ${recFiles.map(file => `
                      <div style="display: flex; justify-content: space-between; align-items: center; background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 8px; padding: 10px 14px; flex-wrap: wrap; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          <i class="fas ${file.name.match(/\.(xlsx?|csv)$/) ? 'fa-file-excel' : (file.name.endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-word')}" style="color: ${file.name.match(/\.(xlsx?|csv)$/) ? '#16A34A' : '#DC2626'}; font-size: 20px;"></i>
                          <div>
                            <strong style="color: #15803D; font-size: 13px;">${file.name}</strong>
                            <div style="font-size: 11px; color: #64748B; font-weight: 600;">Size: ${file.size} • Uploaded: ${file.uploadDate}</div>
                          </div>
                        </div>
                        <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                          <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFF; font-size: 11.5px; font-weight: 800; padding: 5px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 5px;" onclick="openFileViewer('${encodeURIComponent(JSON.stringify(file))}', '${dept.code} Response: ${file.name}')">
                            <i class="fas fa-eye"></i> View File
                          </button>
                          <a href="${getFileDownloadUrl(file)}" download="${file.name}" target="_blank" class="ios-btn" style="background: #16A34A; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 5px 12px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                            <i class="fas fa-download"></i> Download
                          </a>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- Executive Action Bar -->
                <div style="border-top: 1.5px solid #E2E8F0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                  <button type="button" class="ios-btn" style="background: #1E293B; color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 16px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;" onclick="openAdminYearInspectModal('${rec.id}')">
                    <i class="fas fa-search-plus"></i> Scrutinize & Audit Sheet
                  </button>

                  <!-- Role Specific Executive Actions -->
                  ${isPrincipal ? `
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                      <button type="button" class="ios-btn" style="background: #DC2626; color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 14px; border-radius: 8px;" onclick="openRejectNotesModal('${rec.id}', 'yearwise')">
                        <i class="fas fa-undo"></i> Return with Notes
                      </button>
                      ${!isPrincipalApproved && !isPresidentEndorsed ? `
                        <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #881337 0%, #BE123C 100%); color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 16px; border-radius: 8px; box-shadow: 0 3px 8px rgba(136, 19, 55, 0.3);" onclick="executeAdminYearAction('${rec.id}', 'approve_by_principal')">
                          <i class="fas fa-crown"></i> Grant Principal Sanction
                        </button>
                      ` : `
                        <span class="ios-status-tag" style="background: #FAF5FF; color: #7E22CE; border: 1.5px solid #D8B4FE; font-size: 12px; font-weight: 800;">
                          <i class="fas fa-check-double"></i> Principal Sanctioned
                        </span>
                      `}
                    </div>
                  ` : `
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                      ${!isPresidentEndorsed ? `
                        <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #D97706 0%, #B45309 100%); color: #FFF; font-size: 12px; font-weight: 800; padding: 7px 18px; border-radius: 8px; box-shadow: 0 3px 8px rgba(217, 119, 6, 0.3);" onclick="executeAdminYearAction('${rec.id}', 'endorse_by_president')">
                          <i class="fas fa-award"></i> Affix Presidential Seal
                        </button>
                      ` : `
                        <span class="ios-status-tag status-president-endorsed" style="font-size: 12px; font-weight: 800;">
                          <i class="fas fa-star"></i> Presidential Seal Affixed
                        </span>
                      `}
                    </div>
                  `}
                </div>

              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}

    <!-- Departments Awaiting Submission Summary -->
    <div class="ios-card" style="margin-top: 24px;">
      <div class="ios-card-header" style="background: #F8FAFC;">
        <h4 style="font-size: 15px; font-weight: 800; color: #0F172A; margin: 0; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-clock" style="color: #D97706;"></i>
          <span>Departments Awaiting Submission (${pendingDepts.length} of ${departments.length} Pending for AY ${targetYear})</span>
        </h4>
      </div>
      <div class="ios-card-body" style="padding: 16px 20px;">
        ${pendingDepts.length === 0 ? `
          <div style="color: #15803D; font-size: 13px; font-weight: 700;">
            <i class="fas fa-check-circle"></i> Outstanding! All 14 departments have submitted their criteria files for AY ${targetYear}.
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px;">
            ${pendingDepts.map(d => `
              <div style="background: #FFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="color: #0F172A; font-size: 12.5px;">${d.name}</strong>
                  <div style="font-size: 11px; color: #64748B;">Coord: ${d.coordinator} • Head: ${d.hod}</div>
                </div>
                <span class="ios-status-tag" style="background: #F1F5F9; color: #64748B; font-size: 10.5px;">Awaiting</span>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

window.setExecutiveYearFilter = function(year) {
  state.selectedExecutiveYearFilter = year;
  renderActiveView();
};

// ==========================================================================
// 7. OFFICIAL SSR DOSSIER PRINT VIEW
// ==========================================================================
function renderSSRDossier(container) {
  container.innerHTML = `
    <div class="ios-card no-print" style="margin-bottom: 16px;">
      <div class="ios-card-body" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="font-size: 16px; font-weight: 700; color: var(--ios-primary); margin: 0;">
            <i class="fas fa-file-contract"></i> Official Accreditation Dossier (2023 - 2027)
          </h3>
          <span style="font-size: 12px; color: var(--ios-text-secondary);">Prepared for Academic & Quality Assurance Review</span>
        </div>
        <button class="ios-btn" style="background: var(--ios-primary); color: #FFF;" onclick="window.print()">
          <i class="fas fa-print"></i> Print Official Report
        </button>
      </div>
    </div>

    <div class="ssr-printable-doc">
      <div class="ssr-doc-header">
        <div style="width: 70px; height: 70px; margin: 0 auto 10px auto;">
          <img src="assets/bigce-logo.png" style="width: 100%; height: 100%; object-fit: contain;" alt="BIGCE Logo" />
        </div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #777;">
          Institutional Quality Assurance Cell (IQAC)
        </div>
        <div style="font-size: 11.5px; color: #888; text-transform: uppercase;">Kai. Sushilatai Gaikwad Bahuuddeshiya Sanstha's</div>
        <h2 style="font-size: 18px; margin-top: 2px;">BHARAT-RATNA INDIRA GANDHI COLLEGE OF ENGINEERING, SOLAPUR</h2>
        <div style="font-size: 13.5px; color: #19385c; font-weight: bold;">
          BIGCE ACCREDITATION MANAGEMENT SYSTEM (ANNUAL DOSSIER)
        </div>
        <p style="font-size: 11px; color: #555; margin-top: 4px;">
          Gat No. 58/3, Solapur-Pune NH-9, Kegaon, Solapur - 413255 (DTE: 6219) • bigce.in<br>
          Approved by AICTE New Delhi, DTE Govt. of Maharashtra • Affiliated to DBATU / PAHSU & MSBTE
        </p>
      </div>

      <div class="ios-table-container" style="margin-bottom: 24px;">
        <table class="ios-table" style="font-size: 11.5px;">
          <thead>
            <tr>
              <th>Dept Code</th>
              <th>Department / Unit</th>
              <th>AY 2023-24</th>
              <th>AY 2024-25</th>
              <th>AY 2025-26</th>
              <th>AY 2026-27</th>
              <th>HOD Endorsement</th>
            </tr>
          </thead>
          <tbody>
            ${state.departments.map(dept => `
              <tr>
                <td><strong>${dept.code}</strong></td>
                <td>${dept.shortName}</td>
                ${state.academicYears.map(yr => {
                  const rec = state.yearwiseRecords.find(r => r.departmentId === dept.id && r.academicYear === yr);
                  return `
                    <td>${rec?.excelFile ? 'Submitted (✓)' : 'Pending'}</td>
                  `;
                }).join('')}
                <td>${dept.hod}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="signatures-matrix">
        <div class="signature-cell">
          <div class="signature-line">Coordinator</div>
          <strong>Dept Coordinator</strong>
        </div>
        <div class="signature-cell">
          <div class="signature-line">Head of Department</div>
          <strong>HOD Seal & Sign</strong>
        </div>
        <div class="signature-cell">
          <div class="signature-line">Director, IQAC</div>
          <strong>IQAC Verification</strong>
        </div>
        <div class="signature-cell">
          <div class="signature-line">Dr. Anil K. Deshamne</div>
          <strong>Principal & Head of Institution</strong>
        </div>
        <div class="signature-cell">
          <div class="signature-line">Hon. Ravindraji Gaikwad</div>
          <strong>President, KSGBS</strong><br>
          <span>Governing Council</span>
        </div>
      </div>
    </div>
  `;
}

// Status Tag Renderer (iOS Style)
function renderIOSStatusTag(status) {
  switch (status) {
    case 'endorsed_by_president':
      return `<span class="ios-status-tag status-president-endorsed">★ Presidential Endorsed</span>`;
    case 'approved_by_principal':
      return `<span class="ios-status-tag status-principal-approved">Principal Approved</span>`;
    case 'verified_by_iqac':
    case 'iqac_verified':
      return `<span class="ios-status-tag status-iqac-verified"><i class="fas fa-shield-alt"></i> IQAC Verified</span>`;
    case 'approved_by_hod':
      return `<span class="ios-status-tag status-hod-approved"><i class="fas fa-check-circle"></i> HOD Approved</span>`;
    case 'submitted_to_hod':
      return `<span class="ios-status-tag status-submitted"><i class="fas fa-clock"></i> Submitted to HOD</span>`;
    case 'returned_for_revision':
    case 'rejected':
      return `<span class="ios-status-tag" style="background: #FEE2E2; color: #DC2626; border: 1.5px solid #FCA5A5; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;"><i class="fas fa-exclamation-circle"></i> Returned for Revision</span>`;
    default:
      return `<span class="ios-status-tag status-draft">Draft</span>`;
  }
}

function formatRoleName(role) {
  switch (role) {
    case 'admin_coordinator': return 'IQAC Admin Coordinator';
    case 'principal': return 'Principal';
    case 'president': return 'Hon. President';
    case 'hod': return 'Head of Department (HOD)';
    case 'tpo': return 'Training & Placement Officer (TPO)';
    case 'dept_coordinator': return 'Department Coordinator';
    default: return role;
  }
}

// Dedicated Reject / Return with Notes Modal
window.openRejectNotesModal = function(recId, type = 'yearwise') {
  let rec, dept, title;
  if (type === 'yearwise') {
    rec = state.yearwiseRecords.find(r => r.id === recId);
    if (!rec) return;
    dept = state.departments.find(d => d.id === rec.departmentId);
    title = `${dept?.name || rec.departmentId} (AY ${rec.academicYear})`;
  } else {
    rec = state.submissions.find(s => s.id === recId);
    if (!rec) return;
    dept = state.departments.find(d => d.id === rec.departmentId);
    title = `${dept?.name || rec.departmentId} - ${rec.criterionId?.toUpperCase()}`;
  }

  const modalOverlay = document.getElementById('workflow-modal-overlay');
  const modalContent = document.getElementById('workflow-modal-content');

  modalContent.innerHTML = `
    <div class="ios-modal-head" style="background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%); border-bottom: 2px solid #FECACA;">
      <h3 style="font-size: 16.5px; font-weight: 800; color: #DC2626; margin: 0; display: flex; align-items: center; gap: 8px;">
        <i class="fas fa-exclamation-circle" style="color: #DC2626; font-size: 20px;"></i>
        <span>Return Submission for Revision with Notes</span>
      </h3>
      <button class="ios-modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="ios-modal-body" style="padding: 20px;">
      <!-- Submission Details Context -->
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px;">
        <div class="modal-two-col">
          <div><strong style="color: #0F172A;">Target:</strong> ${title}</div>
          <div><strong style="color: #0F172A;">Current Status:</strong> ${renderIOSStatusTag(rec.status)}</div>
          <div><strong style="color: #0F172A;">Submitted By:</strong> ${rec.author || dept?.coordinator || 'Coordinator'}</div>
          <div><strong style="color: #0F172A;">Reviewer:</strong> ${state.currentUser?.name} (${formatRoleName(state.currentUser?.role)})</div>
        </div>
      </div>

      <!-- Quick Preset Selection Chips -->
      <div style="margin-bottom: 14px;">
        <label class="ios-label" style="font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 8px; display: block;">
          <i class="fas fa-magic" style="color: #2563EB;"></i> Quick Rejection Presets (Click to Add):
        </label>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          <button type="button" class="ios-btn" style="background: #FFF; border: 1.5px solid #CBD5E1; color: #334155; font-size: 11.5px; font-weight: 700; padding: 5px 10px; border-radius: 6px;" onclick="appendRejectNote('Incomplete quantitative metrics in Excel sheet.')">
            + Incomplete Metrics
          </button>
          <button type="button" class="ios-btn" style="background: #FFF; border: 1.5px solid #CBD5E1; color: #334155; font-size: 11.5px; font-weight: 700; padding: 5px 10px; border-radius: 6px;" onclick="appendRejectNote('Incomplete data entered in template sheets.')">
            + Incomplete Sheets
          </button>
          <button type="button" class="ios-btn" style="background: #FFF; border: 1.5px solid #CBD5E1; color: #334155; font-size: 11.5px; font-weight: 700; padding: 5px 10px; border-radius: 6px;" onclick="appendRejectNote('Data discrepancy identified in submitted figures.')">
            + Data Discrepancy
          </button>
          <button type="button" class="ios-btn" style="background: #FFF; border: 1.5px solid #CBD5E1; color: #334155; font-size: 11.5px; font-weight: 700; padding: 5px 10px; border-radius: 6px;" onclick="appendRejectNote('Official template format altered or formulas broken. Please re-fill using unmodified official format.')">
            + Format / Formula Error
          </button>
          <button type="button" class="ios-btn" style="background: #FFF; border: 1.5px solid #CBD5E1; color: #334155; font-size: 11.5px; font-weight: 700; padding: 5px 10px; border-radius: 6px;" onclick="appendRejectNote('Academic Advisory Board requires revised faculty & student counts.')">
            + Advisory Recheck
          </button>
        </div>
      </div>

      <!-- Mandatory Rejection Notes Textarea -->
      <div class="ios-form-group" style="margin-bottom: 8px;">
        <label class="ios-label" style="font-size: 13px; font-weight: 800; color: #0F172A; display: flex; justify-content: space-between;">
          <span>Rejection Notes / Required Actions for Coordinator: <span style="color: #DC2626;">*</span></span>
          <span style="font-weight: 700; color: #DC2626; font-size: 11.5px;">Mandatory</span>
        </label>
        <textarea id="reject-modal-notes" class="ios-input" rows="4" style="font-size: 13px; font-weight: 600; border: 2px solid #FCA5A5; line-height: 1.5;" placeholder="Enter specific reasons for rejection and explicit instructions on what the coordinator needs to fix..."></textarea>
      </div>
      <div style="font-size: 11.5px; color: #64748B; font-weight: 600;">
        <i class="fas fa-info-circle"></i> These notes will be displayed directly to the coordinator with an urgent revision alert.
      </div>
    </div>
    <div class="ios-modal-foot" style="display: flex; justify-content: space-between; gap: 10px; background: #F8FAFC; border-top: 1.5px solid #E2E8F0;">
      <button type="button" class="ios-btn" style="background: #E2E8F0; color: #334155; font-weight: 800; padding: 9px 18px; border-radius: 8px;" onclick="closeModal()">
        Cancel
      </button>
      <button type="button" class="ios-btn" style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: #FFF; font-size: 13px; font-weight: 800; padding: 9px 20px; border-radius: 8px; box-shadow: 0 3px 10px rgba(220, 38, 38, 0.35);" onclick="executeRejectWithNotes('${recId}', '${type}')">
        <i class="fas fa-undo"></i> Confirm Rejection & Send Notes
      </button>
    </div>
  `;

  modalOverlay.style.display = 'flex';
  setTimeout(() => {
    const el = document.getElementById('reject-modal-notes');
    if (el) el.focus();
  }, 100);
};

window.appendRejectNote = function(text) {
  const el = document.getElementById('reject-modal-notes');
  if (!el) return;
  if (!el.value.trim()) {
    el.value = text;
  } else {
    el.value = el.value.trim() + ' ' + text;
  }
};

window.executeRejectWithNotes = async function(recId, type = 'yearwise') {
  const notesInput = document.getElementById('reject-modal-notes');
  const remarks = notesInput ? notesInput.value.trim() : '';

  if (!remarks) {
    showToast('Please enter rejection notes explaining the required revisions.', 'error');
    if (notesInput) notesInput.focus();
    return;
  }

  const endpoint = type === 'yearwise' ? `/api/yearwise-records/${recId}/workflow` : `/api/submissions/${recId}/workflow`;
  const action = state.currentUser?.role === 'hod' ? 'reject_by_hod' : 'return_for_revision';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        remarks,
        actorName: state.currentUser?.name || 'Reviewer',
        actorRole: state.currentUser?.role || 'admin_coordinator'
      })
    }).then(r => r.json());

    if (res.success) {
      closeModal();
      showToast('Submission returned for revision with notes successfully.', 'success');
      await loadInitialData();
      renderActiveView();
    } else {
      showToast(res.error || 'Failed to reject submission.', 'error');
    }
  } catch (err) {
    console.debug('Reject submission notice:', err);
    showToast('Failed to reject submission.', 'error');
  }
};

// Clean iOS Auth Mode Switcher (Sign In vs Register)
window.switchAuthMode = function(mode) {
  const loginBtn = document.getElementById('tab-auth-login');
  const regBtn = document.getElementById('tab-auth-register');
  const loginSec = document.getElementById('login-section');
  const regSec = document.getElementById('register-section');
  const loginErr = document.getElementById('login-error-msg');
  const regMsg = document.getElementById('register-msg');

  if (loginErr) loginErr.style.display = 'none';
  if (regMsg) regMsg.style.display = 'none';

  if (mode === 'register') {
    loginBtn?.classList.remove('active');
    regBtn?.classList.add('active');
    if (loginSec) loginSec.style.display = 'none';
    if (regSec) regSec.style.display = 'block';

    const regDeptSelect = document.getElementById('reg-dept-select');
    if (regDeptSelect && (!regDeptSelect.options || regDeptSelect.options.length === 0)) {
      regDeptSelect.innerHTML = (state.departments || []).map(d => 
        `<option value="${d.id}">${d.name} (${d.code})</option>`
      ).join('');
    }
  } else {
    regBtn?.classList.remove('active');
    loginBtn?.classList.add('active');
    if (regSec) regSec.style.display = 'none';
    if (loginSec) loginSec.style.display = 'block';
  }
};

// Clean Password Visibility Toggle
window.togglePasswordVisibility = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
      btn.style.color = isPass ? 'var(--ios-primary)' : '#8E8E93';
    }
  }
};

window.showLoginHelp = function() {
  const modalOverlay = document.getElementById('workflow-modal-overlay');
  const modalContent = document.getElementById('workflow-modal-content');
  if (modalOverlay && modalContent) {
    modalContent.innerHTML = `
      <div style="padding: 12px;">
        <h3 style="font-size: 16px; font-weight: 800; color: #0F172A; margin-bottom: 10px;">
          <i class="fas fa-shield-alt" style="color: var(--ios-primary); margin-right: 6px;"></i> BIGCE Portal Access Help
        </h3>
        <div style="font-size: 13px; font-weight: 700; color: #1E293B; line-height: 1.6; margin-bottom: 16px; background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 14px;">
          <p style="margin-bottom: 8px;"><strong>• Institutional Credentials:</strong> Use your official administrative User ID & Password assigned by the college.</p>
          <p style="margin-bottom: 8px;"><strong>• Administration:</strong> IQAC Director, Principal (Dr. Anil K. Deshamne), and President (Hon. Ravindraji Gaikwad).</p>
          <p style="margin-bottom: 0;"><strong>• Faculty & Coordinators:</strong> Switch to the "Register" tab to create your individual institutional account.</p>
        </div>
        <button class="ios-btn ios-btn-primary" style="width: 100%; font-weight: 800; padding: 10px;" onclick="closeModal()">
          Got It
        </button>
      </div>
    `;
    modalOverlay.style.display = 'flex';
  } else {
    showToast('Sign in with your institutional credentials or register a new faculty account.', 'info');
  }
};

window.handleMainLogin = async function(e) {
  e.preventDefault();
  const u = document.getElementById('login-username-input').value.trim();
  const p = document.getElementById('login-password-input').value.trim();
  const errBox = document.getElementById('login-error-msg');
  const remember = document.getElementById('remember-me-checkbox')?.checked;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();
    if (data.success) {
      if (remember) {
        localStorage.setItem('bigce_saved_username', u);
      } else {
        localStorage.removeItem('bigce_saved_username');
      }
      state.currentUser = data.user;
      localStorage.setItem('bigce_auth_user', JSON.stringify(data.user));
      state.activeTab = null;
      showAuthenticatedApp();
    } else {
      errBox.textContent = data.error || 'Invalid credentials. Please verify your username & password.';
      errBox.style.display = 'block';
    }
  } catch (err) {
    errBox.textContent = 'Server connection error. Please verify the backend is active.';
    errBox.style.display = 'block';
  }
};

window.handleMainRegister = async function(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name-input').value.trim();
  const email = document.getElementById('reg-email-input').value.trim();
  const departmentId = document.getElementById('reg-dept-select').value;
  const role = document.getElementById('reg-role-select').value;
  const username = document.getElementById('reg-username-input').value.trim();
  const password = document.getElementById('reg-password-input').value.trim();
  const msgBox = document.getElementById('register-msg');
  const submitBtn = document.getElementById('reg-submit-btn');

  if (!name || !username || !password || !email) {
    msgBox.style.display = 'block';
    msgBox.style.background = '#FEE2E2';
    msgBox.style.border = '1.5px solid #EF4444';
    msgBox.style.color = '#991B1B';
    msgBox.style.fontWeight = '700';
    msgBox.textContent = 'Please fill all required fields including your Gmail address.';
    return;
  }

  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail.endsWith('@gmail.com') || cleanEmail.length <= 10) {
    msgBox.style.display = 'block';
    msgBox.style.background = '#FEE2E2';
    msgBox.style.border = '1.5px solid #EF4444';
    msgBox.style.color = '#991B1B';
    msgBox.style.fontWeight = '700';
    msgBox.textContent = 'Invalid email. Please enter a valid Gmail address ending with @gmail.com';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: cleanEmail,
        departmentId,
        role,
        username,
        password
      })
    });
    const data = await res.json();
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Create Institutional Account</span><i class="fas fa-check-circle"></i>';

    if (data.success) {
      msgBox.style.display = 'block';
      msgBox.style.background = '#DCFCE7';
      msgBox.style.border = '1px solid #86EFAC';
      msgBox.style.color = '#15803D';
      msgBox.innerHTML = '<i class="fas fa-check-circle"></i> Account created! Logging you in...';
      
      // Auto-login into dashboard
      setTimeout(() => {
        state.currentUser = data.user;
        localStorage.setItem('bigce_auth_user', JSON.stringify(data.user));
        state.activeTab = null;
        showAuthenticatedApp();
      }, 700);
    } else {
      msgBox.style.display = 'block';
      msgBox.style.background = '#FEE2E2';
      msgBox.style.border = '1px solid #EF4444';
      msgBox.style.color = '#991B1B';
      msgBox.textContent = data.error || 'Registration failed. Please check your inputs.';
    }
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Create Institutional Account</span><i class="fas fa-check-circle"></i>';
    msgBox.style.display = 'block';
    msgBox.style.background = '#FEE2E2';
    msgBox.style.border = '1px solid #EF4444';
    msgBox.style.color = '#991B1B';
    msgBox.textContent = 'Server connection error during registration.';
  }
};

window.handleLogout = function() {
  localStorage.removeItem('bigce_auth_user');
  state.currentUser = null;
  state.activeTab = null;
  showLoginScreen();
};

window.closeModal = function() {
  const modalOverlay = document.getElementById('workflow-modal-overlay');
  if (modalOverlay) modalOverlay.style.display = 'none';
};

// ==========================================================================
// UNIVERSAL IN-PORTAL DOCUMENT & SPREADSHEET VIEWER (Excel, PDF, CSV, Images)
// ==========================================================================
window.closeFileViewer = function() {
  const overlay = document.getElementById('file-viewer-overlay');
  if (overlay) overlay.style.display = 'none';
  const content = document.getElementById('file-viewer-content');
  if (content) content.innerHTML = '';
};

// Universal Close for all modals and dialogs on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const fileViewer = document.getElementById('file-viewer-overlay');
    if (fileViewer && fileViewer.style.display !== 'none') {
      window.closeFileViewer();
      return;
    }
    const workflowModal = document.getElementById('workflow-modal-overlay');
    if (workflowModal && workflowModal.style.display !== 'none') {
      window.closeModal();
      return;
    }
    const uploadOverlay = document.getElementById('global-upload-modal-overlay');
    if (uploadOverlay && uploadOverlay.style.display !== 'none') {
      window.closeUploadProgress();
      return;
    }
  }
});

window.openFileViewer = async function(fileOrPayload, customTitle) {
  let file = null;
  if (typeof fileOrPayload === 'string') {
    try {
      file = JSON.parse(decodeURIComponent(fileOrPayload));
    } catch (e) {
      file = { url: fileOrPayload, name: customTitle || 'Document' };
    }
  } else {
    file = fileOrPayload;
  }

  if (!file) {
    showToast('Document reference not found', 'warning');
    return;
  }

  const filename = file.name || file.filename || customTitle || 'BIGCE_Document';
  const downloadUrl = getFileDownloadUrl(file);
  const viewUrl = getFileViewUrl(file);
  const ext = (filename.split('.').pop() || '').toLowerCase();

  const overlay = document.getElementById('file-viewer-overlay');
  const content = document.getElementById('file-viewer-content');
  if (!overlay || !content) return;

  overlay.style.display = 'flex';

  const fileIconInfo = window.getFileIconInfo ? window.getFileIconInfo(filename) : { icon: 'fa-file', color: '#38BDF8' };

  // Loading indicator
  content.innerHTML = `
    <div class="file-viewer-head">
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas ${fileIconInfo.icon}" style="font-size: 20px; color: ${fileIconInfo.color};"></i>
        <div>
          <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #FFF;">${customTitle || filename}</h4>
          <span style="font-size: 11px; color: #94A3B8;">Loading institutional document from repository...</span>
        </div>
      </div>
      <button class="ios-modal-close" style="background: rgba(255,255,255,0.15); color: #FFF;" onclick="closeFileViewer()">&times;</button>
    </div>
    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; background: #FFF;">
      <div style="width: 44px; height: 44px; border: 3.5px solid #E2E8F0; border-top-color: #2563EB; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px;"></div>
      <div style="font-size: 15px; font-weight: 800; color: #0F172A;">Opening Document Viewer...</div>
      <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Preparing preview and document structure</div>
    </div>
  `;

  // 1. SPREADSHEETS (.xlsx, .xls, .xlsm, .xlsb, .csv, .ods, .tsv)
  if (['xlsx', 'xls', 'xlsm', 'xlsb', 'csv', 'ods', 'tsv'].includes(ext)) {
    try {
      const resp = await fetch(downloadUrl);
      if (!resp.ok) throw new Error('File download failed');
      const arrayBuffer = await resp.arrayBuffer();

      if (typeof XLSX === 'undefined') {
        throw new Error('SheetJS library not initialized');
      }

      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetNames = workbook.SheetNames || [];
      if (!sheetNames.length) throw new Error('No sheets found in workbook');

      let currentSheetIdx = 0;

      const renderSheet = (sheetIdx, searchFilter = '') => {
        currentSheetIdx = sheetIdx;
        const sheetName = sheetNames[sheetIdx];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        const q = (searchFilter || '').trim().toLowerCase();
        let displayRows = rawRows;
        if (q && rawRows.length > 1) {
          const header = rawRows[0];
          const filtered = rawRows.slice(1).filter(row => 
            row.some(cell => String(cell).toLowerCase().includes(q))
          );
          displayRows = [header, ...filtered];
        }

        const totalCols = displayRows.reduce((max, r) => Math.max(max, r.length), 0);

        let tableHtml = `<table class="excel-grid-table">`;
        if (displayRows.length > 0) {
          tableHtml += `<thead><tr><th class="excel-row-num">#</th>`;
          const headerCells = displayRows[0];
          for (let colIdx = 0; colIdx < totalCols; colIdx++) {
            const cellVal = headerCells[colIdx] !== undefined ? headerCells[colIdx] : '';
            tableHtml += `<th>${cellVal !== '' ? String(cellVal).trim() : `Col ${colIdx + 1}`}</th>`;
          }
          tableHtml += `</tr></thead><tbody>`;

          for (let rowIdx = 1; rowIdx < displayRows.length; rowIdx++) {
            const rowData = displayRows[rowIdx];
            tableHtml += `<tr><td class="excel-row-num">${rowIdx}</td>`;
            for (let colIdx = 0; colIdx < totalCols; colIdx++) {
              const cellVal = rowData[colIdx] !== undefined ? rowData[colIdx] : '';
              let formatted = String(cellVal);
              if (q && formatted.toLowerCase().includes(q)) {
                formatted = `<span style="background: #FEF08A; padding: 1px 4px; border-radius: 2px; font-weight: 800;">${formatted}</span>`;
              }
              tableHtml += `<td>${formatted}</td>`;
            }
            tableHtml += `</tr>`;
          }
          tableHtml += `</tbody>`;
        } else {
          tableHtml += `<tbody><tr><td colspan="${totalCols || 1}" style="text-align: center; padding: 40px; color: #64748B;">This sheet is empty.</td></tr></tbody>`;
        }
        tableHtml += `</table>`;

        const tableContainer = document.getElementById('viewer-excel-table-box');
        if (tableContainer) tableContainer.innerHTML = tableHtml;

        const infoBadge = document.getElementById('viewer-stats-badge');
        if (infoBadge) {
          const rowCount = Math.max(0, displayRows.length - 1);
          infoBadge.innerHTML = `<i class="fas fa-table" style="color: #2563EB;"></i> <strong>${rowCount}</strong> Data Rows • <strong>${totalCols}</strong> Columns • Sheet: <strong>${sheetName}</strong> ${q ? `• Filtered: "${q}"` : ''}`;
        }

        document.querySelectorAll('.excel-sheet-tab').forEach((tab, idx) => {
          if (idx === sheetIdx) tab.classList.add('active');
          else tab.classList.remove('active');
        });
      };

      content.innerHTML = `
        <div class="file-viewer-head">
          <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
            <div style="width: 34px; height: 34px; border-radius: 8px; background: rgba(37,99,235,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i class="fas fa-file-excel" style="color: #38BDF8; font-size: 18px;"></i>
            </div>
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #FFF; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${customTitle || filename}
              </h4>
              <span style="font-size: 11px; color: #94A3B8;">${file.size || ''} • In-Portal Spreadsheet Viewer • BIGCE Solapur</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <a href="${downloadUrl}" download="${filename}" class="ios-btn" style="background: #10B981; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 14px; border-radius: 7px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
              <i class="fas fa-download"></i> Download Original
            </a>
            <button type="button" class="ios-btn" style="background: rgba(255,255,255,0.15); color: #FFF; font-size: 11.5px; font-weight: 700; padding: 6px 12px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.2);" onclick="window.printSheet()">
              <i class="fas fa-print"></i> Print
            </button>
            <button class="ios-modal-close" style="background: rgba(255,255,255,0.18); color: #FFF;" onclick="closeFileViewer()">&times;</button>
          </div>
        </div>

        <div class="file-viewer-toolbar">
          <div id="viewer-stats-badge" style="font-size: 12.5px; font-weight: 700; color: #0F172A; display: flex; align-items: center; gap: 8px;">
            <!-- Injected by renderSheet -->
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="position: relative;">
              <i class="fas fa-search" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 11px; color: #94A3B8;"></i>
              <input type="text" id="viewer-search-input" placeholder="Search table cells..." style="font-size: 12px; font-weight: 600; padding: 6px 10px 6px 28px; border: 1.5px solid #CBD5E1; border-radius: 8px; width: 220px; outline: none;" oninput="window.handleViewerFilter(event)" />
            </div>
          </div>
        </div>

        <div class="file-viewer-body">
          <div id="viewer-excel-table-box" class="excel-table-container"></div>
        </div>

        ${sheetNames.length > 0 ? `
          <div class="excel-sheet-tabs">
            ${sheetNames.map((sName, sIdx) => `
              <button type="button" class="excel-sheet-tab ${sIdx === 0 ? 'active' : ''}" onclick="window.switchViewerSheet(${sIdx})">
                <i class="fas fa-table" style="font-size: 10px; margin-right: 4px;"></i> ${sName}
              </button>
            `).join('')}
          </div>
        ` : ''}
      `;

      window.switchViewerSheet = (sIdx) => {
        const query = document.getElementById('viewer-search-input')?.value || '';
        renderSheet(sIdx, query);
      };

      window.handleViewerFilter = (e) => {
        renderSheet(currentSheetIdx, e.target.value);
      };

      window.printSheet = () => {
        const printContent = document.getElementById('viewer-excel-table-box')?.innerHTML || '';
        const printWindow = window.open('', '', 'width=1100,height=800');
        printWindow.document.write(`
          <html>
            <head>
              <title>${filename} - Print View</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
                table { border-collapse: collapse; width: 100%; font-size: 12px; }
                th, td { border: 1px solid #CBD5E1; padding: 6px 8px; text-align: left; }
                th { background: #E2E8F0; font-weight: bold; }
                .excel-row-num { background: #F1F5F9; font-weight: bold; width: 34px; text-align: center; }
              </style>
            </head>
            <body>
              <h2 style="margin-bottom: 4px; font-size: 16px;">${customTitle || filename}</h2>
              <p style="font-size: 11px; color: #64748B; margin-top: 0;">Institutional SSR Document • BIGCE Solapur</p>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      };

      renderSheet(0);

    } catch (err) {
      console.error('Excel parse error:', err);
      content.innerHTML = `
        <div class="file-viewer-head">
          <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #FFF;">${filename}</h4>
          <button class="ios-modal-close" style="background: rgba(255,255,255,0.15); color: #FFF;" onclick="closeFileViewer()">&times;</button>
        </div>
        <div style="padding: 40px; text-align: center; background: #FFF; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <i class="fas fa-exclamation-triangle" style="font-size: 40px; color: #D97706; margin-bottom: 12px;"></i>
          <h4 style="font-size: 16px; font-weight: 800; color: #0F172A; margin-bottom: 8px;">Direct Preview Notice</h4>
          <p style="font-size: 13px; color: #64748B; max-width: 480px; margin: 0 auto 20px auto;">
            Interactive grid rendering could not parse this format directly (${err.message}). You can download the official document to open in Microsoft Excel.
          </p>
          <a href="${downloadUrl}" download="${filename}" class="ios-btn" style="background: #2563EB; color: #FFF; font-weight: 800; padding: 10px 22px; font-size: 13px; border-radius: 8px; text-decoration: none;">
            <i class="fas fa-download"></i> Download & Open in Excel
          </a>
        </div>
      `;
    }
    return;
  }

  // 2. PDF VIEWER (.pdf)
  if (ext === 'pdf') {
    content.innerHTML = `
      <div class="file-viewer-head">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(239,68,68,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="fas fa-file-pdf" style="color: #F87171; font-size: 16px;"></i>
          </div>
          <div>
            <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #FFF;">${customTitle || filename}</h4>
            <span style="font-size: 11px; color: #94A3B8;">PDF Document Reader • In-Portal</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <a href="${downloadUrl}" download="${filename}" class="ios-btn" style="background: #10B981; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 14px; border-radius: 7px; text-decoration: none;">
            <i class="fas fa-download"></i> Download
          </a>
          <button class="ios-modal-close" style="background: rgba(255,255,255,0.18); color: #FFF;" onclick="closeFileViewer()">&times;</button>
        </div>
      </div>
      <div style="flex: 1; background: #525659;">
        <iframe src="${viewUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
      </div>
    `;
    return;
  }

  // 3. IMAGE VIEWER (.png, .jpg, .jpeg, .webp, .gif)
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    content.innerHTML = `
      <div class="file-viewer-head">
        <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #FFF;">${customTitle || filename}</h4>
        <div style="display: flex; align-items: center; gap: 8px;">
          <a href="${downloadUrl}" download="${filename}" class="ios-btn" style="background: #10B981; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 14px; border-radius: 7px; text-decoration: none;">
            <i class="fas fa-download"></i> Download
          </a>
          <button class="ios-modal-close" style="background: rgba(255,255,255,0.18); color: #FFF;" onclick="closeFileViewer()">&times;</button>
        </div>
      </div>
      <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #0F172A; padding: 20px; overflow: auto;">
        <img src="${viewUrl}" alt="${filename}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
      </div>
    `;
    return;
  }

  // 4. TEXT & CODE DOCUMENTS (.txt, .log, .json, .md, .xml, .html)
  if (['txt', 'log', 'json', 'md', 'xml', 'html'].includes(ext)) {
    try {
      const resp = await fetch(downloadUrl);
      const text = await resp.text();
      content.innerHTML = `
        <div class="file-viewer-head">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(56,189,248,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i class="fas fa-file-alt" style="color: #38BDF8; font-size: 16px;"></i>
            </div>
            <div>
              <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #FFF;">${customTitle || filename}</h4>
              <span style="font-size: 11px; color: #94A3B8;">Text Document Viewer • In-Portal</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <a href="${downloadUrl}" download="${filename}" class="ios-btn" style="background: #10B981; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 14px; border-radius: 7px; text-decoration: none;">
              <i class="fas fa-download"></i> Download
            </a>
            <button class="ios-modal-close" style="background: rgba(255,255,255,0.18); color: #FFF;" onclick="closeFileViewer()">&times;</button>
          </div>
        </div>
        <div style="flex: 1; padding: 24px; overflow: auto; background: #0F172A; color: #E2E8F0; font-family: 'Fira Code', Consolas, monospace; font-size: 13px; white-space: pre-wrap; line-height: 1.6;">
          ${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
      `;
      return;
    } catch (e) { }
  }

  // 5. OTHER DOCUMENTS (Word, PowerPoint, Archives, etc.)
  const fallbackIcon = window.getFileIconInfo ? window.getFileIconInfo(filename) : { icon: 'fa-file-alt', color: '#2563EB', label: 'Document' };
  content.innerHTML = `
    <div class="file-viewer-head">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <i class="fas ${fallbackIcon.icon}" style="color: ${fallbackIcon.color}; font-size: 16px;"></i>
        </div>
        <div>
          <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #FFF;">${customTitle || filename}</h4>
          <span style="font-size: 11px; color: #94A3B8;">${fallbackIcon.label} • Institutional Repository</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <a href="${downloadUrl}" download="${filename}" class="ios-btn" style="background: #10B981; color: #FFF; font-size: 11.5px; font-weight: 800; padding: 6px 14px; border-radius: 7px; text-decoration: none;">
          <i class="fas fa-download"></i> Download
        </a>
        <button class="ios-modal-close" style="background: rgba(255,255,255,0.18); color: #FFF;" onclick="closeFileViewer()">&times;</button>
      </div>
    </div>
    <div style="padding: 40px; text-align: center; background: #FFF; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div style="width: 72px; height: 72px; border-radius: 18px; background: #F8FAFC; border: 2px solid #E2E8F0; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <i class="fas ${fallbackIcon.icon}" style="font-size: 36px; color: ${fallbackIcon.color};"></i>
      </div>
      <h4 style="font-size: 17px; font-weight: 800; color: #0F172A; margin-bottom: 6px;">${filename}</h4>
      <p style="font-size: 13px; color: #64748B; max-width: 440px; margin-bottom: 20px;">
        Official ${fallbackIcon.label} is preserved and verified. You can open it in its native application or download a local copy.
      </p>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
        <a href="${viewUrl}" target="_blank" class="ios-btn" style="background: #2563EB; color: #FFF; font-weight: 800; padding: 9px 18px; font-size: 12.5px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <i class="fas fa-external-link-alt"></i> Open in New Tab
        </a>
        <a href="${downloadUrl}" download="${filename}" class="ios-btn" style="background: #0F172A; color: #FFF; font-weight: 800; padding: 9px 18px; font-size: 12.5px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <i class="fas fa-download"></i> Download File
        </a>
      </div>
    </div>
  `;
};
