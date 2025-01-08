async function initLIFF() {
  try {
    await liff.init({
      liffId: "2006738214-149nvm0m" // ใส่ LIFF ID ของคุณตรงนี้ 
    });
    initializeApp();
  } catch (error) {
    console.error("LIFF initialization failed:", error);
  }
}

function initializeApp() {
  const form = document.getElementById("orderForm");
  const loadingMessage = document.getElementById("loadingMessage");
  const successMessage = document.getElementById("successMessage");
  const closeButton = document.getElementById("closeButton");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const orderNumber = document.getElementById("orderNumber").value;
    const imageFile = document.getElementById("imageFile").files[0];

    if (!orderNumber || !imageFile) {
      alert("กรุณากรอกเลขที่ออเดอร์และอัพโหลดรูปภาพ");
      return;
    }

    loadingMessage.style.display = "block";
    form.style.display = "none";

    try {
      const imageData = await readFileAsDataURL(imageFile);

      // เรียกใช้ฟังก์ชัน Apps Script
      const url = "https://script.google.com/macros/s/AKfycbwa8NbUubfH_CsYLbAt2jqxqrAcQMxRMKTmpzwDaJACd2rnfByX7QxPN58m07hzjguATw/exec"; // URL ของ Apps Script ที่ deploy
      fetch(`${url}?orderNumber=${orderNumber}&imageData=${imageData}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            sendFlexMessage(liff.getProfile().displayName);
            successMessage.style.display = "block";
            loadingMessage.style.display = "none";
          } else {
            throw new Error("Apps Script failed");
          }
        })
        .catch(error => {
          console.error("Error:", error);
          alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
          loadingMessage.style.display = "none";
          form.style.display = "block";
        });

    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      loadingMessage.style.display = "none";
      form.style.display = "block";
    }
  });

  closeButton.addEventListener("click", () => {
    liff.closeWindow();
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function sendFlexMessage(displayName) {
  const flexMessage = {
    "type": "flex",
    "altText": "รูปภาพได้รับการบันทึกแล้ว",
    "contents": {
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": `ขอบคุณ คุณ ${displayName}`,
            "weight": "bold",
            "size": "xl"
          },
          {
            "type": "text",
            "text": "รูปภาพได้รับการบันทึกแล้ว"
          }
        ]
      }
    }
  };
  await liff.sendMessages([flexMessage]);
}

initLIFF();
