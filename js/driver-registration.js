// ========================================
// DRIVER REGISTRATION JAVASCRIPT - FIXED PASSWORD VALIDATION
// ========================================

// Current step tracker
let currentStep = 1;

// Form data storage
let formData = {
    personal: {},
    vehicle: {},
    documents: {}
};

// File storage
let uploadedFiles = {
    driversLicense: null,
    vehicleRegistration: null,
    vehiclePhoto: null
};

// Track if this is an upgrade or new registration
let isUpgrade = false;
let existingUserData = null;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Driver Registration initialized');
    
    // Check if user is already logged in
    checkExistingUser();
    
    // Setup file upload handlers
    setupFileUploads();
    
    // Setup form submission
    const form = document.getElementById('driverRegistrationForm');
    form.addEventListener('submit', handleFormSubmit);
    
    // Setup password confirmation (only if not upgrading)
    if (!isUpgrade) {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        if (password && confirmPassword) {
            confirmPassword.addEventListener('input', function() {
                if (this.value !== password.value) {
                    this.setCustomValidity('Passwords do not match');
                } else {
                    this.setCustomValidity('');
                }
            });
        }
    }
    
    // Setup plate number uppercase
    const plateNumber = document.getElementById('plateNumber');
    if (plateNumber) {
        plateNumber.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    }
});

// ========================================
// CHECK EXISTING USER - FIXED
// ========================================

function checkExistingUser() {
    const userDataStr = sessionStorage.getItem('userData');
    if (userDataStr) {
        try {
            existingUserData = JSON.parse(userDataStr);
            isUpgrade = true;
            console.log('✅ User is logged in - UPGRADE MODE:', existingUserData.username);
            
            // Check if user already has a pending driver application
            if (existingUserData.driver_status && existingUserData.driver_status === 'pending') {
                showPendingApplicationMessage();
                return;
            }
            
            // Pre-fill Step 1 with user data
            const fullName = document.getElementById('fullName');
            const username = document.getElementById('username');
            const email = document.getElementById('email');
            const phone = document.getElementById('phone');
            
            if (fullName) fullName.value = existingUserData.name || '';
            if (username) {
                username.value = existingUserData.username || '';
                username.readOnly = true;
                username.style.backgroundColor = '#f5f5f5';
            }
            if (email) {
                email.value = existingUserData.email || '';
                email.readOnly = true;
                email.style.backgroundColor = '#f5f5f5';
            }
            if (phone) phone.value = existingUserData.phone || '';
            
            // ⚠️ FIX: Hide password fields AND remove required attribute
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirmPassword');
            
            if (password && confirmPassword) {
                // Hide the entire row
                const passwordRow = password.closest('.form-row');
                if (passwordRow) {
                    passwordRow.style.display = 'none';
                }
                
                // CRITICAL: Remove required attribute to prevent validation errors
                password.removeAttribute('required');
                confirmPassword.removeAttribute('required');
                
                // Also remove minlength to prevent validation
                password.removeAttribute('minlength');
                
                // Clear any values
                password.value = '';
                confirmPassword.value = '';
                
                // Mark as not required in HTML5 validation
                password.setAttribute('data-upgrade-skip', 'true');
                confirmPassword.setAttribute('data-upgrade-skip', 'true');
                
                console.log('✅ Password fields: hidden & validation disabled');
            }
            
            // Update UI messaging
            const subtitle = document.querySelector('.subtitle');
            if (subtitle) {
                subtitle.textContent = 'Upgrade your account to start offering rides';
            }
            
            const stepTitle = document.querySelector('#step1 .step-title');
            if (stepTitle) {
                stepTitle.textContent = 'Confirm Your Information';
            }
            
            // Show info message
            showInfo('✨ You\'re upgrading your existing account to become a driver. No need to create a new account!');
            
            // If the user was previously rejected, make it clear they can re-apply
            if (existingUserData.driver_status === 'rejected') {
                const reason = existingUserData.rejection_reason || 'No reason provided.';
                showInfo(`🔁 Your previous application was rejected. Reason: ${reason} — You may update details and reapply.`);
                console.log('ℹ️ Previous application was rejected. Allowing re-apply.');
            }
            
        } catch (e) {
            console.log('No valid session found - NEW REGISTRATION MODE');
            isUpgrade = false;
        }
    } else {
        console.log('No user logged in - NEW REGISTRATION MODE');
        isUpgrade = false;
    }
}

