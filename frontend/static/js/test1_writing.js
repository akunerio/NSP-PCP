// Global beforeunload handler definition
const beforeUnloadHandler = (e) => {
  e.preventDefault();
  e.returnValue =
    "Leaving the page will result in losing your current progress!";
  return e.returnValue;
};

// Execute initial checks on page load
document.addEventListener("DOMContentLoaded", async () => {
  // console.log("Page loaded, checking login status...");

  try {
    // 1. Verify user session existence (sid)
    const sid = sessionStorage.getItem("sid");
    if (!sid) {
      // console.log("No sid found, redirecting to login page");
      window.location.href = "/login";
      return;
    }

    // 2. Check pre-test eligibility status
    // console.log("Checking pretest status for sid:", sid);
    const response = await fetch(`/check_pretest_status/${sid}`);
    // console.log("API response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // console.log("Pretest status result:", data);

    // 3. Handle state based on eligibility
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

    // 4. Show initial test confirmation modal
    const result = await showStartConfirmation();

    if (result.isConfirmed) {
      try {
        // console.log("Initializing pretest essay...");
        const response = await fetch(`/initialize_pretest/${sid}`, {
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
    // console.error("Error checking pretest status:", error);
    await Swal.fire({
      title: "Error",
      text: "Failed to check test status. Please try again later.",
      icon: "error",
      confirmButtonText: "OK",
    });
    window.location.href = "/";
  }

// Setup expandable instruction boxes
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

// Show start confirmation modal
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

// Initialize the test page elements
function initializePage() {
  // Default demo data for the test
  const demoData = {
    title: "How To Make Kimchi",
    images: [
      {
        url: "/static/assets/img/pre-test_1.jpg",
        keywords: ["napa cabbage", "cut", "prepare", "ingredients", "knife"],
        description:
          "Use a knife to cut the fresh napa cabbage and prepare to make kimchi.",
      },
      {
        url: "/static/assets/img/pre-test_2.webp",
        keywords: ["mix", "seasoning", "spicy", "gloves", "bowl"],
        description:
          "The cabbage is mixed with spicy seasoning using gloved hands in a large bowl.",
      },
      {
        url: "/static/assets/img/pre-test_3.webp",
        keywords: ["jar", "ferment", "container", "preserve"],
        description:
          "The seasoned kimchi is placed into a jar for fermentation.",
      },
    ],
  };

  // 1. Build the interface structure
  createInterface();

  // 2. Assign the article title
  document.getElementById("articleTitle").textContent = demoData.title;

  // 3. Setup context resources (images/keywords)
  initializeResources(demoData.images);

  // 4. Start the test countdown timer
  initializeCountdown();

  // Add exit warning listener
  window.addEventListener("beforeunload", beforeUnloadHandler);
}

function createInterface() {
  const mainStructure = `
    <main>
      <div class="writing-container">
        <!-- Action toolbar -->
        <header class="writing-header">
          <div class="header-left">
            <h2>Pre-Test</h2>
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
        
        <!-- Main layout area -->
        <div class="main-content">
          <!-- Writing zone -->
          <div class="editor-section">
            <!-- Topic header -->
            <div class="topic-title">
              <h2><span class="topic-label">Title: </span><span id="articleTitle"></span></h2>
            </div>
            
            <!-- Expandable instruction set -->
            <div class="instruction-box">
              <div class="instruction-header">
                <svg class="instruction-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Instruct</span>
              </div>
              <div class="instruction-content">
                <p>Kimchi is a famous Korean food made from fermented vegetables. The pictures show the steps of how it is made. Please write an essay to introduce to the readers how kimchi is made.</p>
                <p>Please follow these guidelines for your writing:</p>
                <li>Please write an essay based on the Title and the provided Context information.</li>
                <li>Please write at least 150 Words.</li>
                <li>The test duration is <b>20 minutes</b>. It will be automatically submitted when time is up. You may also choose to submit it manually by clicking <b>"Submit Essay"</b>.</li>
                <li><b>Closing or refreshing this window will invalidate your test.</b></li>
              </div>
            </div>

            <!-- Editor interface -->
            <div class="area-title"> Writing Area </div>
            <div class="editor-container">
              <div id="editor" class="editor" contenteditable="true"></div>
            </div>

            <!-- Contextual material area -->
            <div class="area-title"> Context Information </div>
            <div class="context-container">
              <div class="resources-container">
                <!-- Dynamic resource container -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;

  // Inject structure into body
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

// Create a resource card element
function createResourceElement(image, index) {
  const div = document.createElement("div");
  div.className = "resource-item";

  // Append timestamp to prevent image caching
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

  // Use cache-busting URL for modal display
  div.querySelector(".resource-preview").addEventListener("click", () => {
    showResourceModal(imageUrl, image.keywords, image.description);
  });

  return div;
}

// Display modal for resource details
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

// Countdown timer management logic
function initializeCountdown() {
  let timeLeft = 1200; // 1 hour = 3600 seconds

  // Start ticking immediately (20 minutes)
  const countdownInterval = setInterval(() => {
    timeLeft--;
    updateTimeDisplay(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      // Auto-submit when time expires
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

// Logic for handling test expiration
async function timeUp() {
  // Attempt final save of content
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

// Push current editor state to server
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

// Final test submission logic
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
      // Final sync before submission
      const updateSuccess = await updateEssayContent();

      if (updateSuccess) {
        // Remove unload warnings
        window.removeEventListener("beforeunload", beforeUnloadHandler);
        // Clear local caches and return home
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

// Text analysis markers functionality
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
  // Analytical normalization, doesn't modify original content structure
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

  // Calculate relative cursor position
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editor);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  const cursorPosition = preCaretRange.toString().length;

  const originalText = editor.textContent;

  // Check for valid sentence termination before cursor or start of text
  const charBeforeCursor = originalText[cursorPosition - 1];
  const isAtStart = cursorPosition === 0;
  const isValidPosition = isAtStart || /[.!?]/.test(charBeforeCursor);

  // Verify if final character is a valid sentence ender
  const lastChar = originalText.trim().slice(-1);
  const hasValidEnding = /[.!?]/.test(lastChar);

  // Update button availability
  predictionBtn.disabled = !(isValidPosition && hasValidEnding);

  // Update visual status indicator
  updatePredictionStatus(editor, isValidPosition, hasValidEnding);

  // Locate DOM element for marked text display
  const markedText = document.getElementById("markedText");

  // Display markers only in valid positions
  if (!isValidPosition) {
    markedText.textContent = originalText;
    return;
  }

  // Split text around cursor preserving formatting
  const beforeText = originalText.slice(0, cursorPosition);
  const afterText = originalText.slice(cursorPosition);

  // Reconstruct text with visual markers
  const markContent = beforeText + " [PREDICT] " + afterText;
  markedText.textContent = markContent;
}
