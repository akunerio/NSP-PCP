// Define global beforeunload handler
const beforeUnloadHandler = (e) => {
  e.preventDefault();
  e.returnValue =
    'Before leaving the page, please make sure you have clicked "Save", or your current progress will be lost!';
  return e.returnValue;
};

// Check homework status
async function checkHomeworkStatus(sid) {
  try {
    // console.log("Checking homework status for sid:", sid);
    const response = await fetch(`/check_hw1_status/${sid}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // console.log("Homework status check result:", data);

    // If no Homework 1 essay found
    if (!data.hasEssay) {
      window.location.href = "/hw1_writing_setup";
      return;
    }

    // If already completed
    if (data.state === "Completed") {
      await Swal.fire({
        title: "Essay Already Completed",
        text: "You have already completed this essay. You cannot take it again.",
        icon: "info",
        confirmButtonText: "OK",
      });
      window.location.href = "/";
      return;
    }

    // If state is Editing, check for eid
    if (data.state === "Editing") {
      if (!data.eid) {
        throw new Error("Essay ID not found");
      }

      try {
        // Load essay related data
        const response = await fetch(`/load_hw_data/${data.eid}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const essayData = await response.json();
        if (!essayData.success) {
          throw new Error(essayData.error || "Failed to load essay data");
        }

        // Ensure essayData.data exists
        if (!essayData.data) {
          throw new Error("Invalid essay data structure");
        }

        // Merge data.eid into essayData.data
        const mergedData = {
          ...essayData.data,
          essay: {
            ...essayData.data.essay,
            eid: data.eid, // Ensure eid is saved
          },
        };

        // Store merged data into sessionStorage
        sessionStorage.setItem("essayData", JSON.stringify(mergedData));

        // Verify if saved successfully
        const savedData = JSON.parse(sessionStorage.getItem("essayData"));

        if (!savedData?.essay?.eid) {
          throw new Error("Failed to save essay ID");
        }

        return true;
      } catch (error) {
        // console.error("Error loading essay data:", error);
        throw error;
      }
    }

    // Other unexpected states
    throw new Error("Unexpected essay state");
  } catch (error) {
    // console.error("Error checking homework status:", error);
    throw error;
  }
}

