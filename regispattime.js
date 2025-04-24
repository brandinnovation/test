function initializePage() {
    console.log("Initializing Registration Page");
    const form = document.getElementById('registrationForm');
    const fileInput = document.getElementById('profilePic');
    const preview = document.getElementById('preview');
    const submitBtn = document.getElementById('submitBtn');

    if (!form || !fileInput || !preview || !submitBtn) {
        console.error("Registration form elements not found!");
        showError("เกิดข้อผิดพลาดในการโหลดหน้าลงทะเบียน");
        return;
    }

    // Image preview handler
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        } else {
            preview.src = '#';
            preview.style.display = 'none';
        }
    });

    // Form submission handler
    form.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevent default HTML form submission
        hideMessage();
        if (!userId) {
            showError("ไม่สามารถระบุ LINE User ID ได้ โปรดลองอีกครั้ง");
            return;
        }
        disableSubmitButton();

        const formData = new FormData(form);
        const data = {
            action: "register",
            userId: userId,
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            nickname: formData.get('nickname'),
            phoneNumber: formData.get('phoneNumber'),
            accountNumber: formData.get('accountNumber'),
            bank: formData.get('bank'),
            profilePicUrl: "" // Default to empty, modify if using Base64/Drive upload
        };

        const imageFile = fileInput.files[0];
        if (imageFile) {
            // --- Option 1: Convert to Base64 (Simpler, but large strings in Sheet) ---
            // try {
            //     const base64String = await fileToBase64(imageFile);
            //     data.profilePicBase64 = base64String; // Send Base64 to Apps Script
            //     // Make sure Apps Script's handleRegistration expects 'profilePicBase64'
            // } catch (error) {
            //     showError("เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ: " + error.message);
            //     enableSubmitButton('submitBtn','บันทึกข้อมูล');
            //     return;
            // }

            // --- Option 2: Placeholder for Direct Upload (More complex) ---
            // You would need a different backend approach (e.g., Cloud Function, dedicated server)
            // or potentially use the (now deprecated?) FileReader in Apps Script (not recommended)
            // For simplicity with Apps Script, Base64 or saving to Drive from Base64 is common.
            // If saving to Drive via Apps script, send base64 and let script handle it.
            // For now, we'll just log a message if we wanted direct upload.
            console.log("Image selected, sending Base64 is typical for Apps Script.");
             try {
                 const base64String = await fileToBase64(imageFile);
                 // If Apps Script saves to drive, send base64
                 data.profilePicBase64 = base64String; // Send base64 to GAS
                 // Make sure GAS function handleRegistration & saveBase64ImageToDrive are setup
             } catch (error) {
                 showError("เกิดข้อผิดพลาดในการแปลงรูปภาพ: " + error.message);
                 enableSubmitButton('submitBtn','บันทึกข้อมูล');
                 return;
             }
        }

        console.log("Sending registration data:", data);

        try {
            const response = await fetch(GAS_WEB_APP_URL, {
                method: 'POST',
                mode: 'cors', // Required for cross-origin requests to Apps Script
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
                 // Apps Script doPost expects a string payload
                 body: JSON.stringify(data)
                // redirect: 'follow', // Optional
                // referrerPolicy: 'no-referrer', // Optional
            });

            if (!response.ok) {
                // Try to get error details from response body if possible
                let errorDetails = `HTTP status ${response.status}`;
                try {
                    const errorJson = await response.json();
                    errorDetails += `: ${errorJson.message || errorJson.error || JSON.stringify(errorJson)}`;
                } catch (parseError) {
                    // Ignore if response body is not JSON
                }
                 throw new Error(errorDetails);
            }

            const result = await response.json();
            console.log("GAS Response:", result);

            if (result.success) {
                showMessage(result.message || "บันทึกข้อมูลเรียบร้อย");
                form.reset(); // Clear the form
                preview.style.display = 'none';
                showCloseButton(); // Show the close button
            } else {
                showError(result.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            showError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้: " + error.message);
        } finally {
             enableSubmitButton('submitBtn','บันทึกข้อมูล');
        }
    });
}

// Helper function to convert File to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result); // Returns base64 string (e.g., "data:image/jpeg;base64,...")
        reader.onerror = error => reject(error);
    });
}
