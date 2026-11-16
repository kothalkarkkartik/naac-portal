const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');

// Initialize Official Firebase Admin SDK on Backend
let adminDb = null;
try {
  const { initializeApp, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  let serviceAccount = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch(e) {}
  } else if (fs.existsSync(path.join(__dirname, 'firebase-admin-key.json'))) {
    serviceAccount = require('./firebase-admin-key.json');
  }

  if (serviceAccount) {
    const fbAdminApp = initializeApp({
      credential: cert(serviceAccount)
    });
    adminDb = getFirestore(fbAdminApp);
    console.log('Institutional Cloud Database (Firebase Admin): Connected Successfully');
  }
} catch (fbErr) {
  console.debug('Firebase Admin notice:', fbErr.message);
}

// Helper to sync record to Cloud Database
async function syncToFirestore(collectionName, docId, data) {
  if (!adminDb) return;
  try {
    await adminDb.collection(collectionName).doc(String(docId)).set({
      ...data,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.debug(`Firestore sync notice (${collectionName}):`, err.message);
  }
}

// Helper to delete record from Cloud Database
async function deleteFromFirestore(collectionName, docId) {
  if (!adminDb) return;
  try {
    await adminDb.collection(collectionName).doc(String(docId)).delete();
  } catch (err) {
    console.debug(`Firestore delete notice (${collectionName}):`, err.message);
  }
}

// Helper for full Cloud Sync
async function syncAllToFirestore() {
  if (!adminDb) return { success: false, message: 'Firestore Admin not initialized' };
  try {
    const depts = readData('departments.json');
    for (const d of depts) {
      await syncToFirestore('departments', d.id, d);
    }
    const users = readData('users.json');
    for (const u of users) {
      const { password, ...safeUser } = u;
      await syncToFirestore('users', u.id, safeUser);
    }
    const folders = readData('format_folders.json');
    for (const f of folders) {
      await syncToFirestore('format_folders', f.id, f);
    }
    const yearwise = readData('yearwise_records.json');
    for (const y of yearwise) {
      await syncToFirestore('yearwise_records', y.id, y);
    }
    const submissions = readData('criteria_data.json');
    for (const s of submissions) {
      await syncToFirestore('naac_submissions', s.id, s);
    }
    const masterTpl = readData('master_template.json');
    if (masterTpl) {
      await syncToFirestore('master_template', 'current', masterTpl);
    }
    return { success: true, count: depts.length + users.length + folders.length + yearwise.length + submissions.length };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload setup (Memory storage on Vercel serverless, disk storage locally)
const isVercelEnv = !!(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);
const storage = isVercelEnv
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: function (req, file, cb) {
        const dest = path.join(__dirname, 'uploads');
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitized);
      }
    });
const upload = multer({ storage: storage });

// In-memory data cache for fast serverless reads
const dataCache = {};

// Helper to read JSON
function readData(file) {
  if (dataCache[file]) {
    return dataCache[file];
  }
  const tmpPath = path.join(os.tmpdir(), 'data', file);
  if (fs.existsSync(tmpPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));
      dataCache[file] = data;
      return data;
    } catch (e) {}
  }
  const filePath = path.join(__dirname, 'data', file);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    dataCache[file] = data;
    return data;
  } catch (e) {
    return [];
  }
}

// Helper to write JSON (Supports serverless tmp fallback if root is read-only)
function writeData(file, data) {
  dataCache[file] = data;
  try {
    const filePath = path.join(__dirname, 'data', file);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    try {
      const tmpDir = path.join(os.tmpdir(), 'data');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, file), JSON.stringify(data, null, 2), 'utf-8');
    } catch (e2) {}
  }
}

// Helper to log activities
function logActivity(action, actor, details, dept = null) {
  const logs = readData('logs.json') || [];
  const newLog = {
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    action,
    actor,
    details,
    dept
  };
  logs.unshift(newLog);
  if (logs.length > 200) logs.pop();
  writeData('logs.json', logs);
}

// Ensure logs.json exists
if (!fs.existsSync(path.join(__dirname, 'data', 'logs.json'))) {
  writeData('logs.json', []);
}

// --- API ENDPOINTS ---

// 1. Get Departments
app.get('/api/departments', (req, res) => {
  const departments = readData('departments.json');
  const submissions = readData('criteria_data.json');

  // Enrich departments with submission stats
  const enriched = departments.map(d => {
    const deptSubs = submissions.filter(s => s.departmentId === d.id);
    const approvedCount = deptSubs.filter(s => ['approved_by_principal', 'endorsed_by_president'].includes(s.status)).length;
    const inReviewCount = deptSubs.filter(s => ['submitted_to_hod', 'approved_by_hod', 'verified_by_iqac'].includes(s.status)).length;
    const draftCount = deptSubs.filter(s => s.status === 'draft').length;

    // Average score
    const scores = deptSubs.map(s => s.quantitativeScore || 80);
    const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;

    return {
      ...d,
      totalSubmissions: deptSubs.length,
      approvedCount,
      inReviewCount,
      draftCount,
      avgScore: Number(avgScore)
    };
  });

  res.json(enriched);
});