// Main initialization flow
document.addEventListener("DOMContentLoaded", async function () {
  try {
    // 1. Check user login session
    const sid = sessionStorage.getItem("sid");
    if (!sid) {
      // console.log("No sid found, redirecting to login page");
      window.location.href = "/login";
      return;
    }

    // 2. Validate pre-test completion status
    const pretestResponse = await fetch(`/check_pretest_status/${sid}`);
    if (!pretestResponse.ok) {
      throw new Error(`HTTP error! status: ${pretestResponse.status}`);
    }
    const pretestResult = await pretestResponse.json();

    // If canTakeTest is true, pre-test is not completed
    if (pretestResult.canTakeTest) {
      await Swal.fire({
        title: "Pre-test Required",
        text: "Please complete the pre-test before accessing the homework.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      window.location.href = "/";
      return;
    }

    // 3. Verify current homework progress
    await checkHomeworkStatus(sid);

    // 4. Wait for global scripts to finish loading UI components
    waitForScriptsInit();
  } catch (error) {
    // console.error("Initialization error:", error);
    await Swal.fire({
      title: "Error",
      text: "Failed to initialize the page. Please try again later.",
      icon: "error",
      confirmButtonText: "OK",
    });
    window.location.href = "/";
  }
});

// Initialization logic
function waitForScriptsInit() {
  const checkScriptsInit = setInterval(() => {
    if (document.querySelector("#layoutSidenav_content")) {
      clearInterval(checkScriptsInit);
      initializePage();
    }
  }, 100);
}

// Page initialization function
function initializePage() {
  try {
    // Retrieve essay data from session storage
    const essayData = JSON.parse(sessionStorage.getItem("essayData"));
    // console.log("Parsed essay data:", essayData); // Debug message

    if (!essayData || !essayData.essay) {
      throw new Error("Invalid essay data format");
    }

    // 1. Construct the page layout
    createInterface();

    // Initialize all instruction boxes expand/collapse functionality
    document.querySelectorAll(".instruction-box").forEach((box) => {
      box.addEventListener("click", function () {
        this.classList.toggle("expanded");
      });
    });

    // 2. Display article title
    const titleElement = document.getElementById("articleTitle");
    if (!titleElement) {
      throw new Error("Article title element not found");
    }
    titleElement.textContent = essayData.essay.topic || "Untitled";

    // 3. Load previous content into editor
    const editorElement = document.getElementById("editor");
    if (!editorElement) {
      throw new Error("Editor element not found");
    }
    editorElement.innerHTML = essayData.essay.content || "";

    // 4. Setup sidebar and resource panels
    initializeSidebar();
    if (Array.isArray(essayData.images)) {
      initializeResources(essayData.images);
    }

    // 5. Restore previous AI predictions
    if (Array.isArray(essayData.predictions)) {
      initializePredictionCards(essayData.predictions);
    }

    // 6. Monitor page leave to warn about unsaved changes
    window.addEventListener("beforeunload", beforeUnloadHandler);
  } catch (error) {
    // console.error("Error in initializePage:", error); // Update error message
    Swal.fire({
      title: "Error",
      text: `Failed to load essay data: ${error.message}`, // Show detailed error message
      icon: "error",
      confirmButtonText: "OK",
    }).then(() => {
      window.location.href = "/";
    });
  }
}

// New function to initialize prediction cards
function initializePredictionCards(predictions) {
  const container = document.querySelector(".prediction-content");
  if (!container) {
    // console.error("Prediction content container not found");
    return;
  }

  // Create a card for each prediction
  predictions.forEach((prediction) => {
    const card = createExistingPredictionCard(prediction);
    container.appendChild(card);
  });
}

function createExistingPredictionCard(prediction) {
  const card = document.createElement("div");
  card.className = "prediction-result-card";
  card.id = prediction.pid;

  // Get final result based on option
  const finalResult =
    prediction.option === "Incorrect"
      ? "[Incorrect]"
      : prediction.option === "Modify"
      ? prediction.modify_pcontent
      : prediction.pcontent;

  // Create a marked record_content
  const markedContent = prediction.record_content.replace(
    finalResult,
    `<span class="highlighted-text" style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">${finalResult}</span>`
  );

  // Save record information
  card.dataset.finalResult = finalResult;
  card.dataset.recordContent = markedContent; // Save content with markings

  card.innerHTML = `
      <div class="card-header">
            <span class="card-id">${prediction.pname}</span>
            <svg class="info-icon" viewBox="0 0 24 24" onclick="showExistingPredictionInfo('${
              prediction.pid
            }')" style="display: block;">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
            </svg>
      </div>
      <div class="prediction-text">${prediction.pcontent}</div>
      <div class="prediction-actions">
          <button class="prediction-btn btn-correct ${
            prediction.option === "Correct" ? "selected" : ""
          }" 
                  data-action="correct" ${prediction.option ? "disabled" : ""}>
              Correct
          </button>
          <button class="prediction-btn btn-modify ${
            prediction.option === "Modify" ? "selected" : ""
          }" 
                  data-action="modify" ${prediction.option ? "disabled" : ""}>
              Modify
          </button>
          <button class="prediction-btn btn-incorrect ${
            prediction.option === "Incorrect" ? "selected" : ""
          }" 
                  data-action="incorrect" ${
                    prediction.option ? "disabled" : ""
                  }>
              Incorrect
          </button>
      </div>
      <div class="edit-container" ${
        prediction.option === "Modify" ? 'style="display: block;"' : ""
      }>
          <textarea class="edit-input" readonly>${
            prediction.modify_pcontent || prediction.pcontent
          }</textarea>
      </div>
  `;

  return card;
}

function createInterface() {
  const mainStructure = `
    <main>
      <div class="writing-container">
        <!-- Top Button Area -->
        <header class="writing-header">
          <div class="header-left">
            <button class="submit-button" style="background-color: #dc3545;" onclick="handleReset()">
              Reset Essay
            </button>
          </div>
          <div class="header-center">
            <button class="submit-button" onclick="handleSave()" style="background-color: #1a73e8;">
              Save Essay
            </button>
          </div>
          <div class="header-right">
            <button class="submit-button" onclick="handleSubmit()">
              Submit Essay
            </button>
          </div>
        </header>

        <!-- Main Content Area -->
        <div class="main-content">
          <!-- Writing Area -->
          <div class="editor-section">
            <!-- Title Area -->
            <div class="topic-title">
              <h2><span class="topic-label">Title: </span><span id="articleTitle"></span></h2>
            </div>

            <!-- Add Writing Guidelines Block -->
            <div class="instruction-box">
              <div class="instruction-header">
                <svg class="instruction-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Instruct</span>
              </div>
              <div class="instruction-content">
                <p>Please follow these guidelines for your writing:</p>
                <li>Please write an essay based on the Title and the context information you have set.</li>
                <li>There is no time limit for this homework. You may edit your essay freely before submission.</li>
                <li>Please remember to click <b>"Save Essay"</b> before leaving the page to avoid losing your progress.</li>
                <li>If you want to reset the Title or context information, you need to click <b>"Reset Essay"</b> to reconfigure. This action will erase your current progress.</li>
                <li>When you finished writing, you can click <b>"Submit Essay"</b> to submit.</li>
                <li>You may use the <b>"Prediction Function"</b> at any time. Please refer to the instructions in the prediction function bar for usage details.</li>
              </div>
            </div>
            
            <!-- Upper Part: Editor -->
            <div class="area-title"> Writing Area </div>
            <div class="editor-container">
              <div id="editor" class="editor" contenteditable="true"></div>
            </div>

            <!-- Lower Part: Context Information -->
            <div class="area-title"> Context Information </div>
            <div class="context-container">
              <div class="resources-container">
                <!-- Images and keywords will be dynamically loaded here -->
              </div>
            </div>
          </div>

          <!-- Right Side Function Panel -->
          <div class="sidebar">
            <!-- Function Switching Buttons -->
            <div class="sidebar-tabs">
              <button class="tab-btn active" data-tab="prediction">
                <i class="fas fa-chart-line"></i> <br />Prediction Function
              </button>
            </div>

            <!-- Function Panel Content -->
            <div class="sidebar-content">
              <!-- Prediction Panel -->
              <div class="tab-panel active" id="predictionPanel">
                <div class="prediction-container">
                  <!-- Hidden elements related to prediction -->
                  <div style="display: none">
                    <span id="prevSentence"></span>
                    <span id="currentSentence"></span>
                    <span id="nextSentence"></span>
                    <span id="currentCase"></span>
                    <span id="markedText"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `;

  // Find the main element in layoutSidenav_content and insert content
  const mainContent = document.querySelector("#layoutSidenav_content main");
  if (mainContent) {
    mainContent.innerHTML = mainStructure;
  } else {
    // console.error("Main content area not found");
  }
}

function handleReset() {
  Swal.fire({
    title: "Reset Homework",
    html: `
      <p style="text-align: center;">
        Do you want to reset your homework?\
        <br><br>
        This will reset your images and title, clear all current progress, and return to the setup page.
      </p>
    `,
    icon: "info",
    showCancelButton: true,
    confirmButtonText: "Reset",
    cancelButtonText: "Cancel",
    showDenyButton: false,
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // 1. Locate current essay data
        const essayDataStr = sessionStorage.getItem("essayData");
        if (!essayDataStr) {
          throw new Error("Essay data not found");
        }

        const essayData = JSON.parse(essayDataStr);
        if (!essayData?.essay?.eid) {
          throw new Error("Essay ID not found");
        }

        // 2. Call backend reset endpoint
        const response = await fetch(`/reset_hw/${essayData.essay.eid}`, {
          method: "POST",
        });

        const resetResult = await response.json();
        if (!resetResult.success) {
          throw new Error(resetResult.error || "Reset failed");
        }

        // 3. Clear local cache and redirect to setup
        window.removeEventListener("beforeunload", beforeUnloadHandler);
        localStorage.removeItem("writingContent");
        window.location.href = "/hw1_writing_setup";
      } catch (error) {
        // console.error("Reset error:", error);
        Swal.fire({
          icon: "error",
          title: "Reset Failed",
          text: error.message,
        });
      }
    }
  });
}

