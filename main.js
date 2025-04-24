// ----- Configuration -----
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw6tLoqtia-GScT3_Aes0pd3HoPrscrEGe5wYzdqJ2u1ATKC9PF0ePe2uOBFDkhqd61/exec'; // <--- **แทนที่ด้วย URL ที่ได้จาก Apps Script**
const LIFF_ID_REGISTER = '2007104190-Qq4B589l';      // <--- **แทนที่ด้วย LIFF ID ของคุณ**
const LIFF_ID_CHECKIN = '2007104190-75q9m3n8';        // <--- **แทนที่ด้วย LIFF ID ของคุณ**
const LIFF_ID_HISTORY = '2007104190-2XA5WG1q';        // <--- **แทนที่ด้วย LIFF ID ของคุณ**
// -------------------------

let liffId = ''; // Will be determined by the current page
let userId = null; // LINE User ID
let profile = null; // LINE Profile

// Determine LIFF ID based on HTML filename
function determineLiffId() {
    const path = window.location.pathname;
    if (path.includes('register.html')) return LIFF_ID_REGISTER;
    if (path.includes('checkin.html')) return LIFF_ID_CHECKIN;
    if (path.includes('history.html')) return LIFF_ID_HISTORY;
    // Add more pages if needed
    console.warn("Could not determine LIFF ID for path:", path);
    // Fallback or default? Maybe use one ID for all if configured that way.
    return LIFF_ID_REGISTER; // Example fallback
}

// --- LIFF Initialization ---
async function initializeLiff() {
    liffId = determineLiffId();
    if (!liffId) {
        showError("LIFF ID ไม่ถูกต้อง");
        return;
    }

    try {
        console.log(`Initializing LIFF with ID: ${liffId}`);
        await liff.init({ liffId: liffId });
        console.log("LIFF initialized.");

        if (!liff.isLoggedIn()) {
            console.log("Not logged in, attempting login...");
            // Redirects to LINE login page and then back
            liff.login({ redirectUri: window.location.href });
        } else {
            console.log("Logged in.");
            profile = await liff.getProfile();
            userId = profile.userId;
            console.log("User ID:", userId);
            console.log("Profile:", profile);

            // Call page-specific setup function if it exists
            if (typeof initializePage === 'function') {
                initializePage();
            } else {
                 console.warn("No initializePage function found for this page.");
            }
        }
    } catch (error) {
        console.error("LIFF Initialization failed:", error);
        showError(`เกิดข้อผิดพลาดในการเริ่ม LIFF: ${error.message}`);
    }
}

// --- Utility Functions ---

function showMessage(msg, isSuccess = true) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = msg;
        messageDiv.style.color = isSuccess ? 'green' : 'red';
        messageDiv.style.display = 'block';
    } else {
        alert(msg); // Fallback
    }
}

function showError(msg) {
    showMessage(msg, false);
}

function hideMessage() {
    const messageDiv = document.getElementById('message');
     if (messageDiv) {
        messageDiv.style.display = 'none';
     }
}


function showCloseButton() {
    const closeBtn = document.getElementById('closeBtn');
     if (closeBtn) {
         closeBtn.style.display = 'block';
         closeBtn.onclick = () => {
             if (liff.isInClient()) {
                 liff.closeWindow();
             } else {
                 alert("กรุณาปิดหน้าต่างนี้ด้วยตนเอง");
             }
         };
     }
}

function disableSubmitButton(btnId = 'submitBtn') {
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'กำลังบันทึก...';
    }
}
function enableSubmitButton(btnId = 'submitBtn', originalText = 'บันทึก') {
     const btn = document.getElementById(btnId);
    if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}


// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    initializeLiff(); // Start LIFF initialization when the page is loaded
});