// 2. Get Users (Fetched directly from Cloud Firestore)
app.get('/api/users', async (req, res) => {
  let users = [];
  if (adminDb) {
    try {
      const snap = await adminDb.collection('users').get();
      if (!snap.empty) {
        const fullUsers = [];
        snap.forEach(d => {
          const data = d.data();
          fullUsers.push({ id: d.id, ...data });
          const { password, ...safe } = data;
          users.push({ id: d.id, ...safe });
        });
        // Keep local cache in sync with Cloud Firestore
        writeData('users.json', fullUsers);
      }
    } catch (err) {
      console.debug('Firestore users fetch notice:', err.message);
    }
  }

  // Fallback to local users.json if Firestore returned empty or network unavailable
  if (users.length === 0) {
    const localUsers = readData('users.json');
    users = localUsers.map(u => {
      const { password, ...safe } = u;
      return safe;
    });
  }

  res.json(users);
});

// 3. Login (Authenticated directly against Cloud Firestore)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username or Gmail address and password are required.' });
  }

  const queryIdentifier = username.trim().toLowerCase();
  let user = null;

  // 1. Fetch directly from Cloud Firestore (users collection)
  if (adminDb) {
    try {
      const usersRef = adminDb.collection('users');
      // Match by username
      const usernameSnap = await usersRef.where('username', '==', queryIdentifier).limit(1).get();
      if (!usernameSnap.empty) {
        user = usernameSnap.docs[0].data();
        user.id = usernameSnap.docs[0].id;
      } else {
        // Match by email
        const emailSnap = await usersRef.where('email', '==', queryIdentifier).limit(1).get();
        if (!emailSnap.empty) {
          user = emailSnap.docs[0].data();
          user.id = emailSnap.docs[0].id;
        }
      }
    } catch (fbErr) {
      console.debug('Firestore login fetch notice:', fbErr.message);
    }
  }

  // Fallback to local users.json if Firestore did not find or network offline
  if (!user) {
    const localUsers = readData('users.json');
    user = localUsers.find(u =>
      (u.username && u.username.toLowerCase() === queryIdentifier) ||
      (u.email && u.email.toLowerCase() === queryIdentifier)
    );
  }

  // Verify Password (matches Firestore password or legacy default)
  const enteredPass = password.trim();
  const isValidPass = user && (user.password === enteredPass || (user.username === 'admin' && enteredPass === 'admin123'));

  if (!user || !isValidPass) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your username / Gmail and password.' });
  }

  logActivity('LOGIN', `${user.name} (${user.role})`, `User authenticated directly against Cloud Firestore`);

  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// 3b. Register New User Account
app.post('/api/auth/register', async (req, res) => {
  const { name, username, password, email, phone, role, departmentId, designation } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Full name, institutional username, and password are required.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.endsWith('@gmail.com') || cleanEmail.length <= 10) {
    return res.status(400).json({ error: 'Only valid Gmail addresses (@gmail.com) are accepted for registration.' });
  }

  // Check Firestore directly (Single Source of Truth)
  let usernameExists = false;
  let emailExists = false;

  if (adminDb) {
    try {
      const uSnap = await adminDb.collection('users').where('username', '==', cleanUsername).limit(1).get();
      if (!uSnap.empty) usernameExists = true;

      const eSnap = await adminDb.collection('users').where('email', '==', cleanEmail).limit(1).get();
      if (!eSnap.empty) emailExists = true;
    } catch (err) {
      console.debug('Firestore check notice:', err.message);
    }
  } else {
    const users = readData('users.json');
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) usernameExists = true;
    if (users.some(u => (u.email || '').toLowerCase() === cleanEmail)) emailExists = true;
  }

  if (usernameExists) {
    return res.status(400).json({ error: 'This username is already registered. Please choose another username or sign in.' });
  }
  if (emailExists) {
    return res.status(400).json({ error: 'This Gmail address is already registered. Please sign in or use another Gmail.' });
  }

  const assignedRole = role === 'hod' ? 'hod' : 'dept_coordinator';
  const assignedDesignation = designation || (assignedRole === 'hod' ? 'Head of Department' : 'Accreditation Coordinator');

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const newUser = {
    id: `usr-${Date.now()}`,
    username: cleanUsername,
    password: password.trim(),
    name: name.trim(),
    designation: assignedDesignation,
    role: assignedRole,
    departmentId: departmentId || null,
    email: cleanEmail,
    phone: phone ? phone.trim() : '',
    registeredAt: now
  };

  // Sync to Cloud Firestore with password for authentication
  await syncToFirestore('users', newUser.id, newUser);

  // Sync local cache
  const localUsers = readData('users.json').filter(u => u.username.toLowerCase() !== cleanUsername && (u.email || '').toLowerCase() !== cleanEmail);
  localUsers.push(newUser);
  writeData('users.json', localUsers);

  logActivity('REGISTER', `${newUser.name} (${newUser.role})`, `New user registered account for ${newUser.departmentId || 'Institution'}`);

  const { password: _, ...safeUser } = newUser;
  res.json({ success: true, message: 'Institutional account registered successfully!', user: safeUser });
});

// Delete Registered User (Admin only)
app.delete('/api/users/:id', (req, res) => {
  const users = readData('users.json');
  const target = users.find(u => u.id === req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'User not found.' });
  }
  if (['usr-admin', 'usr-principal', 'usr-president'].includes(target.id) || ['admin', 'principal', 'president'].includes(target.username)) {
    return res.status(403).json({ error: 'Cannot delete institutional leadership accounts.' });
  }
  const filtered = users.filter(u => u.id !== req.params.id);
  writeData('users.json', filtered);
  deleteFromFirestore('users', req.params.id);
  logActivity('DELETE_USER', 'Director IQAC', `Admin removed registered account: ${target.name} (${target.username})`);
  res.json({ success: true, message: `Account for ${target.name} removed successfully.` });
});