async function handleSave() {
  try {
    // 1. Retrieve current session data
    const essayDataStr = sessionStorage.getItem("essayData");
    if (!essayDataStr) {
      throw new Error("Essay data not found");
    }

    // 2. Parse essayData
    const essayData = JSON.parse(essayDataStr);

    // 3. Validate eid
    if (!essayData?.essay?.eid) {
      throw new Error("Essay ID not found, please reload the page");
    }
    const eid = essayData.essay.eid;

    // 4. Capture current HTML from editor
    const editor = document.getElementById("editor");
    if (!editor) {
      throw new Error("Editor element not found");
    }
    const content = editor.innerHTML;

    // 5. Persist content to backend database
    const response = await fetch(`/save_hw_content/${eid}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    // 6. Handle response
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Save failed");
    }

    // 7. Update local storage
    essayData.essay.content = content;
    sessionStorage.setItem("essayData", JSON.stringify(essayData));

    // 8. Update localStorage
    localStorage.setItem(
      "writingContent",
      JSON.stringify({
        title: document.getElementById("articleTitle").textContent,
        content: content,
      })
    );

    // 9. Show success message
    Swal.fire({
      icon: "success",
      title: "Saved!",
      text: "Your content has been saved successfully.",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error) {
    // console.error("Save error:", error);
    Swal.fire({
      icon: "error",
      title: "Save Failed",
      text: error.message,
    });
  }
}

// Initialize Resource Panel
function initializeResources(images) {
  // Find new container position
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

// Create a DOM element for a context resource item
function createResourceElement(image, index) {
  const div = document.createElement("div");
  div.className = "resource-item";

  // Try different extensions
  const extensions = [".jpg", ".png", ".webp"];
  const imgElement = new Image();
  let loadedImage = false;

  // Test each possible extension
  const tryLoadImage = (extIndex = 0) => {
    if (extIndex >= extensions.length) {
      // console.error(`Failed to load image ${image.iid}`);
      return;
    }

    const imgPath = `/static/assets/img/${image.iid}${extensions[extIndex]}`;
    imgElement.src = imgPath;

    imgElement.onload = () => {
      loadedImage = true;
      div.querySelector(".resource-image").src = imgPath;
      // Store successfully loaded image path
      div.dataset.imagePath = imgPath;
    };

    imgElement.onerror = () => {
      if (!loadedImage) {
        tryLoadImage(extIndex + 1);
      }
    };
  };

  div.innerHTML = `
    <div class="resource-preview" style="cursor: pointer;">
      <img src="/static/assets/img/default.jpg" alt="Resource ${
        index + 1
      }" class="resource-image">
      <div class="resource-info">
        <div class="resource-keywords">
          ${(image.modify_keywords || [])
            .map((keyword) => `<span class="keyword-chip">${keyword}</span>`)
            .join("")}
        </div>
        <p class="resource-description">${image.modify_description || ""}</p>
      </div>
    </div>
  `;

  // Add click event handling
  div.querySelector(".resource-preview").addEventListener("click", () => {
    showResourceModal(
      div.dataset.imagePath,
      image.modify_keywords,
      image.modify_description
    );
  });

  // Start trying to load image
  tryLoadImage();

  return div;
}

// Add new function to handle popup window
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
    showConfirmButton: true, // Changed to true
    confirmButtonText: "Close", // Added close button text
    confirmButtonColor: "#6c757d", // Set button color
    customClass: {
      popup: "resource-modal-popup",
      confirmButton: "btn btn-secondary", // Added button style
    },
  });
}

// Setup the sidebar panel for AI predictions
function createPredictionPanel() {
  const predictionContainer = document.querySelector(".prediction-container");
  if (!predictionContainer) {
    // console.error("prediction-container not found");
    return;
  }

  // Add hidden marker elements
  const hiddenElements = document.createElement("div");
  hiddenElements.style.display = "none";
  hiddenElements.innerHTML = `
      <span id="prevSentence"></span>
      <span id="currentSentence"></span>
      <span id="nextSentence"></span>
      <span id="currentCase"></span>
      <span id="markedText"></span>
  `;
  predictionContainer.appendChild(hiddenElements);

  predictionContainer.innerHTML += `
      <div class="prediction-content">
            <div class="instruction-box">
                <div class="instruction-header">
                    <svg class="instruction-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>How prediction works</span>
                </div>
                <div class="instruction-content">
                    <p>The AI will help predict the next sentence when:</p>
                    <li>Your cursor is at the beginning of writing.</li>
                    <li>Your cursor is after . ! or ?</li>
                    <li>All sentences in your text are properly ended</li>
                    <br>
                    <p>If your cursor is in the correct position, the <b>"Predict Next Sentence"</b> function will be activated.</p>
                    <li>You can following the <b>State</b> message below the button to guide your cursor to the correct position.</li>
                    <li>Each prediction may spend <b>90s</b> to complete. Please do not close the window during the process.</li>                    
                </div>
            </div>
          <div class="prediction-controls">
              <div class="prediction-overlay"></div>
              <button id="predictionBtn" class="submit-button" disabled>
                  Predict Next Sentence
              </button>
              <span id="predictionStatus" class="prediction-status">
                  State: Waiting for input...
              </span>
          </div>
          <div class="prediction-history-title">Your Prediction History</div>
      </div>
  `;
  // Add expand/collapse functionality
  const instructionBox = predictionContainer.querySelector(".instruction-box");
  instructionBox.addEventListener("click", function () {
    this.classList.toggle("expanded");
  });

  // Initialize button and event listeners
  const predictionBtn = document.getElementById("predictionBtn");
  predictionBtn.disabled = true;
  predictionBtn.addEventListener("click", handlePrediction);

  // Initialize editor listener
  initializePredictionFunction();
}

function updatePredictionStatus(editor, isValidPosition, hasValidEnding) {
  const statusElement = document.getElementById("predictionStatus");
  const content = editor.textContent.trim();

  // Reset basic styling for status element
  statusElement.className = "prediction-status";

  if (!content) {
    statusElement.textContent = "State: Waiting for input...";
    return;
  }

  if (!hasValidEnding) {
    statusElement.textContent = "State: Complete all sentences with . ! or ?";
    return;
  }

  if (!isValidPosition) {
    statusElement.textContent = "State: Move cursor after . ! or ?";
    return;
  }

  // Ready to predict - use green color
  statusElement.textContent = "State: Ready to predict";
  statusElement.classList.add("success");
}

async function handlePrediction() {
  try {
    const editor = document.getElementById("editor");
    const predictionBtn = document.getElementById("predictionBtn");
    const markedText = document.getElementById("markedText");
    const overlay = document.querySelector(".prediction-overlay");

    if (!editor || !predictionBtn || !markedText) {
      throw new Error("Required element does not exist");
    }

    // Get cursor position info
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    // Check if cursor is inside the editor
    if (!editor.contains(range.commonAncestorContainer)) {
      throw new Error("Please place cursor in the editor area");
    }

    // Check if correct content area is selected
    const isTextNode = range.commonAncestorContainer.nodeType === 3; // Text node
    const isEditorContent =
      range.commonAncestorContainer.parentNode === editor ||
      range.commonAncestorContainer === editor;

    if (!isTextNode && !isEditorContent) {
      throw new Error("Please select text content area only");
    }

    // 1. Aggregate current text and metadata
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = editor.innerHTML;
    const currentEssayContent = tempDiv.innerText;
    const titleElement = document.getElementById("articleTitle");
    const title = titleElement ? titleElement.textContent : "";

    // 2. Retrieve student's writing history
    const sid = sessionStorage.getItem("sid");
    if (!sid) {
      throw new Error("User ID not found");
    }

    const historyResponse = await fetch(`/get_history_essays_content/${sid}`);
    if (!historyResponse.ok) {
      throw new Error(`HTTP error! status: ${historyResponse.status}`);
    }

    const historyResult = await historyResponse.json();
    if (!historyResult.success) {
      throw new Error(historyResult.error || "Failed to get history essays");
    }

    // 3. Gather image context for AI model
    const essayData = JSON.parse(sessionStorage.getItem("essayData"));
    const imagesInfo = essayData.images.map((img) => ({
      keywords: img.modify_keywords || img.keywords,
      description: img.modify_description || img.description,
    }));

    // 4. Place visual marker for pending prediction
    const predictMark = document.createElement("span");
    predictMark.className = "highlighted-text prediction-mark";
    predictMark.textContent = "[PREDICTED SENTENCE]";
    range.insertNode(predictMark);

    // 5. Prevent further edits during AI processing
    editor.contentEditable = "false";
    predictionBtn.disabled = true;
    if (overlay) overlay.classList.add("active");

    // 6. Display progress countdown modal
    let timerInterval;
    let remainingTime = 90;

    Swal.fire({
      title: "Predicting Next Sentence",
      html: `
        <div class="prediction-waiting">
            <div class="countdown">${remainingTime}</div>
            <p>Sentence prediction is in progress.</p>
            <p><b>Just a moment—this’ll take around 90 seconds. Don’t leave the page!</b></p>
        </div>
    `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        const content = Swal.getHtmlContainer();
        const countdown = content.querySelector(".countdown");

        timerInterval = setInterval(() => {
          remainingTime--;
          if (remainingTime >= 0) {
            countdown.textContent = remainingTime;
          } else {
            // After 90 seconds switch to busy screen
            clearInterval(timerInterval);
            Swal.update({
              html: `
                        <div class="prediction-busy">
                            <div class="busy-spinner">
                                <i class="fas fa-sync fa-spin"></i>
                            </div>
                            <p>System is busy...</p>
                            <p>Please wait a moment.</p>
                        </div>
                    `,
            });
          }
        }, 1000);
      },
      willClose: () => {
        clearInterval(timerInterval);
      },
    });

    // 7. Request next sentence prediction from API
    const predictResponse = await fetch("/predict_sentence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_essay_content: currentEssayContent,
        history_essay_content: historyResult.content,
        images_info: imagesInfo,
        title: title,
      }),
    });

    if (!predictResponse.ok) {
      throw new Error(`HTTP error! status: ${predictResponse.status}`);
    }

    const predictResult = await predictResponse.json();
    if (!predictResult.success) {
      throw new Error(predictResult.error || "Prediction failed");
    }

    if (predictResult.predict_prompt) {
      sessionStorage.setItem(
        "last_predict_prompt",
        predictResult.predict_prompt
      );
      // console.log("Prediction prompt temporarily saved to sessionStorage");
    }

    // 8. Dismiss loading state UI
    await Swal.close();

    // 9. Render prediction result for user review
    const cardId = `prediction-${Date.now()}`;
    createPredictionResultCard(
      predictResult.predict_sentence,
      cardId,
      currentEssayContent
    );
  } catch (error) {
    // console.error("Prediction error:", error);

    // Restore editing state
    const editor = document.getElementById("editor");
    const predictionBtn = document.getElementById("predictionBtn");
    const overlay = document.querySelector(".prediction-overlay");

    if (editor) editor.contentEditable = "true";
    if (predictionBtn) predictionBtn.disabled = false;
    if (overlay) overlay.classList.remove("active");

    // Show error message
    await Swal.fire({
      icon: "error",
      title: "Prediction Failed",
      text: error.message,
    });
  }
}

// Initialize Sidebar functionality
function initializeSidebar() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  // Tab switching functionality
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove all active states
      tabBtns.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      // Set current active state
      btn.classList.add("active");
      const targetPanel = document.getElementById(`${btn.dataset.tab}Panel`);
      targetPanel.classList.add("active");
    });
  });

  // Add collapse button
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "sidebar-toggle";
  toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

  sidebar.appendChild(toggleBtn);

  // Add click event
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    // Toggle class on main content area
    document
      .querySelector(".main-content")
      .classList.toggle("sidebar-collapsed");
  });

  createPredictionPanel();
}

async function handleSubmit() {
  try {
    // 1. Get essayData from sessionStorage
    const essayDataStr = sessionStorage.getItem("essayData");
    if (!essayDataStr) {
      throw new Error("Essay data not found");
    }

    // 2. Parse essayData
    const essayData = JSON.parse(essayDataStr);
    if (!essayData?.essay?.eid) {
      throw new Error("Essay ID not found, please reload the page");
    }

    // 3. Get editor content
    const editor = document.getElementById("editor");
    if (!editor) {
      throw new Error("Editor element not found");
    }
    const content = editor.innerHTML;

    // 4. Show confirmation dialog
    const result = await Swal.fire({
      title: "Confirm Submission",
      text: "Do you want to submit your essay? You cannot edit after submission.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Submit",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      // 5. Send submit request
      const response = await fetch(`/submit_hw/${essayData.essay.eid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      // 6. Handle response
      const submitResult = await response.json();
      if (!submitResult.success) {
        throw new Error(submitResult.error || "Submit failed");
      }

      // 7. Clean up and show success message
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      localStorage.removeItem("writingContent");
      sessionStorage.removeItem("essayData");

      await Swal.fire({
        icon: "success",
        title: "Submitted Successfully!",
        text: "Your essay has been submitted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      // 8. Redirect to home page
      window.location.href = "/";
    }
  } catch (error) {
    // console.error("Submit error:", error);
    Swal.fire({
      icon: "error",
      title: "Submit Failed",
      text: error.message,
    });
  }
}

// Article marker functionality
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
  // Only normalization used for analysis, does not change the original format
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

  // Calculate cursor position
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editor);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  const cursorPosition = preCaretRange.toString().length;

  const originalText = editor.textContent;

  // Check if character before cursor is .!? or at the beginning
  const charBeforeCursor = originalText[cursorPosition - 1];
  const isAtStart = cursorPosition === 0;
  const isValidPosition = isAtStart || /[.!?]/.test(charBeforeCursor);

  // Check if all sentences have a correct ending
  const lastChar = originalText.trim().slice(-1);
  const hasValidEnding = /[.!?]/.test(lastChar);

  // Update button state
  predictionBtn.disabled = !(isValidPosition && hasValidEnding);

  // Update prediction status display
  updatePredictionStatus(editor, isValidPosition, hasValidEnding);

  // Get elements that need to be updated
  const markedText = document.getElementById("markedText");

  // Only show markers when in a valid position
  if (!isValidPosition) {
    markedText.textContent = originalText;
    return;
  }

  // Get text before and after the cursor, maintaining the original format
  const beforeText = originalText.slice(0, cursorPosition);
  const afterText = originalText.slice(cursorPosition);

  // Combine text and insert markers, maintaining the original format
  const markContent = beforeText + " [PREDICTED SENTENCE] " + afterText;
  markedText.textContent = markContent;
}

