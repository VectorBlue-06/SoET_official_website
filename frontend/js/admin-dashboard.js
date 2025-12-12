/* ========================================
   Admin Dashboard JavaScript
   SoET - Samrat Vikramaditya Vishwavidyalaya
   ======================================== */

import { supabase } from '../../backend/config/supabase.js';
import { checkAuth, logoutAdmin } from '../../backend/api/auth.js';

// Global state
let currentAdmin = null;
let currentAnnouncementId = null;
let currentStudentId = null;
let deleteCallback = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    await initializeDashboard();
});

/**
 * Initialize Dashboard
 */
async function initializeDashboard() {
    // Check authentication
    const admin = await checkAuth();
    
    if (!admin) {
        window.location.href = 'admin-login.html';
        return;
    }

    currentAdmin = admin;
    document.getElementById('adminEmail').textContent = admin.email;

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 500);

    // Initialize navigation
    initializeNavigation();

    // Initialize modals
    initializeModals();

    // Initialize logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Load initial data
    await loadAnnouncements();
    await loadStudents();

    console.log('✅ Admin Dashboard initialized successfully!');
}

/**
 * Navigation between sections
 */
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.dashboard-section');

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');

            // Update active states
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(`${targetSection}-section`).classList.add('active');
        });
    });
}

/**
 * Initialize Modals
 */
function initializeModals() {
    // Announcement Modal
    const announcementModal = document.getElementById('announcementModal');
    const addAnnouncementBtn = document.getElementById('addAnnouncementBtn');
    const cancelAnnouncementBtn = document.getElementById('cancelAnnouncementBtn');
    const announcementForm = document.getElementById('announcementForm');

    addAnnouncementBtn.addEventListener('click', () => openAnnouncementModal());
    cancelAnnouncementBtn.addEventListener('click', () => closeModal(announcementModal));
    announcementForm.addEventListener('submit', handleAnnouncementSubmit);

    // Student Modal
    const studentModal = document.getElementById('studentModal');
    const addStudentBtn = document.getElementById('addStudentBtn');
    const cancelStudentBtn = document.getElementById('cancelStudentBtn');
    const studentForm = document.getElementById('studentForm');

    addStudentBtn.addEventListener('click', () => openStudentModal());
    cancelStudentBtn.addEventListener('click', () => closeModal(studentModal));
    studentForm.addEventListener('submit', handleStudentSubmit);

    // Confirm Modal
    const confirmModal = document.getElementById('confirmModal');
    const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
    const confirmActionBtn = document.getElementById('confirmActionBtn');

    cancelConfirmBtn.addEventListener('click', () => closeModal(confirmModal));
    confirmActionBtn.addEventListener('click', handleConfirmAction);

    // Student Filters
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    applyFilterBtn.addEventListener('click', loadStudents);

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });

    // Close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            closeModal(this.closest('.modal'));
        });
    });
}

/**
 * Announcement Management
 */
async function loadAnnouncements() {
    const listContainer = document.getElementById('announcementsList');
    listContainer.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading announcements...</p></div>';

    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;

        if (data.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullhorn"></i>
                    <p>No announcements yet. Add your first announcement!</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = data.map(announcement => `
            <div class="announcement-card">
                <div class="announcement-header">
                    <div>
                        <h3 class="announcement-title">${announcement.title}</h3>
                        <div class="announcement-meta">
                            <span class="category-badge ${announcement.category.toLowerCase()}">${announcement.category}</span>
                            <span><i class="fas fa-calendar"></i> ${formatDate(announcement.date)}</span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon btn-edit" onclick="window.editAnnouncement('${announcement.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="window.deleteAnnouncement('${announcement.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="announcement-description">${announcement.description}</p>
                ${announcement.link ? `<a href="${announcement.link}" target="_blank" class="btn-secondary"><i class="fas fa-link"></i> View Link</a>` : ''}
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading announcements:', error);
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading announcements. Please try again.</p>
            </div>
        `;
    }
}

function openAnnouncementModal(announcementId = null) {
    const modal = document.getElementById('announcementModal');
    const form = document.getElementById('announcementForm');
    const title = document.getElementById('announcementModalTitle');

    form.reset();
    currentAnnouncementId = announcementId;

    if (announcementId) {
        title.innerHTML = '<i class="fas fa-edit"></i> Edit Announcement';
        loadAnnouncementData(announcementId);
    } else {
        title.innerHTML = '<i class="fas fa-plus"></i> Add Announcement';
        // Set today's date as default
        document.getElementById('announcementDate').valueAsDate = new Date();
    }

    modal.classList.add('active');
}

async function loadAnnouncementData(id) {
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('announcementId').value = data.id;
        document.getElementById('announcementTitle').value = data.title;
        document.getElementById('announcementCategory').value = data.category;
        document.getElementById('announcementDescription').value = data.description;
        document.getElementById('announcementDate').value = data.date;
        document.getElementById('announcementLink').value = data.link || '';

    } catch (error) {
        console.error('Error loading announcement:', error);
        alert('Error loading announcement data');
    }
}