// 4. Get Submissions
app.get('/api/submissions', (req, res) => {
  let submissions = readData('criteria_data.json');
  const { departmentId, criterionId, status } = req.query;

  if (departmentId) {
    submissions = submissions.filter(s => s.departmentId === departmentId);
  }
  if (criterionId) {
    submissions = submissions.filter(s => s.criterionId === criterionId);
  }
  if (status) {
    submissions = submissions.filter(s => s.status === status);
  }

  res.json(submissions);
});

// 5. Get Submission by ID
app.get('/api/submissions/:id', (req, res) => {
  const submissions = readData('criteria_data.json');
  const submission = submissions.find(s => s.id === req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission record not found.' });
  }
  res.json(submission);
});

// 6. Create or Update Submission
app.post('/api/submissions', (req, res) => {
  const submissions = readData('criteria_data.json');
  const body = req.body;

  let existingIndex = submissions.findIndex(s =>
    s.id === body.id || (s.departmentId === body.departmentId && s.criterionId === body.criterionId && s.academicYear === (body.academicYear || '2024-2025'))
  );

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  if (existingIndex >= 0) {
    submissions[existingIndex] = {
      ...submissions[existingIndex],
      ...body,
      updatedAt: now
    };
    writeData('criteria_data.json', submissions);
    logActivity('UPDATE_SUBMISSION', body.author || 'User', `Updated ${body.criterionId?.toUpperCase()} for ${body.departmentId}`, body.departmentId);
    syncToFirestore('naac_submissions', submissions[existingIndex].id, submissions[existingIndex]);
    return res.json({ success: true, submission: submissions[existingIndex] });
  } else {
    const newSubmission = {
      id: `sub-${body.departmentId}-${body.criterionId}-${Date.now().toString().slice(-4)}`,
      status: 'draft',
      evidenceFiles: [],
      metrics: {},
      quantitativeScore: body.quantitativeScore || 85.0,
      createdAt: now,
      ...body
    };
    submissions.push(newSubmission);
    writeData('criteria_data.json', submissions);
    logActivity('CREATE_SUBMISSION', body.author || 'Coordinator', `Created ${body.criterionId?.toUpperCase()} record for ${body.departmentId}`, body.departmentId);
    syncToFirestore('naac_submissions', newSubmission.id, newSubmission);
    return res.json({ success: true, submission: newSubmission });
  }
});

// 7. Workflow Transition (Coordinator Submit, HOD Approval, IQAC Verification, Principal Approval, President Endorsement)
app.post('/api/submissions/:id/workflow', (req, res) => {
  const submissions = readData('criteria_data.json');
  const { action, remarks, actorName, actorRole } = req.body;
  const index = submissions.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  const sub = submissions[index];
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  switch (action) {
    case 'submit_to_hod':
      sub.status = 'submitted_to_hod';
      sub.coordinatorRemarks = remarks || sub.coordinatorRemarks;
      sub.coordinatorSubmittedAt = now;
      delete sub.rejectionNotes;
      delete sub.rejectedBy;
      delete sub.rejectedAt;
      delete sub.rejectedRole;
      logActivity('SUBMITTED_TO_HOD', actorName || 'Coordinator', `Submitted ${sub.criterionId.toUpperCase()} to HOD for review`, sub.departmentId);
      break;

    case 'approve_by_hod':
      sub.status = 'approved_by_hod';
      sub.hodRemarks = remarks || 'Approved by HOD and recommended for IQAC verification.';
      sub.hodApprovedAt = now;
      delete sub.rejectionNotes;
      delete sub.rejectedBy;
      delete sub.rejectedAt;
      delete sub.rejectedRole;
      logActivity('APPROVED_BY_HOD', actorName || 'HOD', `HOD verified and approved ${sub.criterionId.toUpperCase()}`, sub.departmentId);
      break;

    case 'reject_by_hod':
    case 'return_for_revision':
    case 'reject_by_iqac':
    case 'reject':
      sub.status = 'returned_for_revision';
      sub.rejectionNotes = remarks || 'Needs revision in response file.';
      sub.rejectedBy = actorName || 'Reviewer';
      sub.rejectedAt = now;
      sub.rejectedRole = actorRole || 'Reviewer';
      sub.hodRemarks = `Returned: ${remarks || 'Needs revision in response file.'}`;
      if (Array.isArray(sub.uploadedFiles)) {
        sub.uploadedFiles.forEach(f => {
          if (f && f.path && fs.existsSync(f.path)) {
            try { fs.unlinkSync(f.path); } catch (e) {}
          }
        });
      }
      sub.uploadedFiles = [];
      sub.excelFile = null;
      sub.fileDeletedOnReject = true;
      logActivity('RETURNED_FOR_REVISION', actorName || 'Reviewer', `Returned ${sub.criterionId.toUpperCase()} to Coordinator for revisions: ${remarks || ''} (Files deleted for re-upload)`, sub.departmentId);
      break;

    case 'verify_by_iqac':
      sub.status = 'verified_by_iqac';
      sub.iqacRemarks = remarks || 'Criteria metrics audited and verified by IQAC.';
      sub.iqacVerifiedAt = now;
      delete sub.rejectionNotes;
      delete sub.rejectedBy;
      delete sub.rejectedAt;
      delete sub.rejectedRole;
      logActivity('VERIFIED_BY_IQAC', actorName || 'IQAC Admin', `IQAC audited & verified ${sub.criterionId.toUpperCase()}`, sub.departmentId);
      break;

    case 'approve_by_principal':
      sub.status = 'approved_by_principal';
      sub.principalRemarks = remarks || 'Criterion performance verified and approved by Principal.';
      sub.principalApprovedAt = now;
      logActivity('PRINCIPAL_APPROVAL', actorName || 'Principal', `Principal sanctioned ${sub.criterionId.toUpperCase()} for institutional SSR`, sub.departmentId);
      break;

    case 'endorse_by_president':
      sub.status = 'endorsed_by_president';
      sub.presidentRemarks = remarks || 'Presidential Seal granted. Endorsed by Governing Council.';
      sub.presidentEndorsedAt = now;
      logActivity('PRESIDENTIAL_ENDORSEMENT', actorName || 'President', `Hon. President granted final Seal on ${sub.criterionId.toUpperCase()}`, sub.departmentId);
      break;

    default:
      return res.status(400).json({ error: 'Invalid workflow action' });
  }

  submissions[index] = sub;
  writeData('criteria_data.json', submissions);
  syncToFirestore('naac_submissions', sub.id, sub);
  res.json({ success: true, submission: sub });
});