function initializePredictionFunction() {
  const editor = document.getElementById("editor");

  // Add editor event listeners
  editor.addEventListener("input", updatePrediction);
  editor.addEventListener("click", updatePrediction);
  editor.addEventListener("keyup", updatePrediction);
}

function getOrdinalSuffix(number) {
  const j = number % 10;
  const k = number % 100;
  if (j == 1 && k != 11) {
    return number + "st";
  }
  if (j == 2 && k != 12) {
    return number + "nd";
  }
  if (j == 3 && k != 13) {
    return number + "rd";
  }
  return number + "th";
}

function createPredictionResultCard(
  predictedText,
  cardId,
  currentEssayContent
) {
  const container = document.querySelector(".prediction-content");
  const existingCards = container.querySelectorAll(".prediction-result-card");
  const predictionNumber = existingCards.length + 1;
  const predictionName = `${getOrdinalSuffix(predictionNumber)} Prediction`;

  const card = document.createElement("div");
  card.className = "prediction-result-card";
  card.id = cardId;

  // Save HTML with [PREDICTED SENTENCE] marker when creating card
  const editor = document.getElementById("editor");
  card.dataset.originalHtml = editor.innerHTML;

  // Save original marked text
  card.dataset.originalHtml = document.getElementById("editor").innerHTML;
  card.dataset.currentEssayContent = currentEssayContent;

  card.innerHTML = `
      <div class="card-header">
          <span class="card-id">${predictionName}</span>
          <svg class="info-icon" viewBox="0 0 24 24" onclick="showPredictionInfo('${cardId}')" style="display: none;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
          </svg>
      </div>
      <div class="prediction-text">${predictedText}</div>
      <div class="prediction-actions">
          <button class="prediction-btn btn-correct" data-action="correct">Correct</button>
          <button class="prediction-btn btn-modify" data-action="modify">Modify</button>
          <button class="prediction-btn btn-incorrect" data-action="incorrect">Incorrect</button>
      </div>
      <div class="edit-container">
          <textarea class="edit-input" readonly>${predictedText}</textarea>
          <button class="prediction-btn btn-confirm" data-action="confirm">Confirm</button>
      </div>
  `;

  // Add button event listeners
  const buttons = card.querySelectorAll(".prediction-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      switch (action) {
        case "correct":
          handleCorrect(cardId);
          break;
        case "modify":
          handleModify(cardId);
          break;
        case "incorrect":
          handleIncorrect(cardId);
          break;
        case "confirm":
          handleEditConfirm(cardId);
          break;
      }
    });
  });

  // Insert new card at the beginning
  if (existingCards.length > 0) {
    container.insertBefore(card, existingCards[0]);
  } else {
    container.appendChild(card);
  }
}

