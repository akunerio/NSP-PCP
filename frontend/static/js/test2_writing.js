// Global beforeunload handler definition
const beforeUnloadHandler = (e) => {
  e.preventDefault();
  e.returnValue =
    "Leaving the page will result in losing your current progress!";
  return e.returnValue;
};

// Perform initial checks on page load
document.addEventListener("DOMContentLoaded", async () => {
  // console.log("Page loaded, checking login status...");

  try {
    // 1. Verify user session (sid)
    const sid = sessionStorage.getItem("sid");
    if (!sid) {
      // console.log("No sid found, redirecting to login page");
      window.location.href = "/login";
      return;
    }

    // 2. Validate Homework 1 completion status
    const hw1Response = await fetch(`/check_hw1_status/${sid}`);
    if (!hw1Response.ok) {
      throw new Error(`HTTP error! status: ${hw1Response.status}`);
    }
    const hw1Data = await hw1Response.json();

    // 3. Validate Homework 2 completion status
    const hw2Response = await fetch(`/check_hw2_status/${sid}`);
    if (!hw2Response.ok) {
      throw new Error(`HTTP error! status: ${hw2Response.status}`);
    }
    const hw2Data = await hw2Response.json();

    // Ensure both homework assignments are finished before post-test
    if (hw1Data.state !== "Completed" || hw2Data.state !== "Completed") {
      await Swal.fire({
        title: "Homework Required",
        text: "Please complete both Homework 1 and Homework 2 before taking the post-test.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      window.location.href = "/";
      return;
    }

    // 4. Verify post-test eligibility status
    // console.log("Checking posttest status for sid:", sid);
    const response = await fetch(`/check_posttest_status/${sid}`);
    // console.log("API response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // console.log("Posttest status result:", data);

    // 5. Direct user based on test status
    if (!data.canTakeTest) {
      await Swal.fire({
        title: "Test Already Completed",
        text: "You have already completed this test. You cannot take it again.",
        icon: "info",
        confirmButtonText: "OK",
      });
      window.location.href = "/";
      return;
    }

    // 6. Show initial confirmation for the test
    const result = await showStartConfirmation();

    if (result.isConfirmed) {
      try {
        // console.log("Initializing posttest essay...");
        const response = await fetch(`/initialize_posttest/${sid}`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // console.log("Essay initialization result:", data);

        if (data.success) {
          // Store eid in sessionStorage
          sessionStorage.setItem("currentEid", data.eid);
          // Initialize page
          initializePage();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        // console.error("Error initializing essay:", error);
        await Swal.fire({
          title: "Error",
          text: "Failed to initialize the test. Please try again later.",
          icon: "error",
          confirmButtonText: "OK",
        });
        window.location.href = "/";
      }
    } else {
      // User cancelled, return to home page
      window.location.href = "/";
    }
  } catch (error) {
    // console.error("Error checking posttest status:", error);
    await Swal.fire({
      title: "Error",
      text: "Failed to check test status. Please try again later.",
      icon: "error",
      confirmButtonText: "OK",
    });
    window.location.href = "/";
  }

// Setup expandable instruction components
  document.querySelectorAll(".instruction-box").forEach((box) => {
    box.addEventListener("click", function () {
      this.classList.toggle("expanded");
      const icon = this.querySelector(".instruction-icon");
      if (icon) {
        icon.style.transform = this.classList.contains("expanded")
          ? "rotate(180deg)"
          : "rotate(0)";
      }
    });
  });
});

// Display start confirmation dialog
async function showStartConfirmation() {
  return await Swal.fire({
    title: "Ready to Start Testing?",
    html: `
      <div class="confirmation-dialog">
        <p class="confirmation-message">
          The test content will be loaded, and a timer will begin <b>counting down from 20 minutes.</b>
          <br><br>          
          <b>Note:</b> <u>Closing or refreshing this window will invalidate your test.</u>
          <br><br>
          Click "Start" when you're ready to begin.
        </p>
        <div class="confirm-button-wrapper">
          <div class="countdown-overlay"></div>
        </div>
      </div>
    `,
    icon: "info",
    showCancelButton: true,
    confirmButtonText: "Start",
    cancelButtonText: "Go Back",
    confirmButtonColor: "#1a73e8",
    cancelButtonColor: "#dc3545",
    allowOutsideClick: false,
    allowEscapeKey: false,
    reverseButtons: false,
    didOpen: () => {
      const confirmButton = Swal.getConfirmButton();
      confirmButton.disabled = true;
      setTimeout(() => {
        confirmButton.disabled = false;
      }, 5000);
    },
  });
}

// Initialize the post-test page components
function initializePage() {
  // Default demonstration data for post-test
  const demoData = {
    title: "Introducing Lebaran in Indonesia",
    images: [
      {
        url: "/static/assets/img/post-test_1.webp",
        keywords: ["prayer", "traditional clothes", "community", "religion"],
        description:
          "Muslim worshippers, dressed in traditional clothing, face the mosque to perform the Lebaran morning prayer.",
      },
      {
        url: "/static/assets/img/post-test_2.png",
        keywords: ["reunion", "celebration", "togetherness", "travel"],
        description:
          "Indonesian families reunite during Lebaran, as many people return to their hometowns to celebrate the holiday with their loved ones.",
      },
      {
        url: "/static/assets/img/post-test_3.jpg",
        keywords: ["parent", "envelope", "receive", "blessing", "generous"],
        description:
          "An Indonesian parent generously gives an envelope of uang THR to two children during Lebaran, offering both money and a heartfelt blessing.",
      },
    ],
  };

  // 1. Build the UI interface layout
  createInterface();

  // 2. Set the article title
  document.getElementById("articleTitle").textContent = demoData.title;

  // 3. Load contextual resources (images/keywords)
  initializeResources(demoData.images);

  // 4. Start the 20-minute countdown timer
  initializeCountdown();

  // Register page exit warning listener
  window.addEventListener("beforeunload", beforeUnloadHandler);
}

function createInterface() {
  const mainStructure = `
    <main>
      <div class="writing-container">
        <!-- Action toolbar -->
        <header class="writing-header">
          <div class="header-left">
            <h2>Post-Test</h2>
          </div>
          <div class="header-center">
            <div id="countdownTimer" class="countdown-timer">60:00</div>
          </div>
          <div class="header-right">
            <button class="submit-button" onclick="handleSubmit()">
              Submit Essay
            </button>
          </div>
        </header>
        
        <!-- Content area layout -->
        <div class="main-content">
          <!-- Writing zone -->
          <div class="editor-section">
            <!-- Topic header -->
            <div class="topic-title">
              <h2><span class="topic-label">Title: </span><span id="articleTitle"></span></h2>
            </div>
            
            <!-- Expandable writing guidance -->
            <div class="instruction-box">
              <div class="instruction-header">
                <svg class="instruction-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Instruct</span>
              </div>
              <div class="instruction-content">
                <p>Lebaran is the most important holiday in Indonesia, celebrating the end of the Muslim fasting month of Ramadan. It is also a time for Indonesians to spend quality moments with family and friends. The pictures show the festive activities of Lebaran. Please write an essay to introduce Lebaran in Indonesia to the readers.</p>
                <p>Please follow these guidelines for your writing:</p>
                <li>Please write an essay based on the Title and the provided Context information.</li>
                <li>Please write at least 150 Words.</li>
                <li>The test duration is <b>20 minutes</b>. It will be automatically submitted when time is up. You may also choose to submit it manually by clicking <b>"Submit Essay"</b>.</li>
                <li><b>Closing or refreshing this window will invalidate your test.</b></li>
              </div>
            </div>

            <!-- Core editor interface -->
            <div class="area-title"> Writing Area </div>
            <div class="editor-container">
              <div id="editor" class="editor" contenteditable="true"></div>
            </div>

            <!-- Contextual material section -->
            <div class="area-title"> Context Information </div>
            <div class="context-container">
              <div class="resources-container">
                <!-- Dynamic resource area -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;

  // Inject into the body container
  document.body.innerHTML = mainStructure;
}

// Setup resource grid functionality
function initializeResources(images) {
  // Locate new container position
  const container = document.querySelector(
    ".editor-section .resources-container"
  );

  if (!container) {
    // console.error("Resource container not found");
    return;
  }

  images.forEach((image, index) => {
    const resourceElement = createResourceElement(image, index);
    container.appendChild(resourceElement);
  });
}

// Create a resource card with keyword chips
function createResourceElement(image, index) {
  const div = document.createElement("div");
  div.className = "resource-item";

  // Append timestamp to bust image cache
  const timestamp = new Date().getTime();
  const imageUrl = `${image.url}?t=${timestamp}`;

  div.innerHTML = `
    <div class="resource-preview" style="cursor: pointer;">
      <img src="${imageUrl}" alt="Resource ${index + 1}" class="resource-image">
      <div class="resource-info">
        <div class="resource-keywords">
          ${image.keywords
            .map((keyword) => `<span class="keyword-chip">${keyword}</span>`)
            .join("")}
        </div>
        <p class="resource-description">${image.description}</p>
      </div>
    </div>
  `;

  // Pass cache-busted URL to modal display function
  div.querySelector(".resource-preview").addEventListener("click", () => {
    showResourceModal(imageUrl, image.keywords, image.description);
  });

  return div;
}

// Handle modal popups for resources
function showResourceModal(imagePath, keywords, description) {
  const keywordsHtml = keywords
    .map((keyword) => `<span class="modal-keyword-chip">${keyword}</span>`)
    .join("");

  Swal.fire({
    html: `
      <div class="resource-modal">
        <div class="modal-image-container">
          <img src="${imagePath}" alt="Resource Image" class="modal-image">
        </div>
        <div class="modal-content">
          <div class="modal-keywords">
            <h3>Keywords:</h3>
            <div class="modal-keywords-container">
              ${keywordsHtml}
            </div>
          </div>
          <div class="modal-description">
            <h3>Description:</h3>
            <p>${description}</p>
          </div>
        </div>
      </div>
    `,
    width: "80%",
    showConfirmButton: true, // Set to true
    confirmButtonText: "Close", // Add close button text
    confirmButtonColor: "#6c757d", // Set button color
    customClass: {
      popup: "resource-modal-popup",
      confirmButton: "btn btn-secondary", // Add button style
    },
  });
}

// Countdown timer management logic (20 minutes)
function initializeCountdown() {
  let timeLeft = 1200; // 1 hour = 3600 seconds

  // Start ticking immediately
  const countdownInterval = setInterval(() => {
    timeLeft--;
    updateTimeDisplay(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      // Automatically submit when timer expires
      timeUp();
    }
  }, 1000);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function updateTimeDisplay(timeLeft) {
  document.getElementById("countdownTimer").textContent = formatTime(timeLeft);
  document.title = `Writing Test (${formatTime(timeLeft)})`;
}

// Logic for handling time expiration state
async function timeUp() {
  // Perform final content synchronization
  const updateSuccess = await updateEssayContent();

  let message = "The test has ended.";
  if (!updateSuccess) {
    message += " (Failed to save your essay)";
  }

  await Swal.fire({
    title: "Time is up!",
    text: message,
    icon: "info",
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    confirmButtonText: "OK",
  });

  window.location.href = "/";
}

// Push current draft content to server state
async function updateEssayContent() {
  try {
    const eid = sessionStorage.getItem("currentEid");
    const content = document.getElementById("editor").innerText;

    const response = await fetch(`/update_pretest_essay/${eid}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: content }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    // console.error("Error updating essay:", error);
    return false;
  }
}

// Final test submission logic flow
function handleSubmit() {
  Swal.fire({
    title: "Confirm Submission",
    text: "Do you want to submit your essay? You cannot edit after submission.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Submit",
    cancelButtonText: "Cancel",
    showDenyButton: false,
  }).then(async (result) => {
    if (result.isConfirmed) {
      // Final sync before transition
      const updateSuccess = await updateEssayContent();

      if (updateSuccess) {
        // Clear unload blockers
        window.removeEventListener("beforeunload", beforeUnloadHandler);
        // Clear local caches and return to home dashboard
        localStorage.removeItem("writingContent");
        // Redirect to dashboard
        window.location.href = "/";
      } else {
        await Swal.fire({
          title: "Error",
          text: "Failed to save your essay. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  });
}

// Text marker analysis functionality
const textarea = document.getElementById("articleInput");
const prevSentence = document.getElementById("prevSentence");
const currentSentence = document.getElementById("currentSentence");
const nextSentence = document.getElementById("nextSentence");
const currentCase = document.getElementById("currentCase");
const markedText = document.getElementById("markedText");

// textarea.addEventListener("input", updateSentences);
// textarea.addEventListener("click", updateSentences);
// textarea.addEventListener("keyup", updateSentences);

function normalizeText(text) {
  // Analytical normalization, preserves original structure
  return text
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/，/g, ",")
    .replace(/。/g, ".")
    .replace(/！/g, "!")
    .replace(/？/g, "?")
    .trim();
}

function updatePrediction() {
  const editor = document.getElementById("editor");
  const predictionBtn = document.getElementById("predictionBtn");
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);

  // Calculate cursor offset for marker placement
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editor);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  const cursorPosition = preCaretRange.toString().length;

  const originalText = editor.textContent;

  // Validate cursor position for prediction activation
  const charBeforeCursor = originalText[cursorPosition - 1];
  const isAtStart = cursorPosition === 0;
  const isValidPosition = isAtStart || /[.!?]/.test(charBeforeCursor);

  // Check for valid final punctuation in the draft
  const lastChar = originalText.trim().slice(-1);
  const hasValidEnding = /[.!?]/.test(lastChar);

  // Update button availability status
  predictionBtn.disabled = !(isValidPosition && hasValidEnding);

  // Update visual state display message
  updatePredictionStatus(editor, isValidPosition, hasValidEnding);

  // Locate DOM target for marker display
  const markedText = document.getElementById("markedText");

  // Show markers only in valid cursor positions
  if (!isValidPosition) {
    markedText.textContent = originalText;
    return;
  }

  // Split content around cursor for marker insertion
  const beforeText = originalText.slice(0, cursorPosition);
  const afterText = originalText.slice(cursorPosition);

  // Rebuild content with visual prediction placeholders
  const markContent = beforeText + " [PREDICT] " + afterText;
  markedText.textContent = markContent;
}