// Helper for MIME Types
function getMimeType(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  switch (ext) {
    case '.xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case '.xls': return 'application/vnd.ms-excel';
    case '.pdf': return 'application/pdf';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.doc': return 'application/msword';
    case '.csv': return 'text/csv';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    default: return 'application/octet-stream';
  }
}

// White-Labeled Institutional File Stream & Download Handlers (No external storage URLs exposed)
async function handleFileStream(req, res, isDownload) {
  try {
    const rawFilename = req.params.filename || req.query.name || 'document';
    const cleanFilename = path.basename(decodeURIComponent(rawFilename));
    const token = req.query.f || req.query.src || '';
    let targetUrl = '';

    if (token) {
      try {
        targetUrl = Buffer.from(token, 'base64url').toString('utf8');
      } catch (e) {
        try {
          targetUrl = Buffer.from(token, 'base64').toString('utf8');
        } catch (e2) { }
      }
    }

    if (!targetUrl && (token.startsWith('http://') || token.startsWith('https://'))) {
      targetUrl = token;
    }

    // If local file path
    const localUploadPath = path.join(__dirname, 'uploads', cleanFilename);
    if (fs.existsSync(localUploadPath) && (!targetUrl || !targetUrl.startsWith('http'))) {
      const mime = getMimeType(cleanFilename);
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(cleanFilename)}"`);
      return res.sendFile(localUploadPath);
    }

    if (targetUrl.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, targetUrl.replace(/^\//, ''));
      if (fs.existsSync(localPath)) {
        const mime = getMimeType(cleanFilename);
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(cleanFilename)}"`);
        return res.sendFile(localPath);
      }
    }

    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      return res.status(404).send('Document not found or invalid reference.');
    }

    // Stream from institutional cloud storage without exposing external URLs
    const cloudRes = await fetch(targetUrl);
    if (!cloudRes.ok) {
      return res.status(cloudRes.status).send('Unable to retrieve file from institutional archive.');
    }

    const mime = getMimeType(cleanFilename) || cloudRes.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(cleanFilename)}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buffer = await cloudRes.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('File stream handler notice:', err.message);
    return res.status(500).send('File streaming error');
  }
}

app.get('/api/files/download/:filename', (req, res) => handleFileStream(req, res, true));
app.get('/api/files/download', (req, res) => handleFileStream(req, res, true));
app.get('/api/files/view/:filename', (req, res) => handleFileStream(req, res, false));
app.get('/api/files/view', (req, res) => handleFileStream(req, res, false));

// 8. Upload Evidence File (Cloudinary Unsigned Upload to wtlbrdk3 / naackk)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  let finalUrl = '/uploads/' + (req.file.filename || req.file.originalname);
  let cloudinaryPublicId = null;

  try {
    const fileBuffer = req.file.buffer || (req.file.path ? fs.readFileSync(req.file.path) : null);
    if (!fileBuffer) throw new Error('File buffer is empty');
    const blob = new Blob([fileBuffer], { type: req.file.mimetype || 'application/octet-stream' });
    const formData = new FormData();
    formData.append('file', blob, req.file.originalname);
    formData.append('upload_preset', 'naackk');
    formData.append('folder', 'naackk');

    const cldRes = await fetch('https://api.cloudinary.com/v1_1/wtlbrdk3/auto/upload', {
      method: 'POST',
      body: formData
    });
    const cldData = await cldRes.json();

    if (cldData && cldData.secure_url) {
      finalUrl = cldData.secure_url;
      cloudinaryPublicId = cldData.public_id;
    }
  } catch (cldErr) { }

  const cleanOriginalName = req.file.originalname || req.file.filename;
  const token = Buffer.from(finalUrl).toString('base64url');
  const whiteLabeledDownloadUrl = `/api/files/download/${encodeURIComponent(cleanOriginalName)}?f=${token}`;
  const whiteLabeledViewUrl = `/api/files/view/${encodeURIComponent(cleanOriginalName)}?f=${token}`;

  const fileInfo = {
    name: cleanOriginalName,
    filename: req.file.filename,
    size: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
    uploadDate: new Date().toISOString().split('T')[0],
    url: whiteLabeledDownloadUrl,
    viewUrl: whiteLabeledViewUrl,
    storageUrl: finalUrl,
    cloudinaryId: cloudinaryPublicId
  };

  res.json({ success: true, file: fileInfo });
});

