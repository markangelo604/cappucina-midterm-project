// ========================================
// DRIVER REGISTRATION JAVASCRIPT
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

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Driver Registration initialized');
    
    // Setup file upload handlers
    setupFileUploads();
    
    // Setup form submission
    const form = document.getElementById('driverRegistrationForm');
    form.addEventListener('submit', handleFormSubmit);
    
    // Setup password confirmation
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    confirmPassword.addEventListener('input', function() {
        if (this.value !== password.value) {
            this.setCustomValidity('Passwords do not match');
        } else {
            this.setCustomValidity('');
        }
    });
    
    // Setup plate number uppercase
    const plateNumber = document.getElementById('plateNumber');
    plateNumber.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
});

// ========================================
// STEP NAVIGATION
// ========================================

function nextStep(step) {
    // Validate current step before moving forward
    if (!validateStep(currentStep)) {
        return;
    }
    
    // Save current step data
    saveStepData(currentStep);
    
    // Update step
    currentStep = step;
    showStep(step);
    
    // Update progress indicator
    updateProgress(step);
    
    // If moving to review step, populate review data
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
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show current step
    document.getElementById('step' + step).classList.add('active');
    
    // Scroll to top
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
// FORM VALIDATION
// ========================================

function validateStep(step) {
    let isValid = true;
    const stepElement = document.getElementById('step' + step);
    
    // Get all required inputs in current step
    const inputs = stepElement.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
        if (!input.value || (input.type === 'checkbox' && !input.checked)) {
            isValid = false;
            input.classList.add('error');
            
            // Show error message
            showError(`Please fill in all required fields in ${getStepName(step)}`);
        } else {
            input.classList.remove('error');
        }
    });
    
    // Special validations for each step
    if (step === 1 && isValid) {
        // Validate email format
        const email = document.getElementById('email').value;
        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            return false;
        }
        
        // Validate password match
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return false;
        }
        
        // Validate password length
        if (password.length < 8) {
            showError('Password must be at least 8 characters long');
            return false;
        }
    }
    
    if (step === 2 && isValid) {
        // Validate plate number format
        const plateNumber = document.getElementById('plateNumber').value;
        if (plateNumber.length < 3 || plateNumber.length > 15) {
            showError('Invalid plate number format');
            return false;
        }
        
        // Validate year
        const year = parseInt(document.getElementById('vehicleYear').value);
        const currentYear = new Date().getFullYear();
        if (year < 1990 || year > currentYear + 1) {
            showError('Invalid vehicle year');
            return false;
        }
    }
    
    if (step === 3 && isValid) {
        // Validate file uploads
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
            address: document.getElementById('address').value,
            password: document.getElementById('password').value
        };
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
    // Personal Information
    document.getElementById('reviewName').textContent = formData.personal.fullName;
    document.getElementById('reviewUsername').textContent = formData.personal.username;
    document.getElementById('reviewEmail').textContent = formData.personal.email;
    document.getElementById('reviewPhone').textContent = formData.personal.phone;
    document.getElementById('reviewAddress').textContent = formData.personal.address;
    
    // Vehicle Information
    const vehicleInfo = `${formData.vehicle.brand} ${formData.vehicle.model} (${formData.vehicle.year}) - ${formData.vehicle.color}`;
    document.getElementById('reviewVehicle').textContent = vehicleInfo;
    document.getElementById('reviewPlateNumber').textContent = formData.vehicle.plateNumber;
    document.getElementById('reviewSeats').textContent = formData.vehicle.availableSeats;
    
    // Documents
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
    const box = document.getElementById(boxId);
    const preview = document.getElementById(previewId);
    
    // Click handler
    box.addEventListener('click', () => input.click());
    
    // File change handler
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError('File size must be less than 5MB');
                input.value = '';
                return;
            }
            
            // Store file
            uploadedFiles[inputId] = file;
            
            // Update UI
            box.classList.add('has-file');
            preview.innerHTML = `
                <div style="color: var(--success-color); font-weight: 600;">
                    ✓ ${file.name} (${formatFileSize(file.size)})
                </div>
            `;
            preview.classList.add('show');
            
            // Show image preview if it's an image
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        }
    });
    
    // Drag and drop
    box.addEventListener('dragover', (e) => {
        e.preventDefault();
        box.style.borderColor = 'var(--accent-gold)';
    });
    
    box.addEventListener('dragleave', () => {
        box.style.borderColor = 'var(--border-color)';
    });
    
    box.addEventListener('drop', (e) => {
        e.preventDefault();
        box.style.borderColor = 'var(--border-color)';
        
        const file = e.dataTransfer.files[0];
        if (file) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        }
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
    
    console.log('📤 Submitting driver registration...');
    
    // Validate terms checkbox
    const acceptTerms = document.getElementById('acceptTerms');
    if (!acceptTerms.checked) {
        showError('Please accept the Terms and Conditions to continue');
        return;
    }
    
    // Show loading
    showLoading('Submitting your application...');
    
    // Disable submit button
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    
    try {
        // Prepare form data for submission
        const registrationData = {
            // Personal information
            username: formData.personal.username,
            email: formData.personal.email,
            password: formData.personal.password,
            role: 'car_owner',
            profile: {
                name: formData.personal.fullName,
                phone: formData.personal.phone,
                address: formData.personal.address
            },
            // Vehicle information
            vehicle: [{
                plate_number: formData.vehicle.plateNumber,
                brand: formData.vehicle.brand,
                model: formData.vehicle.model,
                year: formData.vehicle.year,
                color: formData.vehicle.color,
                available_seats: formData.vehicle.availableSeats,
                verified: false, // Will be verified by admin
                document: {
                    license: 'PENDING_UPLOAD',
                    registration: 'PENDING_UPLOAD',
                    photo: 'PENDING_UPLOAD'
                }
            }],
            account_status: 'pending' // Pending approval
        };
        
        console.log('Registration data:', registrationData);
        
        // Submit to backend
        const response = await fetch('/api/drivers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });
        
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            console.log('✅ Registration successful');
            
            // Show success message
            showSuccess('Application submitted successfully! Your account is pending approval. You will receive an email once verified.');
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = '../html/login.html';
            }, 3000);
        } else {
            console.error('❌ Registration failed:', result.message);
            showError(result.message || 'Registration failed. Please try again.');
            submitBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        hideLoading();
        showError('An error occurred during registration. Please try again.');
        submitBtn.disabled = false;
    }
}

// ========================================
// UI HELPERS
// ========================================

function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorMsg.style.display = 'none';
    }, 5000);
    
    // Scroll to top to show error
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showSuccess(message) {
    const successMsg = document.getElementById('successMsg');
    successMsg.textContent = message;
    successMsg.style.display = 'block';
    
    // Scroll to top to show success
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLoading(message = 'Loading...') {
    // Remove existing loader if any
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
// EXPORT FUNCTIONS FOR INLINE ONCLICK
// ========================================
window.nextStep = nextStep;
window.previousStep = previousStep;

console.log('📋 Driver Registration script loaded');