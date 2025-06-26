document.addEventListener('DOMContentLoaded', function() {
        // Elements
        const personalDetails = document.getElementById('personal-details');
        const biometrics = document.getElementById('biometrics');
        const fingerSelection = document.getElementById('finger-selection');
        const fingerVerification = document.getElementById('finger-verification');
        const confirmation = document.getElementById('confirmation');
        const generateIdBtn = document.getElementById('generate-id-btn');
        const backToDetailsBtn = document.getElementById('back-to-details');
        const submitBiometricsBtn = document.getElementById('submit-biometrics');
        const newEnrollmentBtn = document.getElementById('new-enrollment');
        const rightHand = document.getElementById('right-hand');
        const leftHand = document.getElementById('left-hand');
        const generatedId = document.getElementById('generated-id');
        const displayId = document.getElementById('display-id');
        const finalId = document.getElementById('final-id');
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        const step3 = document.getElementById('step3');
        const step4 = document.getElementById('step4');
        const step5 = document.getElementById('step5');
        const cameraOverlay = document.getElementById('camera-overlay');
        const cameraPreview = document.getElementById('camera-preview');
        const captureBtn = document.getElementById('capture-btn');
        const closeCamera = document.getElementById('close-camera');
        const captureRightBtn = document.getElementById('capture-right');
        const captureLeftBtn = document.getElementById('capture-left');
        const recaptureRightBtn = document.getElementById('recapture-right');
        const recaptureLeftBtn = document.getElementById('recapture-left');
        const handInstruction = document.getElementById('hand-instruction');
        const rightPreview = document.getElementById('right-preview');
        const leftPreview = document.getElementById('left-preview');
        const switchCameraBtn = document.getElementById('switch-camera');
        const finger1Preview = document.getElementById('finger1-preview');
        const finger2Preview = document.getElementById('finger2-preview');
        const fingerPlaceholder = document.getElementById('finger-placeholder');
        const fingerPreview = document.getElementById('finger-preview');
        const captureFingerBtn = document.getElementById('capture-finger');
        const recaptureFingerBtn = document.getElementById('recapture-finger');
        const verifyFingerBtn = document.getElementById('verify-finger');
        const selectedFingerLabel = document.getElementById('selected-finger-label');
        const attemptsCounter = document.getElementById('attempts-counter');
        const verificationMessage = document.getElementById('verification-message');
        const verificationResult = document.getElementById('verification-result');
        const selectFingerBtns = document.querySelectorAll('.select-finger');
        const backToFingerSelectionBtn = document.getElementById('back-to-finger-selection');
        const backToBiometricsBtn = document.getElementById('back-to-biometrics');
        
        // State variables
        let currentHand = null;
        let stream = null;
        let facingMode = "environment";
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let selectedFinger = null;
        let selectedFingerImage = null;
        let verificationAttempts = 3;
        let capturedFingerImage = null;
        
        // Generate random UAE ID (15 digits)
        function generateUAEId(dob) {
            // 1. Start with UAE prefix
            let id = '784';
            
            // 2. Add birth year (YYYY from Date object)
            const birthYear = new Date(dob).getFullYear();
            id += birthYear;
            
            // 3. Generate 7 random digits
            for (let i = 0; i < 7; i++) {
                id += Math.floor(Math.random() * 10);
            }
            
            // 4. Calculate checksum (sum of all digits % 10)
            const digits = id.split('').map(Number);
            const sum = digits.reduce((acc, digit) => acc + digit, 0);
            const checksum = sum % 10;
            id += checksum;
            
            // 5. Format as 784-YYYY-XXXXXXX-C
            return `${id.substring(0,3)} ${id.substring(3,7)} ${id.substring(7,11)} ${id.substring(11,15)}`;
        }
        
        // Update progress steps
        function updateProgress(step) {
            step1.classList.remove('active');
            step2.classList.remove('active');
            step3.classList.remove('active');
            step4.classList.remove('active');
            step5.classList.remove('active');
            
            if (step >= 1) step1.classList.add('active');
            if (step >= 2) step2.classList.add('active');
            if (step >= 3) step3.classList.add('active');
            if (step >= 4) step4.classList.add('active');
            if (step >= 5) step5.classList.add('active');
        }
        
        // Generate ID button click
        generateIdBtn.addEventListener('click', function() {
            // Form validation
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const dob = document.getElementById('dob').value;
            
            if (!firstName || !lastName || !dob) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Generate ID
            const uaeId = generateUAEId(dob);
            generatedId.textContent = uaeId;
            displayId.textContent = uaeId;
            finalId.textContent = uaeId;
            
            // Show biometrics step
            personalDetails.classList.add('hidden');
            biometrics.classList.remove('hidden');
            updateProgress(2);
        });
        
        // Mock API call to get best finger images
        function getBestFingerImages() {
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Generate two random fingerprint images for demo
                    const finger1 = generateFingerprintImage('#008000');
                    const finger2 = generateFingerprintImage('#006400');
                    resolve({ finger1, finger2 });
                }, 1000);
            });
        }
        
        // Generate fingerprint SVG as data URL
        function generateFingerprintImage(color) {
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                <rect width="200" height="200" fill="#f8f9fa"/>
                <path d="M50,80 Q70,60 90,80 T130,80 Q150,100 130,120 T90,120 Q70,140 50,120" 
                        stroke="${color}" stroke-width="3" fill="none"/>
                <circle cx="70" cy="60" r="5" fill="${color}"/>
                <circle cx="110" cy="50" r="5" fill="${color}"/>
                <circle cx="130" cy="70" r="5" fill="${color}"/>
                <circle cx="100" cy="90" r="5" fill="${color}"/>
                <circle cx="70" cy="110" r="5" fill="${color}"/>
                <circle cx="130" cy="100" r="5" fill="${color}"/>
                <circle cx="90" cy="130" r="5" fill="${color}"/>
                <circle cx="50" cy="140" r="5" fill="${color}"/>
            </svg>`;
            return 'data:image/svg+xml;base64,' + btoa(svg);
        }
        
        // Open camera for hand capture
        function openCamera(hand) {
            currentHand = hand;
            handInstruction.textContent = `Please position your ${hand} hand in the frame`;
            cameraOverlay.classList.remove('hidden');
            
            // Access camera with current facing mode
            startCamera();
        }
        
        // Start camera with current facing mode
        function startCamera() {
            // Stop any existing stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            
            navigator.mediaDevices.getUserMedia(constraints)
                .then(function(mediaStream) {
                    stream = mediaStream;
                    cameraPreview.srcObject = stream;
                })
                .catch(function(err) {
                    console.error("Camera error:", err);
                    
                    // Try opposite camera if one fails
                    facingMode = facingMode === "user" ? "environment" : "user";
                    startCamera();
                });
        }
        
        // Switch between front and back camera
        switchCameraBtn.addEventListener('click', function() {
            facingMode = facingMode === "user" ? "environment" : "user";
            startCamera();
        });
        
        function closeCameraHandler() {
            cameraOverlay.classList.add('hidden');
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
        }

        // Event listeners for capture buttons
        captureRightBtn.addEventListener('click', () => openCamera('right'));
        captureLeftBtn.addEventListener('click', () => openCamera('left'));
        captureFingerBtn.addEventListener('click', () => openCamera('finger'));

        // Event listeners for recapture buttons
        recaptureRightBtn.addEventListener('click', () => {
            // Reset right hand capture
            rightHand.classList.remove('captured');
            rightPreview.style.display = 'none';
            rightHand.querySelector('i').style.display = 'block';
            captureRightBtn.classList.remove('hidden');
            recaptureRightBtn.classList.add('hidden');
            
            // Open camera for recapture
            openCamera('right');
        });

        recaptureLeftBtn.addEventListener('click', () => {
            // Reset left hand capture
            leftHand.classList.remove('captured');
            leftPreview.style.display = 'none';
            leftHand.querySelector('i').style.display = 'block';
            captureLeftBtn.classList.remove('hidden');
            recaptureLeftBtn.classList.add('hidden');
            
            // Open camera for recapture
            openCamera('left');
        });
        
        recaptureFingerBtn.addEventListener('click', () => {
            // Reset finger capture
            fingerPlaceholder.classList.remove('captured');
            fingerPreview.style.display = 'none';
            fingerPlaceholder.querySelector('i').style.display = 'block';
            captureFingerBtn.classList.remove('hidden');
            recaptureFingerBtn.classList.add('hidden');
            
            // Open camera for recapture
            openCamera('finger');
        });

        closeCamera.addEventListener('click', closeCameraHandler);

        // Capture image
        captureBtn.addEventListener('click', function() {
            if (!stream) return;
            
            const canvas = document.createElement('canvas');
            canvas.width = cameraPreview.videoWidth;
            canvas.height = cameraPreview.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
            
            const imageData = canvas.toDataURL('image/png');
            
            if (currentHand === 'finger') {
                fingerPreview.src = imageData;
                fingerPreview.style.display = 'block';
                
                // Hide the finger icon and show captured state
                fingerPlaceholder.querySelector('i').style.display = 'none';
                fingerPlaceholder.classList.add('captured');
                
                // Toggle capture/recapture buttons
                captureFingerBtn.classList.add('hidden');
                recaptureFingerBtn.classList.remove('hidden');
                
                capturedFingerImage = imageData;
            } else {
                const previewId = currentHand === 'right' ? 'right-preview' : 'left-preview';
                const previewElement = document.getElementById(previewId);
                
                previewElement.src = imageData;
                previewElement.style.display = 'block';
                
                // Hide the hand icon and show captured state
                const handElement = document.getElementById(`${currentHand}-hand`);
                handElement.querySelector('i').style.display = 'none';
                handElement.classList.add('captured');
                
                // Toggle capture/recapture buttons
                const captureBtnId = `capture-${currentHand}`;
                const recaptureBtnId = `recapture-${currentHand}`;
                document.getElementById(captureBtnId).classList.add('hidden');
                document.getElementById(recaptureBtnId).classList.remove('hidden');
            }
            
            closeCameraHandler();
        });
        
        // Back to details
        backToDetailsBtn.addEventListener('click', function() {
            biometrics.classList.add('hidden');
            personalDetails.classList.remove('hidden');
            updateProgress(1);
        });
        
        // Back to biometrics
        backToBiometricsBtn.addEventListener('click', function() {
            fingerSelection.classList.add('hidden');
            biometrics.classList.remove('hidden');
            updateProgress(2);
        });
        
        // Back to finger selection
        backToFingerSelectionBtn.addEventListener('click', function() {
            fingerVerification.classList.add('hidden');
            fingerSelection.classList.remove('hidden');
            updateProgress(3);
        });
        
        // Submit biometrics
        submitBiometricsBtn.addEventListener('click', function() {
            if (!rightHand.classList.contains('captured')) {
                alert('Please capture your right hand image');
                return;
            }
            
            if (!leftHand.classList.contains('captured')) {
                alert('Please capture your left hand image');
                return;
            }
            
            biometrics.classList.add('hidden');
            fingerSelection.classList.remove('hidden');
            updateProgress(3);
            
            // Get best finger images from API
            getBestFingerImages().then(({ finger1, finger2 }) => {
                finger1Preview.src = finger1;
                finger2Preview.src = finger2;
            });
        });
        
        // Finger selection
        selectFingerBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const finger = this.getAttribute('data-finger');
                selectedFinger = finger;
                
                // Highlight selected finger
                document.querySelectorAll('.finger-option').forEach(option => {
                    option.classList.remove('selected');
                });
                this.closest('.finger-option').classList.add('selected');
                
                // Set selected finger label
                if (finger === '1') {
                    selectedFingerImage = finger1Preview.src;
                    selectedFingerLabel.textContent = 'Index Finger';
                } else {
                    selectedFingerImage = finger2Preview.src;
                    selectedFingerLabel.textContent = 'Thumb';
                }
                
                // Move to verification step
                fingerSelection.classList.add('hidden');
                fingerVerification.classList.remove('hidden');
                updateProgress(4);
                
                // Reset verification state
                verificationAttempts = 3;
                attemptsCounter.textContent = '3';
                verificationMessage.textContent = '';
                verificationResult.classList.add('hidden');
                
                // Reset finger capture
                fingerPlaceholder.classList.remove('captured');
                fingerPreview.style.display = 'none';
                fingerPlaceholder.querySelector('i').style.display = 'block';
                captureFingerBtn.classList.remove('hidden');
                recaptureFingerBtn.classList.add('hidden');
            });
        });
        
        // Verify finger
        verifyFingerBtn.addEventListener('click', function() {
            if (!fingerPlaceholder.classList.contains('captured')) {
                alert('Please capture your finger image');
                return;
            }
            
            // Decrement attempts
            verificationAttempts--;
            attemptsCounter.textContent = verificationAttempts;
            
            // Simulate fingerprint matching (in real system, this would be done with biometric algorithms)
            // For demo, we'll simulate a 50% chance of success after 1st attempt, 75% after 2nd, 100% after 3rd
            const successProbability = 0.5 + (3 - verificationAttempts) * 0.25;
            const isMatch = Math.random() < successProbability;
            
            if (isMatch) {
                // Verification successful
                verificationResult.textContent = 'Verification successful! Fingerprint matched.';
                verificationResult.className = 'verification-result verification-success';
                verificationResult.classList.remove('hidden');
                
                // Move to confirmation after delay
                setTimeout(() => {
                    fingerVerification.classList.add('hidden');
                    confirmation.classList.remove('hidden');
                    updateProgress(5);
                }, 1500);
            } else {
                // Verification failed
                verificationResult.textContent = 'Verification failed. Fingerprint did not match.';
                verificationResult.className = 'verification-result verification-failure';
                verificationResult.classList.remove('hidden');
                
                if (verificationAttempts > 0) {
                    verificationMessage.textContent = `Please try again. ${verificationAttempts} attempts remaining.`;
                    verificationMessage.className = '';
                    
                    // Reset finger capture
                    fingerPlaceholder.classList.remove('captured');
                    fingerPreview.style.display = 'none';
                    fingerPlaceholder.querySelector('i').style.display = 'block';
                    captureFingerBtn.classList.remove('hidden');
                    recaptureFingerBtn.classList.add('hidden');
                } else {
                    verificationMessage.textContent = 'Maximum attempts reached. Please restart the biometric process.';
                    verificationMessage.className = 'failed';
                    
                    // After 3 failed attempts, go back to hand capture
                    setTimeout(() => {
                        fingerVerification.classList.add('hidden');
                        biometrics.classList.remove('hidden');
                        updateProgress(2);
                        
                        // Reset hand captures
                        rightHand.classList.remove('captured');
                        rightPreview.style.display = 'none';
                        rightHand.querySelector('i').style.display = 'block';
                        captureRightBtn.classList.remove('hidden');
                        recaptureRightBtn.classList.add('hidden');
                        
                        leftHand.classList.remove('captured');
                        leftPreview.style.display = 'none';
                        leftHand.querySelector('i').style.display = 'block';
                        captureLeftBtn.classList.remove('hidden');
                        recaptureLeftBtn.classList.add('hidden');
                    }, 3000);
                }
            }
        });
        
        // Start new enrollment
        newEnrollmentBtn.addEventListener('click', function() {
            // Reset form
            document.getElementById('enrollment-form').reset();
            biometrics.classList.add('hidden');
            fingerSelection.classList.add('hidden');
            fingerVerification.classList.add('hidden');
            confirmation.classList.add('hidden');
            personalDetails.classList.remove('hidden');
            
            // Reset biometrics
            rightHand.classList.remove('captured');
            rightPreview.style.display = 'none';
            rightHand.querySelector('i').style.display = 'block';
            captureRightBtn.classList.remove('hidden');
            recaptureRightBtn.classList.add('hidden');
            
            leftHand.classList.remove('captured');
            leftPreview.style.display = 'none';
            leftHand.querySelector('i').style.display = 'block';
            captureLeftBtn.classList.remove('hidden');
            recaptureLeftBtn.classList.add('hidden');
            
            // Reset finger verification
            fingerPlaceholder.classList.remove('captured');
            fingerPreview.style.display = 'none';
            fingerPlaceholder.querySelector('i').style.display = 'block';
            captureFingerBtn.classList.remove('hidden');
            recaptureFingerBtn.classList.add('hidden');
            
            // Reset finger selection
            document.querySelectorAll('.finger-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            updateProgress(1);
        });
    });