// 9. Attach Evidence to Submission
app.post('/api/submissions/:id/attach-evidence', (req, res) => {
  const submissions = readData('criteria_data.json');
  const index = submissions.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  const file = req.body.file;
  if (!file) {
    return res.status(400).json({ error: 'File details missing' });
  }
  submissions[index].evidenceFiles = submissions[index].evidenceFiles || [];
  submissions[index].evidenceFiles.push(file);
  writeData('criteria_data.json', submissions);

  logActivity('ATTACH_EVIDENCE', req.body.author || 'User', `Uploaded evidence "${file.name}" to ${submissions[index].criterionId.toUpperCase()}`, submissions[index].departmentId);
  res.json({ success: true, submission: submissions[index] });
});

// 10. Institutional Stats & Metrics
app.get('/api/stats', (req, res) => {
  const departments = readData('departments.json');
  const submissions = readData('criteria_data.json');

  const totalPossible = departments.length * 7; // 14 depts * 7 criteria
  const totalCreated = submissions.length;
  const endorsed = submissions.filter(s => s.status === 'endorsed_by_president').length;
  const principalApproved = submissions.filter(s => s.status === 'approved_by_principal').length;
  const iqacVerified = submissions.filter(s => s.status === 'verified_by_iqac').length;
  const hodApproved = submissions.filter(s => s.status === 'approved_by_hod').length;
  const submittedHod = submissions.filter(s => s.status === 'submitted_to_hod').length;
  const drafts = submissions.filter(s => s.status === 'draft').length;

  // Criteria-wise completion & score
  const criteriaStats = [1, 2, 3, 4, 5, 6, 7].map(cNum => {
    const cId = 'c' + cNum;
    const cSubs = submissions.filter(s => s.criterionId === cId);
    const avg = cSubs.length
      ? (cSubs.reduce((acc, curr) => acc + (curr.quantitativeScore || 80), 0) / cSubs.length).toFixed(1)
      : '0.0';
    return {
      criterionId: cId,
      number: cNum,
      count: cSubs.length,
      avgScore: Number(avg),
      approvedCount: cSubs.filter(s => ['approved_by_principal', 'endorsed_by_president'].includes(s.status)).length
    };
  });

  // Section breakdown
  const sections = ['Diploma Section', 'Undergraduate (UG) Section', 'Postgraduate (PG) Section', 'Foundational Section', 'Support & Functional Units'];
  const sectionStats = sections.map(sec => {
    const deptsInSec = departments.filter(d => d.section === sec);
    const deptIds = deptsInSec.map(d => d.id);
    const subsInSec = submissions.filter(s => deptIds.includes(s.departmentId));
    const completed = subsInSec.filter(s => ['approved_by_principal', 'endorsed_by_president'].includes(s.status)).length;
    return {
      section: sec,
      departmentsCount: deptsInSec.length,
      submissionsCount: subsInSec.length,
      completedCount: completed,
      completionRate: subsInSec.length ? Math.round((completed / (deptsInSec.length * 7)) * 100) : 0
    };
  });

  // Calculate Institutional Projected CGPA
  const allScores = submissions.map(s => s.quantitativeScore || 85);
  const avgInstScore = allScores.length ? (allScores.reduce((a, b) => a + b, 0) / allScores.length) : 85;
  // Convert 100-scale to 4.0 NAAC CGPA
  const projectedCGPA = ((avgInstScore / 100) * 4.0).toFixed(2);
  let grade = 'B';
  if (projectedCGPA >= 3.51) grade = 'A++';
  else if (projectedCGPA >= 3.26) grade = 'A+';
  else if (projectedCGPA >= 3.01) grade = 'A';
  else if (projectedCGPA >= 2.76) grade = 'B++';
  else if (projectedCGPA >= 2.51) grade = 'B+';

  res.json({
    totalDepartments: departments.length,
    totalCriteria: 7,
    totalPossible,
    totalCreated,
    pipeline: {
      endorsed,
      principalApproved,
      iqacVerified,
      hodApproved,
      submittedHod,
      drafts
    },
    criteriaStats,
    sectionStats,
    institutionalIndex: {
      avgScore: Number(avgInstScore.toFixed(1)),
      projectedCGPA: Number(projectedCGPA),
      grade,
      status: 'Targeting NAAC Cycle-2 Accredited A++ Status'
    }
  });
});

// 11. Activity Logs
app.get('/api/activity-logs', (req, res) => {
  const logs = readData('logs.json');
  res.json(logs);
});

// Master Template API (Uploaded by Admin, Downloaded by Coordinators)
app.get('/api/master-template', (req, res) => {
  const tpl = readData('master_template.json');
  res.json(tpl || {
    name: 'BIGCE_Criteria_Master_Format.xlsx',
    url: '/uploads/BIGCE_Criteria_Master_Format.xlsx',
    uploadedBy: 'Director IQAC (Accreditation Admin)',
    uploadedAt: '2026-11-16 10:00'
  });
});