function showPendingApplicationMessage() {
    // Hide the form and progress indicator
    const form = document.getElementById('driverRegistrationForm');
    const progressContainer = document.querySelector('.progress-container');
    if (form) form.style.display = 'none';
    if (progressContainer) progressContainer.style.display = 'none';
    
    // Create pending message
    const pendingDiv = document.createElement('div');
    pendingDiv.className = 'pending-application-message';
    pendingDiv.style.cssText = `
        background: white;
        color: #333;
        padding: 40px 30px;
        border-radius: 16px;
        margin: 40px 0;
        text-align: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        border: 3px solid #FFD700;
    `;
    pendingDiv.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
        <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold; color: #1E40AF;">Application Pending</h2>
        <p style="margin: 0; font-size: 16px; color: #555;">
            Your driver application has been submitted and is currently under review by our admin team.
        </p>
        <p style="margin: 15px 0 0 0; font-size: 14px; color: #666;">
            We'll notify you once your application has been reviewed. This usually takes 24-48 hours.
        </p>
        <button onclick="window.location.href='../html/passenger-dashboard.html'" style="
            margin-top: 30px;
            padding: 12px 30px;
            background: #1E40AF;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        " onmouseover="this.style.background='#FFD700'; this.style.color='#1E40AF';" onmouseout="this.style.background='#1E40AF'; this.style.color='white';">
            Back to Dashboard
        </button>
    `;
    
    // Insert after logo
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer && logoContainer.parentNode) {
        logoContainer.parentNode.insertBefore(pendingDiv, logoContainer.nextSibling);
    }
}

function showInfo(message) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-message';
    infoDiv.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        margin: 20px 0;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        animation: slideDown 0.5s ease;
    `;
    infoDiv.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
        <span style="flex: 1;">${message}</span>
    `;
    
    // Insert after logo
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer && logoContainer.parentNode) {
        const existingInfo = document.querySelector('.info-message');
        if (existingInfo) existingInfo.remove();
        logoContainer.parentNode.insertBefore(infoDiv, logoContainer.nextSibling);
    }
}

// ========================================
// STEP NAVIGATION
// ========================================

function nextStep(step) {
    if (!validateStep(currentStep)) {
        return;
    }
    
    saveStepData(currentStep);
    currentStep = step;
    showStep(step);
    updateProgress(step);
    
    if (step === 4) {
        populateReview();
    }
}

function previousStep(step) {
    currentStep = step;
    showStep(step);
    updateProgress(step);
}

function showStep(step) {
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
    });
    
    document.getElementById('step' + step).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress(step) {
    document.querySelectorAll('.progress-step').forEach((el, index) => {
        if (index + 1 < step) {
            el.classList.add('completed');
            el.classList.remove('active');
        } else if (index + 1 === step) {
            el.classList.add('active');
            el.classList.remove('completed');
        } else {
            el.classList.remove('active', 'completed');
        }
    });
}

// ========================================
// FORM VALIDATION - FIXED
// ========================================

function validateStep(step) {
    let isValid = true;
    const stepElement = document.getElementById('step' + step);
    const inputs = stepElement.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
        // ⚠️ FIX: Skip validation for password fields in upgrade mode
        if (isUpgrade && input.hasAttribute('data-upgrade-skip')) {
            console.log('⏭️ Skipping validation for:', input.id);
            return; // Skip this field
        }
        
        if (!input.value || (input.type === 'checkbox' && !input.checked)) {
            isValid = false;
            input.classList.add('error');
            showError(`Please fill in all required fields in ${getStepName(step)}`);
        } else {
            input.classList.remove('error');
        }
    });
    
    // Special validations for step 1 (only for new registration)
    if (step === 1 && isValid && !isUpgrade) {
        const email = document.getElementById('email').value;
        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            return false;
        }
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return false;
        }
        
        if (password.length < 8) {
            showError('Password must be at least 8 characters long');
            return false;
        }
    }
    
    if (step === 2 && isValid) {
        const plateNumber = document.getElementById('plateNumber').value;
        if (plateNumber.length < 3 || plateNumber.length > 15) {
            showError('Invalid plate number format');
            return false;
        }
        
        const year = parseInt(document.getElementById('vehicleYear').value);
        const currentYear = new Date().getFullYear();
        if (year < 1990 || year > currentYear + 1) {
            showError('Invalid vehicle year');
            return false;
        }
        
        // Validate available seats against input min/max attributes
        const seatsEl = document.getElementById('availableSeats');
        if (seatsEl) {
            const seatsVal = parseInt(seatsEl.value);
            const minSeats = parseInt(seatsEl.getAttribute('min')) || 1;
            const maxSeats = parseInt(seatsEl.getAttribute('max')) || 8;
            if (isNaN(seatsVal) || seatsVal < minSeats || seatsVal > maxSeats) {
                showError(`Available Seats must be between ${minSeats} and ${maxSeats}`);
                return false;
            }
        }
    }
    
    if (step === 3 && isValid) {
        if (!uploadedFiles.driversLicense || !uploadedFiles.vehicleRegistration || !uploadedFiles.vehiclePhoto) {
            showError('Please upload all required documents');
            return false;
        }
    }
    
    return isValid;
}

function getStepName(step) {
    const names = {
        1: 'Personal Information',
        2: 'Vehicle Information',
        3: 'Documents',
        4: 'Review'
    };
    return names[step] || '';
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ========================================
// DATA MANAGEMENT
// ========================================

function saveStepData(step) {
    if (step === 1) {
        formData.personal = {
            fullName: document.getElementById('fullName').value,
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value
        };
        
        // Only save password if not upgrading
        if (!isUpgrade) {
            formData.personal.password = document.getElementById('password').value;
        }
    } else if (step === 2) {
        formData.vehicle = {
            brand: document.getElementById('vehicleBrand').value,
            model: document.getElementById('vehicleModel').value,
            year: parseInt(document.getElementById('vehicleYear').value),
            color: document.getElementById('vehicleColor').value,
            plateNumber: document.getElementById('plateNumber').value.toUpperCase(),
            availableSeats: parseInt(document.getElementById('availableSeats').value)
        };
    }
}

function populateReview() {
    document.getElementById('reviewName').textContent = formData.personal.fullName;
    document.getElementById('reviewUsername').textContent = formData.personal.username;
    document.getElementById('reviewEmail').textContent = formData.personal.email;
    document.getElementById('reviewPhone').textContent = formData.personal.phone;
    document.getElementById('reviewAddress').textContent = formData.personal.address;
    
    const vehicleInfo = `${formData.vehicle.brand} ${formData.vehicle.model} (${formData.vehicle.year}) - ${formData.vehicle.color}`;
    document.getElementById('reviewVehicle').textContent = vehicleInfo;
    document.getElementById('reviewPlateNumber').textContent = formData.vehicle.plateNumber;
    document.getElementById('reviewSeats').textContent = formData.vehicle.availableSeats;
    
    document.getElementById('reviewLicense').textContent = uploadedFiles.driversLicense ? '✓ Uploaded' : '✗ Missing';
    document.getElementById('reviewRegistration').textContent = uploadedFiles.vehicleRegistration ? '✓ Uploaded' : '✗ Missing';
    document.getElementById('reviewVehiclePhoto').textContent = uploadedFiles.vehiclePhoto ? '✓ Uploaded' : '✗ Missing';
}

// ========================================
// FILE UPLOAD HANDLING
// ========================================

function setupFileUploads() {
    setupFileUpload('driversLicense', 'licenseUploadBox', 'licensePreview');
    setupFileUpload('vehicleRegistration', 'registrationUploadBox', 'registrationPreview');
    setupFileUpload('vehiclePhoto', 'vehiclePhotoUploadBox', 'vehiclePhotoPreview');
}

function setupFileUpload(inputId, boxId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!input || !preview) return;

    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showError('File size must be less than 5MB');
            return;
        }

        uploadedFiles[inputId] = file;

        // Clear previous preview
        preview.innerHTML = '';

        const fileInfo = document.createElement('div');
        fileInfo.style.color = '#4CAF50';
        fileInfo.style.fontWeight = '600';
        fileInfo.style.padding = '10px';
        fileInfo.textContent = `✓ ${file.name} (${formatFileSize(file.size)})`;
        preview.appendChild(fileInfo);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.maxWidth = '200px';
                img.style.marginTop = '10px';
                img.style.borderRadius = '8px';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }

        preview.classList.add('show');
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ========================================
// FORM SUBMISSION
// ========================================

async function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log('📤 Submitting driver application...');
    console.log('Mode:', isUpgrade ? 'UPGRADE' : 'NEW REGISTRATION');
    
    const acceptTerms = document.getElementById('acceptTerms');
    if (!acceptTerms.checked) {
        showError('Please accept the Terms and Conditions to continue');
        return;
    }
    
    showLoading(isUpgrade ? 'Uploading documents and upgrading account...' : 'Uploading documents and submitting application...');
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    
    try {
        // Convert uploaded files to base64
        const documentsBase64 = await convertFilesToBase64();
        
        let endpoint, payload, successMessage, redirectUrl;
        
        if (isUpgrade && existingUserData) {
            // ===== UPGRADE EXISTING USER =====
            console.log('🔄 Upgrading user:', existingUserData.username);
            
            endpoint = '../php/upgrade-to-driver.php';
            payload = {
                username: existingUserData.username,
                profile: {
                    phone: formData.personal.phone || existingUserData.phone,
                    address: formData.personal.address || ''
                },
                vehicle: [{
                    plate_number: formData.vehicle.plateNumber,
                    brand: formData.vehicle.brand,
                    model: formData.vehicle.model,
                    year: formData.vehicle.year,
                    color: formData.vehicle.color,
                    available_seats: formData.vehicle.availableSeats,
                    document: documentsBase64 // Add documents
                }]
            // Ensure a re-application sets status to pending so server treats this as a new application
            , driver_status: 'pending'
            , rejection_reason: null
            };
            successMessage = '🎉 Successfully upgraded to driver! Your application is pending approval.';
            redirectUrl = '../html/passenger-dashboard.html';
            
        } else {
            // ===== NEW REGISTRATION =====
            console.log('📝 Creating new driver account');
            
            endpoint = '../php/driver-registration.php';
            payload = {
                username: formData.personal.username,
                email: formData.personal.email,
                password: formData.personal.password,
                role: 'car_owner',
                profile: {
                    name: formData.personal.fullName,
                    phone: formData.personal.phone,
                    address: formData.personal.address
                },
                vehicle: [{
                    plate_number: formData.vehicle.plateNumber,
                    brand: formData.vehicle.brand,
                    model: formData.vehicle.model,
                    year: formData.vehicle.year,
                    color: formData.vehicle.color,
                    available_seats: formData.vehicle.availableSeats,
                    verified: false,
                    document: documentsBase64 // Add documents
                }],
                account_status: 'pending'
            };
            successMessage = '🎉 Application submitted successfully! Your account is pending approval.';
            redirectUrl = '../html/login.html';
        }
        
        console.log('Submitting to:', endpoint);
        console.log('Payload (without files):', {
            ...payload,
            vehicle: payload.vehicle.map(v => ({...v, document: '[BASE64_DATA]'}))
        });
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        console.log('Response:', result);
        
        hideLoading();
        
        if (result.success) {
            console.log('✅ Submission successful');
            
            // If upgrade, update session data
            if (isUpgrade && result.user_data) {
                const updatedUserData = {
                    ...existingUserData,
                    ...result.user_data
                };
                sessionStorage.setItem('userData', JSON.stringify(updatedUserData));
                console.log('✅ Session updated with new driver role');
            }
            
            showSuccess(successMessage);
            
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 3000);
        } else {
            console.error('❌ Submission failed:', result.message);
            showError(result.message || 'Operation failed. Please try again.');
            submitBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('❌ Submission error:', error);
        hideLoading();
        showError('An error occurred. Please try again.');
        submitBtn.disabled = false;
    }
}

// ========================================
// CONVERT FILES TO BASE64
// ========================================

async function convertFilesToBase64() {
    console.log('📸 Converting uploaded files to base64...');
    
    const documents = {
        license: null,
        registration: null,
        photo: null
    };
    
    // Convert driver's license
    if (uploadedFiles.driversLicense) {
        documents.license = await fileToBase64(uploadedFiles.driversLicense);
        console.log('✅ License converted:', documents.license.substring(0, 50) + '...');
    }
    
    // Convert vehicle registration
    if (uploadedFiles.vehicleRegistration) {
        documents.registration = await fileToBase64(uploadedFiles.vehicleRegistration);
        console.log('✅ Registration converted:', documents.registration.substring(0, 50) + '...');
    }
    
    // Convert vehicle photo
    if (uploadedFiles.vehiclePhoto) {
        documents.photo = await fileToBase64(uploadedFiles.vehiclePhoto);
        console.log('✅ Photo converted:', documents.photo.substring(0, 50) + '...');
    }
    
    return documents;
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ========================================
// UI HELPERS
// ========================================

function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 5000);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showSuccess(message) {
    const successMsg = document.getElementById('successMsg');
    if (successMsg) {
        successMsg.textContent = message;
        successMsg.style.display = 'block';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showLoading(message = 'Loading...') {
    let loader = document.querySelector('.loading-overlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(loader);
    } else {
        loader.querySelector('p').textContent = message;
    }
    loader.classList.add('show');
}

function hideLoading() {
    const loader = document.querySelector('.loading-overlay');
    if (loader) {
        loader.classList.remove('show');
    }
}

// ========================================
// EXPORT FUNCTIONS
// ========================================
window.nextStep = nextStep;
window.previousStep = previousStep;

console.log('📋 Driver Registration script loaded');