// Specially handle pre-generated cards
async function showExistingPredictionInfo(pid) {
  const card = document.getElementById(pid);
  if (!card || !card.dataset.recordContent) {
    // console.error("Card or record content not found");
    return;
  }

  try {
    // First update view count
    // console.log("Update view count:", pid);
    await updatePredictionCount(pid);

    // Then display content
    Swal.fire({
      title: "Prediction Record",
      html: card.dataset.recordContent,
      width: "600px",
      customClass: {
        htmlContainer: "prediction-record-container",
        popup: "text-align-left-popup",
      },
    });
  } catch (error) {
    // console.error("Error occurred while showing prediction info:", error);
  }
}

async function showPredictionInfo(cardId) {
  const card = document.getElementById(cardId);
  const finalResult = card.dataset.finalResult;
  const originalHtml = card.dataset.originalHtml;

  try {
    // First update view count
    // console.log("Update view count:", cardId);
    await updatePredictionCount(cardId);

    // Create temporary container to preserve format
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = originalHtml;

    // Find prediction marker and replace it
    const predictMark = tempContainer.querySelector(".prediction-mark");
    if (predictMark) {
      const highlightedSpan = document.createElement("span");
      highlightedSpan.className = "highlighted-text";
      highlightedSpan.style.backgroundColor = "#fef08a";
      highlightedSpan.style.padding = "2px 4px";
      highlightedSpan.style.borderRadius = "2px";
      highlightedSpan.textContent =
        finalResult === "[Incorrect]" ? "[Incorrect]" : finalResult;
      predictMark.parentNode.replaceChild(highlightedSpan, predictMark);
    }

    tempContainer.style.textAlign = "left";

    // Show results with original format
    Swal.fire({
      title: "Prediction Record",
      html: tempContainer.innerHTML,
      width: "600px",
      customClass: {
        htmlContainer: "prediction-record-container",
        popup: "text-align-left-popup",
      },
    });
  } catch (error) {
    // console.error("Error occurred while showing prediction info:", error);
  }
}