app.post('/api/master-template', (req, res) => {
  const { name, url, uploadedBy } = req.body;
  const tpl = {
    name: name || 'BIGCE_Criteria_Master_Format.xlsx',
    url: url || '/uploads/BIGCE_Criteria_Master_Format.xlsx',
    uploadedBy: uploadedBy || 'Admin Coordinator',
    uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };
  writeData('master_template.json', tpl);
  syncToFirestore('master_template', 'current', tpl);
  logActivity('UPDATE_MASTER_TEMPLATE', tpl.uploadedBy, 'Admin updated the official Master Excel Template format');
  res.json({ success: true, template: tpl });
});

// Format Folders & Files API (Admin creates folders & uploads files, Coordinators browse & download)
app.get('/api/format-folders', async (req, res) => {
  let folders = [];
  if (adminDb) {
    try {
      const snap = await adminDb.collection('format_folders').get();
      if (!snap.empty) {
        snap.forEach(doc => {
          if (!doc.id.startsWith('_')) {
            folders.push({ id: doc.id, ...doc.data() });
          }
        });
      }
    } catch (err) {
      console.debug('Firestore format_folders fetch error:', err.message);
    }
  }

  // Merge / Fallback with local format_folders.json
  const localFolders = readData('format_folders.json') || [];
  if (folders.length === 0) {
    folders = localFolders.filter(f => f && !f.id?.startsWith('_'));
  } else {
    localFolders.forEach(localFld => {
      if (localFld && !localFld.id?.startsWith('_') && !folders.some(f => f.id === localFld.id)) {
        folders.push(localFld);
      }
    });
  }
  res.json(folders);
});

app.post('/api/format-folders', (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Folder title is required.' });
  }
  let folders = readData('format_folders.json') || [];
  const newFolder = {
    id: `fld-${Date.now()}`,
    title: title.trim(),
    description: description ? description.trim() : '',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    createdBy: 'Director IQAC',
    files: []
  };
  folders.push(newFolder);
  writeData('format_folders.json', folders);
  syncToFirestore('format_folders', newFolder.id, newFolder);
  logActivity('CREATE_FORMAT_FOLDER', 'Director IQAC', `Created format folder: ${newFolder.title}`);
  res.json({ success: true, folder: newFolder });
});

app.delete('/api/format-folders/:id', (req, res) => {
  let folders = readData('format_folders.json') || [];
  const folder = folders.find(f => f.id === req.params.id);

  // Clean up any yearwise submissions that belonged to this folder
  try {
    let yearwise = readData('yearwise_records.json') || [];
    const updatedYearwise = yearwise.filter(r => r.folderId !== req.params.id);
    writeData('yearwise_records.json', updatedYearwise);
  } catch (e) {
    console.debug('Yearwise record cleanup notice:', e);
  }

  folders = folders.filter(f => f.id !== req.params.id);
  writeData('format_folders.json', folders);
  deleteFromFirestore('format_folders', req.params.id);
  logActivity('DELETE_FORMAT_FOLDER', 'Director IQAC', `Deleted format folder: ${folder?.title || req.params.id}`);
  res.json({ success: true, message: 'Folder deleted.' });
});

app.post('/api/format-folders/:id/files', (req, res) => {
  const { name, url, size, type } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'File name and file URL are required.' });
  }
  let folders = readData('format_folders.json') || [];
  const folder = folders.find(f => f.id === req.params.id);
  if (!folder) {
    return res.status(404).json({ error: 'Folder not found.' });
  }
  const newFile = {
    id: `file-${Date.now()}`,
    name: name.trim(),
    url: url,
    size: size || 'Unknown size',
    type: type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };
  if (!folder.files) folder.files = [];
  folder.files.push(newFile);
  writeData('format_folders.json', folders);
  syncToFirestore('format_folders', folder.id, folder);
  logActivity('ADD_FORMAT_FILE', 'Director IQAC', `Added format file ${newFile.name} to ${folder.title}`);
  res.json({ success: true, file: newFile, folder });
});

app.delete('/api/format-folders/:id/files/:fileId', (req, res) => {
  let folders = readData('format_folders.json') || [];
  const folder = folders.find(f => f.id === req.params.id);
  if (!folder) {
    return res.status(404).json({ error: 'Folder not found.' });
  }
  folder.files = (folder.files || []).filter(f => f.id !== req.params.fileId);
  writeData('format_folders.json', folders);
  syncToFirestore('format_folders', folder.id, folder);
  res.json({ success: true, message: 'File deleted from folder.', folder });
});

// Yearwise Submissions API (2023-2024 to 2026-2027)
app.get('/api/yearwise-records', async (req, res) => {
  let records = [];
  if (adminDb) {
    try {
      const snap = await adminDb.collection('yearwise_records').get();
      if (!snap.empty) {
        snap.forEach(doc => {
          if (!doc.id.startsWith('_')) {
            records.push({ id: doc.id, ...doc.data() });
          }
        });
      }
    } catch (err) {
      console.debug('Firestore yearwise_records fetch error:', err.message);
    }
  }

  // Merge / Fallback with local yearwise_records.json
  const localRecords = readData('yearwise_records.json') || [];
  if (records.length === 0) {
    records = localRecords.filter(r => r && !r.id?.startsWith('_'));
  } else {
    localRecords.forEach(localRec => {
      if (localRec && !localRec.id?.startsWith('_') && !records.some(r => r.id === localRec.id)) {
        records.push(localRec);
      }
    });
  }

  const { departmentId, academicYear } = req.query;
  if (departmentId) {
    records = records.filter(r => r.departmentId === departmentId);
  }
  if (academicYear) {
    records = records.filter(r => r.academicYear === academicYear);
  }
  res.json(records);
});