async function handleAnnouncementSubmit(e) {
    e.preventDefault();

    const formData = {
        title: document.getElementById('announcementTitle').value,
        category: document.getElementById('announcementCategory').value,
        description: document.getElementById('announcementDescription').value,
        date: document.getElementById('announcementDate').value,
        link: document.getElementById('announcementLink').value || null
    };

    try {
        let result;
        if (currentAnnouncementId) {
            // Update existing
            result = await supabase
                .from('announcements')
                .update(formData)
                .eq('id', currentAnnouncementId);
        } else {
            // Insert new
            result = await supabase
                .from('announcements')
                .insert([formData]);
        }

        if (result.error) throw result.error;

        closeModal(document.getElementById('announcementModal'));
        await loadAnnouncements();
        showNotification('Announcement saved successfully!', 'success');

    } catch (error) {
        console.error('Error saving announcement:', error);
        showNotification('Error saving announcement. Please try again.', 'error');
    }
}

window.editAnnouncement = function(id) {
    openAnnouncementModal(id);
};

window.deleteAnnouncement = function(id) {
    deleteCallback = async () => {
        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await loadAnnouncements();
            showNotification('Announcement deleted successfully!', 'success');

        } catch (error) {
            console.error('Error deleting announcement:', error);
            showNotification('Error deleting announcement. Please try again.', 'error');
        }
    };

    openConfirmModal('Are you sure you want to delete this announcement?');
};

/**
 * Student Management
 */
async function loadStudents() {
    const listContainer = document.getElementById('studentsList');
    listContainer.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin"></i><p>Loading students...</p></div>';

    const branch = document.getElementById('branchFilter').value;
    const semester = document.getElementById('semesterFilter').value;

    try {
        let query = supabase
            .from('students')
            .select('*')
            .order('name', { ascending: true });

        if (branch) {
            query = query.eq('branch', branch);
        }
        if (semester) {
            query = query.eq('semester', semester);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-graduate"></i>
                    <p>No students found. ${branch || semester ? 'Try adjusting filters or ' : ''}Add your first student!</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = data.map(student => `
            <div class="student-card">
                <div class="student-header">
                    <div>
                        <h3 class="announcement-title">${student.name}</h3>
                        <div class="student-meta">
                            <span><i class="fas fa-id-card"></i> ${student.enrollment_no}</span>
                            <span class="category-badge notice">${student.branch}</span>
                            <span>Sem ${student.semester}</span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn-icon btn-edit" onclick="window.editStudent('${student.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="window.deleteStudent('${student.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="student-info">
                    <div class="info-item">
                        <i class="fas fa-envelope"></i>
                        <span>${student.email}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-phone"></i>
                        <span>${student.phone}</span>
                    </div>
                    ${student.address ? `
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${student.address}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading students:', error);
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading students. Please try again.</p>
            </div>
        `;
    }
}

function openStudentModal(studentId = null) {
    const modal = document.getElementById('studentModal');
    const form = document.getElementById('studentForm');
    const title = document.getElementById('studentModalTitle');

    form.reset();
    currentStudentId = studentId;

    if (studentId) {
        title.innerHTML = '<i class="fas fa-edit"></i> Edit Student';
        loadStudentData(studentId);
    } else {
        title.innerHTML = '<i class="fas fa-plus"></i> Add Student';
    }

    modal.classList.add('active');
}

async function loadStudentData(id) {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('studentId').value = data.id;
        document.getElementById('studentName').value = data.name;
        document.getElementById('studentEnrollment').value = data.enrollment_no;
        document.getElementById('studentEmail').value = data.email;
        document.getElementById('studentPhone').value = data.phone;
        document.getElementById('studentBranch').value = data.branch;
        document.getElementById('studentSemester').value = data.semester;
        document.getElementById('studentAddress').value = data.address || '';

    } catch (error) {
        console.error('Error loading student:', error);
        alert('Error loading student data');
    }
}

async function handleStudentSubmit(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('studentName').value,
        enrollment_no: document.getElementById('studentEnrollment').value,
        email: document.getElementById('studentEmail').value,
        phone: document.getElementById('studentPhone').value,
        branch: document.getElementById('studentBranch').value,
        semester: parseInt(document.getElementById('studentSemester').value),
        address: document.getElementById('studentAddress').value || null
    };

    try {
        let result;
        if (currentStudentId) {
            // Update existing
            result = await supabase
                .from('students')
                .update(formData)
                .eq('id', currentStudentId);
        } else {
            // Insert new
            result = await supabase
                .from('students')
                .insert([formData]);
        }

        if (result.error) throw result.error;

        closeModal(document.getElementById('studentModal'));
        await loadStudents();
        showNotification('Student saved successfully!', 'success');

    } catch (error) {
        console.error('Error saving student:', error);
        showNotification('Error saving student. Please try again.', 'error');
    }
}

window.editStudent = function(id) {
    openStudentModal(id);
};

window.deleteStudent = function(id) {
    deleteCallback = async () => {
        try {
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await loadStudents();
            showNotification('Student deleted successfully!', 'success');

        } catch (error) {
            console.error('Error deleting student:', error);
            showNotification('Error deleting student. Please try again.', 'error');
        }
    };

    openConfirmModal('Are you sure you want to delete this student?');
};

/**
 * Confirm Modal
 */
function openConfirmModal(message) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmMessage').textContent = message;
    modal.classList.add('active');
}

async function handleConfirmAction() {
    if (deleteCallback) {
        await deleteCallback();
        deleteCallback = null;
    }
    closeModal(document.getElementById('confirmModal'));
}

/**
 * Utility Functions
 */
function closeModal(modal) {
    modal.classList.remove('active');
}

async function handleLogout() {
    await logoutAdmin();
    window.location.href = 'admin-login.html';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