function disableCardButtons(cardId, selectedButton) {
  const card = document.getElementById(cardId);
  const buttons = card.querySelectorAll(".prediction-btn");
  buttons.forEach((button) => {
    button.disabled = true;
    if (button === selectedButton) {
      button.style.opacity = "1";
    }
  });
}

// async function handleCorrect(cardId) {
//   // console.log("Processing Correct click, tempID:", cardId);

//   const card = findPredictionCard(cardId);
//   if (!card) return;

//   try {
//     const button = card.querySelector(".btn-correct");
//     const editor = document.getElementById("editor");
//     const predictedText = card.querySelector(".prediction-text").textContent;

//     // Clear other buttons selected state
//     card.querySelectorAll(".prediction-btn").forEach((btn) => {
//       btn.classList.remove("selected");
//       btn.disabled = true;
//       btn.style.opacity = "0.5";
//     });

//     // Mark selected button
//     button.classList.add("selected");
//     button.style.opacity = "1";
//     button.style.cursor = "not-allowed";

//     // Hide edit block
//     const editContainer = card.querySelector(".edit-container");
//     if (editContainer) {
//       editContainer.style.display = "none";
//     }

//     // Update editor content
//     const currentHtml = editor.innerHTML;
//     const updatedHtml = currentHtml.replace(
//       /<span class="highlighted-text prediction-mark">\[PREDICTED SENTENCE\]<\/span>/,
//       ` ${predictedText}`
//     );
//     editor.innerHTML = updatedHtml;

//     // Save result and get PID
//     const pid = await savePredictionResult(cardId, "Correct");
//     // console.log("Prediction result saved successfully, PID:", pid);

//     // Use returned PID to complete flow
//     finishPredictionFlow(pid || cardId, predictedText);
//   } catch (error) {
//     // console.error("Error occurred while handling Correct button:", error);
//   }
// }

async function handleCorrect(cardId) {
  try {
    const card = findPredictionCard(cardId);
    if (!card) return;

    const button = card.querySelector(".btn-correct");
    const editor = document.getElementById("editor");
    const predictedText = card.querySelector(".prediction-text").textContent;

    // 1. Update UI state to reflect selection
    card.querySelectorAll(".prediction-btn").forEach((btn) => {
      btn.classList.remove("selected");
      btn.disabled = true;
      btn.style.opacity = "0.5";
    });

    // 2. Visually confirm choice
    button.classList.add("selected");
    button.style.opacity = "1";
    button.style.cursor = "not-allowed";

    // 3. Dismiss modification options
    const editContainer = card.querySelector(".edit-container");
    if (editContainer) {
      editContainer.style.display = "none";
    }

    // 4. Replace marker with actual predicted text
    const predictMark = editor.querySelector(".prediction-mark");
    if (predictMark) {
      const textNode = document.createTextNode(` ${predictedText}`);
      predictMark.parentNode.replaceChild(textNode, predictMark);
    }

    // 5. Persist selection to backend
    const pid = await savePredictionResult(cardId, "Correct");

    // 6. Clean up prediction state
    finishPredictionFlow(pid || cardId, predictedText);
  } catch (error) {
    console.error("Error occurred while handling Correct button:", error);
  }
}