app.post('/api/yearwise-records', (req, res) => {
  let records = readData('yearwise_records.json') || [];
  const body = req.body;
  const targetFolderId = body.folderId || 'general';
  const existingIndex = records.findIndex(r =>
    r.departmentId === body.departmentId &&
    r.academicYear === body.academicYear &&
    (r.folderId === targetFolderId)
  );
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  if (existingIndex >= 0) {
    const existingRec = records[existingIndex];
    let mergedFiles = [...(existingRec.uploadedFiles || [])];
    if (body.uploadedFiles && Array.isArray(body.uploadedFiles)) {
      body.uploadedFiles.forEach(newF => {
        if (newF.templateFileId) {
          const matchIdx = mergedFiles.findIndex(f => f.templateFileId === newF.templateFileId);
          if (matchIdx >= 0) {
            mergedFiles[matchIdx] = newF;
          } else {
            mergedFiles.push(newF);
          }
        } else {
          const matchIdx = mergedFiles.findIndex(f => f.name === newF.name || f.filename === newF.filename);
          if (matchIdx >= 0) {
            mergedFiles[matchIdx] = newF;
          } else {
            mergedFiles.push(newF);
          }
        }
      });
    }
    if (body.excelFile) {
      if (body.excelFile.templateFileId) {
        const matchIdx = mergedFiles.findIndex(f => f.templateFileId === body.excelFile.templateFileId);
        if (matchIdx >= 0) {
          mergedFiles[matchIdx] = body.excelFile;
        } else {
          mergedFiles.push(body.excelFile);
        }
      } else if (!mergedFiles.some(f => f.name === body.excelFile.name || f.filename === body.excelFile.filename)) {
        mergedFiles.push(body.excelFile);
      }
    }
    records[existingIndex] = {
      ...existingRec,
      ...body,
      uploadedFiles: mergedFiles,
      excelFile: body.excelFile || (mergedFiles.length ? mergedFiles[mergedFiles.length - 1] : null),
      folderId: targetFolderId,
      updatedAt: now
    };
    writeData('yearwise_records.json', records);
    syncToFirestore('yearwise_records', records[existingIndex].id, records[existingIndex]);
    logActivity('UPDATE_YEARWISE_RECORD', body.author || 'Coordinator', `Updated folder criteria upload for ${body.departmentId} (${body.academicYear}) [${targetFolderId}]`, body.departmentId);
    return res.json({ success: true, record: records[existingIndex] });
  } else {
    const recId = `yr-${body.departmentId}-${body.academicYear}-${targetFolderId}`;
    const initialFiles = body.uploadedFiles || (body.excelFile ? [body.excelFile] : []);
    const newRecord = {
      id: recId,
      status: 'draft',
      folderId: targetFolderId,
      excelFile: body.excelFile || (initialFiles.length ? initialFiles[0] : null),
      uploadedFiles: initialFiles,
      evidenceFiles: [],
      coordinatorRemarks: '',
      createdAt: now,
      ...body
    };
    records.push(newRecord);
    writeData('yearwise_records.json', records);
    syncToFirestore('yearwise_records', newRecord.id, newRecord);
    logActivity('CREATE_YEARWISE_RECORD', body.author || 'Coordinator', `Initialized criteria upload for ${body.departmentId} (${body.academicYear}) into folder ${targetFolderId}`, body.departmentId);
    return res.json({ success: true, record: newRecord });
  }
});

// Delete specific uploaded response file from folder
app.delete('/api/yearwise-records/:id/files/:filename', (req, res) => {
  let records = readData('yearwise_records.json') || [];
  const rec = records.find(r => r.id === req.params.id);
  if (!rec) return res.status(404).json({ error: 'Record not found' });
  const filename = decodeURIComponent(req.params.filename);
  rec.uploadedFiles = (rec.uploadedFiles || []).filter(f => 
    f.name !== filename && 
    f.filename !== filename && 
    f.templateFileId !== filename
  );
  rec.excelFile = rec.uploadedFiles[rec.uploadedFiles.length - 1] || null;
  writeData('yearwise_records.json', records);
  syncToFirestore('yearwise_records', rec.id, rec);
  logActivity('DELETE_FOLDER_FILE', 'Coordinator', `Removed file ${filename} from record ${rec.id}`, rec.departmentId);
  res.json({ success: true, record: rec });
});

// Delete entire yearwise record / submission
app.delete('/api/yearwise-records/:id', (req, res) => {
  let records = readData('yearwise_records.json') || [];
  records = records.filter(r => r.id !== req.params.id);
  writeData('yearwise_records.json', records);
  deleteFromFirestore('yearwise_records', req.params.id);
  logActivity('DELETE_YEARWISE_RECORD', 'Director IQAC', `Deleted submission record: ${req.params.id}`);
  res.json({ success: true, message: 'Submission record removed.' });
});

// Clean up orphaned records whose format folders no longer exist
app.post('/api/admin/clean-orphaned-records', (req, res) => {
  const folders = readData('format_folders.json') || [];
  const folderIds = new Set(folders.map(f => f.id));
  let records = readData('yearwise_records.json') || [];
  const initialCount = records.length;
  records = records.filter(r => folderIds.has(r.folderId));
  writeData('yearwise_records.json', records);
  res.json({ success: true, removedCount: initialCount - records.length, remainingCount: records.length });
});

app.post('/api/yearwise-records/:id/workflow', (req, res) => {
  let records = readData('yearwise_records.json') || [];
  const index = records.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Yearwise record not found' });
  }
  const { action, remarks, actorName, actorRole } = req.body;
  const rec = records[index];
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

  if (action === 'submit_to_hod') {
    rec.status = 'submitted_to_hod';
    rec.coordinatorRemarks = remarks || rec.coordinatorRemarks;
    rec.coordinatorSubmittedAt = now;
    delete rec.rejectionNotes;
    delete rec.rejectedBy;
    delete rec.rejectedAt;
    delete rec.rejectedRole;
    logActivity('SUBMIT_YEAR_TO_HOD', actorName || 'Coordinator', `Submitted ${rec.academicYear} Excel sheet to HOD for approval`, rec.departmentId);
  } else if (action === 'approve_by_hod') {
    rec.status = 'approved_by_hod';
    rec.hodRemarks = remarks || 'Approved by HOD';
    rec.hodApprovedAt = now;
    delete rec.rejectionNotes;
    delete rec.rejectedBy;
    delete rec.rejectedAt;
    delete rec.rejectedRole;
    logActivity('HOD_APPROVE_YEAR', actorName || 'HOD', `HOD verified & approved ${rec.academicYear} Excel submission`, rec.departmentId);
  } else if (action === 'iqac_verify' || action === 'verify_by_iqac') {
    rec.status = 'iqac_verified';
    rec.iqacRemarks = remarks || 'Verified and sanctioned by IQAC Central Directorate';
    rec.iqacVerifiedAt = now;
    delete rec.rejectionNotes;
    delete rec.rejectedBy;
    delete rec.rejectedAt;
    delete rec.rejectedRole;
    logActivity('IQAC_VERIFY_YEAR', actorName || 'Director IQAC', `IQAC officially verified & sanctioned ${rec.academicYear} criteria submission`, rec.departmentId);
  } else if (action === 'approve_by_principal') {
    rec.status = 'approved_by_principal';
    rec.principalRemarks = remarks || 'Approved & Sanctioned by Principal';
    rec.principalApprovedAt = now;
    delete rec.rejectionNotes;
    delete rec.rejectedBy;
    delete rec.rejectedAt;
    delete rec.rejectedRole;
    logActivity('PRINCIPAL_APPROVE_YEAR', actorName || 'Principal', `Principal sanctioned ${rec.academicYear} submission for SSR`, rec.departmentId);
  } else if (action === 'endorse_by_president') {
    rec.status = 'endorsed_by_president';
    rec.presidentRemarks = remarks || 'Official Presidential Seal Affixed';
    rec.presidentEndorsedAt = now;
    delete rec.rejectionNotes;
    delete rec.rejectedBy;
    delete rec.rejectedAt;
    delete rec.rejectedRole;
    logActivity('PRESIDENT_ENDORSE_YEAR', actorName || 'President', `Hon. President affixed Presidential Seal to ${rec.academicYear} submission`, rec.departmentId);
  } else if (action === 'reject_by_hod' || action === 'return_for_revision' || action === 'reject_by_iqac' || action === 'reject') {
    rec.status = 'returned_for_revision';
    rec.rejectionNotes = remarks || 'Returned for revisions with notes.';
    rec.rejectedBy = actorName || actorRole || 'Reviewer';
    rec.rejectedAt = now;
    rec.rejectedRole = actorRole || 'Reviewer';

    // Delete existing response files so coordinator must re-upload
    if (Array.isArray(rec.uploadedFiles)) {
      rec.uploadedFiles.forEach(f => {
        if (f && f.path && fs.existsSync(f.path)) {
          try { fs.unlinkSync(f.path); } catch (e) {}
        }
      });
    }
    rec.uploadedFiles = [];
    rec.excelFile = null;
    rec.fileDeletedOnReject = true;

    if (actorRole === 'hod') {
      rec.hodRemarks = `Returned by HOD: ${remarks || 'Needs revision'}`;
    } else {
      rec.iqacRemarks = `Returned by IQAC: ${remarks || 'Needs revision'}`;
    }
    logActivity('RETURN_YEAR_FOR_REVISION', actorName || 'Reviewer', `Returned ${rec.academicYear} submission for revision with notes: "${remarks || 'Needs revision'}" (Previous files deleted for re-upload)`, rec.departmentId);
  }

  records[index] = rec;
  writeData('yearwise_records.json', records);
  syncToFirestore('yearwise_records', rec.id, rec);
  res.json({ success: true, record: rec });
});

// Trigger Full Cloud Sync
app.post('/api/sync-cloud', async (req, res) => {
  const result = await syncAllToFirestore();
  res.json(result);
});

// Fallback to index.html for client routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` BIGCE Accreditation Management System Server Started`);
    console.log(` Running at http://localhost:${PORT}`);
    console.log(` NAAC Self-Study Report (SSR) Portal Initialized`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