function handleModify(cardId) {
  // console.log("Processing Modify click, tempID:", cardId);

  const card = findPredictionCard(cardId);
  if (!card) return;

  const button = card.querySelector(".btn-modify");
  const editContainer = card.querySelector(".edit-container");
  const editInput = card.querySelector(".edit-input");

  // Remove selected state from other buttons
  card.querySelectorAll(".prediction-btn").forEach((btn) => {
    btn.classList.remove("selected");
  });

  // Mark selected button
  button.classList.add("selected");

  // Enable edit box
  editInput.readOnly = false;
  editContainer.style.display = "block";

  // Focus on edit box
  editInput.focus();
}

// async function handleEditConfirm(cardId) {
//   // console.log("Processing Edit Confirm click, tempID:", cardId);

//   const card = findPredictionCard(cardId);
//   if (!card) return;

//   try {
//     const editInput = card.querySelector(".edit-input");
//     const modifiedText = editInput.value;
//     const editor = document.getElementById("editor");

//     // Update editor content
//     const currentHtml = editor.innerHTML;
//     const updatedHtml = currentHtml.replace(
//       /<span class="highlighted-text prediction-mark">\[PREDICTED SENTENCE\]<\/span>/,
//       ` ${modifiedText}`
//     );
//     editor.innerHTML = updatedHtml;

//     // Save result and get PID
//     const pid = await savePredictionResult(cardId, "Modify", modifiedText);
//     // console.log("Modified result saved successfully, PID:", pid);

//     // Use returned PID to complete flow
//     finishPredictionFlow(pid || cardId, modifiedText);
//   } catch (error) {
//     // console.error("Error occurred while handling edit confirm:", error);
//   }
// }

async function handleEditConfirm(cardId) {
  try {
    const card = findPredictionCard(cardId);
    if (!card) return;

    const editInput = card.querySelector(".edit-input");
    const modifiedText = editInput.value;
    const editor = document.getElementById("editor");

    // Update editor content using DOM manipulation
    const predictMark = editor.querySelector(".prediction-mark");
    if (predictMark) {
      const textNode = document.createTextNode(` ${modifiedText}`);
      predictMark.parentNode.replaceChild(textNode, predictMark);
    }

    // Save results
    const pid = await savePredictionResult(cardId, "Modify", modifiedText);

    // Finish prediction flow
    finishPredictionFlow(pid || cardId, modifiedText);
  } catch (error) {
    console.error("Error occurred while handling edit confirm:", error);
  }
}

// async function handleIncorrect(cardId) {
//   // console.log("Processing Incorrect click, tempID:", cardId);

//   const card = findPredictionCard(cardId);
//   if (!card) return;

//   try {
//     const button = card.querySelector(".btn-incorrect");
//     const editor = document.getElementById("editor");

//     // Clear other buttons selected state
//     card.querySelectorAll(".prediction-btn").forEach((btn) => {
//       btn.classList.remove("selected");
//       btn.disabled = true;
//       btn.style.opacity = "0.5";
//     });

//     // Mark selected button
//     button.classList.add("selected");
//     button.style.opacity = "1";
//     button.style.cursor = "not-allowed";

//     // Hide edit block
//     const editContainer = card.querySelector(".edit-container");
//     if (editContainer) {
//       editContainer.style.display = "none";
//     }

//     // Update editor content
//     const currentHtml = editor.innerHTML;
//     const updatedHtml = currentHtml.replace(
//       /<span class="highlighted-text prediction-mark">\[PREDICTED SENTENCE\]<\/span>/,
//       ""
//     );
//     editor.innerHTML = updatedHtml;

//     // Save result and get PID
//     const pid = await savePredictionResult(cardId, "Incorrect");
//     // console.log("Prediction result saved successfully, PID:", pid);

//     // Use returned PID to complete flow
//     finishPredictionFlow(pid || cardId, "[Incorrect]");
//   } catch (error) {
//     // console.error("Error occurred while handling Incorrect button:", error);
//   }
// }

async function handleIncorrect(cardId) {
  try {
    const card = findPredictionCard(cardId);
    if (!card) return;

    const button = card.querySelector(".btn-incorrect");
    const editor = document.getElementById("editor");

    // 1. Remove selected state from other buttons
    card.querySelectorAll(".prediction-btn").forEach((btn) => {
      btn.classList.remove("selected");
      btn.disabled = true;
      btn.style.opacity = "0.5";
    });

    // 2. Mark selected button
    button.classList.add("selected");
    button.style.opacity = "1";
    button.style.cursor = "not-allowed";

    // 3. Hide edit block
    const editContainer = card.querySelector(".edit-container");
    if (editContainer) {
      editContainer.style.display = "none";
    }

    // 4. Update editor content - use DOM manipulation
    const predictMark = editor.querySelector(".prediction-mark");
    if (predictMark) {
      predictMark.remove();
    }

    // 5. Save results
    const pid = await savePredictionResult(cardId, "Incorrect");

    // 6. Finish prediction flow
    finishPredictionFlow(pid || cardId, "[Incorrect]");
  } catch (error) {
    console.error("Error occurred while handling Incorrect button:", error);
  }
}

function findPredictionCard(id) {
  // Try different ways to find the card
  let card = document.getElementById(id);
  if (!card) {
    card = document.querySelector(
      `.prediction-result-card[data-temp-id="${id}"]`
    );
  }
  if (!card) {
    // console.error("Prediction card not found:", id);
    return null;
  }
  return card;
}

async function savePredictionResult(cardId, option, modifiedContent = null) {
  try {
    const card = document.getElementById(cardId);
    const cardIdText = card.querySelector(".card-id").textContent;
    const essayData = JSON.parse(sessionStorage.getItem("essayData"));
    const editor = document.getElementById("editor");
    const originalHtml = card.dataset.originalHtml;

    if (!essayData?.essay?.eid) {
      throw new Error("Essay ID not found");
    }

    // Process HTML using the same logic as showPredictionInfo
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = originalHtml;

    // Find prediction marker and replace it
    const predictMark = tempContainer.querySelector(".prediction-mark");
    if (predictMark) {
      // Create new marker element
      const highlightedSpan = document.createElement("span");
      highlightedSpan.className = "highlighted-text";
      highlightedSpan.style.backgroundColor = "#fef08a";
      highlightedSpan.style.padding = "2px 4px";
      highlightedSpan.style.borderRadius = "2px";

      // Determine text to show based on option
      const finalText =
        option === "Incorrect"
          ? "[Incorrect]"
          : option === "Modify"
          ? modifiedContent
          : card.querySelector(".prediction-text").textContent;

      highlightedSpan.textContent = finalText;
      predictMark.parentNode.replaceChild(highlightedSpan, predictMark);
    }

    // Add left-aligned style in container
    tempContainer.style.textAlign = "left";

    // Get latest prompt from sessionStorage
    const prompt = sessionStorage.getItem("last_predict_prompt") || "";

    // Prepare prediction data, including prompt
    const predictionData = {
      pname: cardIdText.replace("ID: ", ""),
      pcontent: card.querySelector(".prediction-text").textContent,
      option: option,
      modify_pcontent: modifiedContent,
      record_content: tempContainer.innerHTML,
      prompt: prompt, // Add prompt
    };

    // Clear cached prompt after saving
    sessionStorage.removeItem("last_predict_prompt");

    // Update card dataset
    card.dataset.finalResult =
      option === "Incorrect"
        ? "[Incorrect]"
        : modifiedContent || predictionData.pcontent;
    card.dataset.recordContent = tempContainer.innerHTML;

    // Send request
    const response = await fetch(`/save_prediction/${essayData.essay.eid}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(predictionData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // If prediction result saved successfully, also save article content
    if (result.success) {
      try {
        // Save article content
        const saveContentResponse = await fetch(
          `/save_hw_content/${essayData.essay.eid}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: editor.innerHTML,
            }),
          }
        );

        const saveContentResult = await saveContentResponse.json();
        if (!saveContentResult.success) {
          // console.error("Failed to save article content:", saveContentResult.error);
        }

        // Update article content in sessionStorage
        essayData.essay.content = editor.innerHTML;
        sessionStorage.setItem("essayData", JSON.stringify(essayData));

        // Update localStorage
        localStorage.setItem(
          "writingContent",
          JSON.stringify({
            title: document.getElementById("articleTitle").textContent,
            content: editor.innerHTML,
          })
        );

        // console.log("Article content synced and saved");
      } catch (error) {
        // console.error("Error occurred while saving article content:", error);
      }

      // Update card info
      if (result.pid) {
        // Save old ID for debugging
        const oldId = card.id;

        // Update actual ID of the card
        card.id = result.pid;
        card.dataset.pid = result.pid;

        // console.log(`Card ID updated: ${oldId} -> ${result.pid}`);

        const infoIcon = card.querySelector(".info-icon");
        if (infoIcon) {
          infoIcon.setAttribute(
            "onclick",
            `showPredictionInfo('${result.pid}')`
          );
          infoIcon.style.display = "block";
          // console.log("info icon updated and shown");
        }
      }

      return result.pid;
    } else {
      throw new Error(result.message || "Failed to save prediction result");
    }
  } catch (error) {
    // console.error("Error saving prediction result:", error);
    throw error;
  }
}

function finishPredictionFlow(cardId, result) {
  const card = document.getElementById(cardId);
  const overlay = document.querySelector(".prediction-overlay");

  // Mark selected button and disable all buttons
  const buttons = card.querySelectorAll(".prediction-btn");
  buttons.forEach((button) => {
    if (button.classList.contains("selected")) {
      button.style.cursor = "not-allowed";
    } else {
      button.disabled = true;
      button.style.opacity = "0.5";
    }
  });

  // Disable edit box
  const editContainer = card.querySelector(".edit-container");
  if (editContainer) {
    const editInput = editContainer.querySelector(".edit-input");
    if (editInput) {
      editInput.readOnly = true;
      editInput.classList.add("disabled");
    }
  }

  // Show info icon
  const infoIcon = card.querySelector(".info-icon");
  if (infoIcon) {
    infoIcon.style.display = "block";
  }

  // Save final result
  card.dataset.finalResult = result;

  // Remove overlay
  if (overlay) overlay.classList.remove("active");

  // Enable editor
  const editor = document.getElementById("editor");
  if (editor) editor.contentEditable = "true";
}

function endPredictionFlow() {
  // Remove prediction result card
  const card = document.querySelector(".prediction-result-card");
  if (card) card.remove();

  // Re-enable editing
  const editor = document.getElementById("editor");
  editor.contentEditable = "true";

  // Update prediction status
  updatePrediction();
}

async function updatePredictionCount(pid) {
  try {
    // console.log("Update prediction view count:", pid);
    const response = await fetch(`/update_prediction_count/${pid}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    if (result.success) {
      // console.log("Update view count successfully");
    } else {
      // console.error("Update view count failed:", result.error);
    }
  } catch (error) {
    // console.error("Error occurred while updating view count:", error);
  }
}
