// Global variables
let imageCount = 0;

// Configuration
const CONFIG = {
  MAX_IMAGES: 3,
  IMAGE_CONTAINER_SIZE: 200,
  ANALYSIS_TIMER: 1000,
};

// Error messages
const ERROR_MESSAGES = {
  fileType: {
    title: "Invalid File Type",
    text: "Please upload JPG, PNG or WEBP files only",
  },
  maxImages: {
    title: "Maximum Limit Reached",
    text: "You can upload up to 3 images only",
  },
  emptyTitle: {
    title: "Title Required",
    text: "Please enter an Essay topic",
  },
  noImage: {
    title: "No Image",
    text: "Please upload at least one image",
  },
  unanalyzedImage: {
    title: "Incomplete Analysis",
    text: "Please ensure all uploaded images are analyzed",
  },
};

// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Validate entry source page
  const referrer = document.referrer;
  const expectedPath = "/hw1_writing";

  if (!referrer.endsWith(expectedPath)) {
    // Redirect to main writing page if invalid access
    window.location.href = "/hw1_writing";
    return;
  }

  function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
      callback(element);
    } else {
      setTimeout(() => waitForElement(selector, callback), 100);
    }
  }

  const generateSetupPage = () => {
    waitForElement("main", (mainElement) => {
      const setupContent = `
        <div class="setup-container">
          <div class="setup-content">
            <div class="page-header">
              <h1 class="google-style-heading">Homework 1: A memorable food that impressed you.</h1>
              <h2 class="google-style-subheading">Writing Preparation</h2>
            </div>

            <!-- Homework guidelines -->
            <div class="setup-instructions">
              <div class="instruction-content">
                <p class="instruction-intro"><b>Please share a food that left a deep impression on you. You can describe its taste, appearance, and smell, as well as where and with whom you ate it. You can also explain why this dish was special and memorable to you.</b></p>
                <p class="instruction-intro">Follow these steps to prepare your essay:</p>
                <ol class="instruction-list">
                  <li>
                    <span class="step-number">1</span>
                    <span class="step-text">Enter an essay title that according to the homework topic.</span>
                  </li>
                  <li>
                    <span class="step-number">2</span>
                    <span class="step-text">Upload up to 3 images that will be used as references
                      <ul>
                        <li>The allowed image formats for upload are ".jpg", ".png", and ".webp".</li>
                      </ul>
                    </span>                      
                  </li>
                  <li>
                    <span class="step-number">3</span>
                    <span class="step-text">For each image:
                      <ul>
                        <li>Click "Analyze Image" to generate AI-powered keywords and descriptions</li>
                        <li>Review and modify the generated keywords and descriptions if needed</li>
                      </ul>
                    </span>
                  </li>
                  <li>
                    <span class="step-number">4</span>
                    <span class="step-text">Click "Start" when you're ready to begin writing your essay</span>
                  </li>
                </ol>
              </div>
            </div>
            
            <div class="setup-section">
              <label class="google-label">Essay Title</label>
              <input type="text" class="google-input" id="EssayTitle" 
                     placeholder="Enter Essay title" required>
            </div>
      
            <div class="setup-section">
              <label class="google-label">Image Upload (Max ${CONFIG.MAX_IMAGES})</label>
              <div id="imageUploadContainer"></div>
              <button class="google-button secondary" id="addImageBtn" 
                      onclick="addImageUploadBlock()">
                <i class="fas fa-plus"></i> Add Image
              </button>
            </div>
      
            <div class="setup-actions">
              <button class="google-button secondary" onclick="window.history.back()">
                Back
              </button>
              <button class="google-button primary" id="nextButton" 
                      onclick="validateAndProceed()">
                Start
              </button>
            </div>
          </div>
        </div>
      `;

      mainElement.innerHTML = setupContent;
      initializeSetupPage();
    });
  };

  const initializeSetupPage = () => {
    addImageUploadBlock();
  };

  generateSetupPage();
});

// File validation
function isValidImageFile(file) {
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    Swal.fire({
      icon: "error",
      ...ERROR_MESSAGES.fileType,
    });
    return false;
  }
  return true;
}

// Add image upload block
function addImageUploadBlock() {
  if (imageCount >= CONFIG.MAX_IMAGES) {
    Swal.fire({
      icon: "warning",
      ...ERROR_MESSAGES.maxImages,
    });
    return;
  }

  const container = document.getElementById("imageUploadContainer");
  const blockId = `imageBlock_${imageCount}`;

  const uploadBlock = document.createElement("div");
  uploadBlock.className = "image-block";
  uploadBlock.id = blockId;
  uploadBlock.innerHTML = `
    <div class="upload-area-wrapper">
      <div class="upload-area" id="uploadArea_${imageCount}">
        <div class="upload-placeholder">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Drag and drop image here or click to upload</p>
        </div>
        <input type="file" id="imageUpload_${imageCount}" accept="image/*" hidden>
      </div>
      <button class="delete-upload-area" 
              id="cancelUpload_${imageCount}"
              onclick="removeUploadArea('${blockId}')">
        <i class="fas fa-times"></i> Cancel Upload
      </button>
    </div>

    <div class="preview-section" id="previewSection_${imageCount}" style="display: none;">
      <div class="preview-container">
        <div class="image-preview-wrapper">
          <img id="imagePreview_${imageCount}" src="" alt="Preview">
          <button class="google-button danger remove-image" 
                  onclick="removeImage('${blockId}')">
            <i class="fas fa-trash"></i> Delete Image
          </button>
        </div>
        
        <div class="image-analysis">
          <button class="google-button primary analyze-btn" 
                  id="analyzeBtn_${imageCount}" 
                  onclick="analyzeImage(${imageCount})">
            <i class="fas fa-magic"></i> Analyze Image
          </button>
          
          <div class="analysis-results" id="analysisResults_${imageCount}" 
               style="display: none;">
            <div class="keywords-section">
              <label class="google-label">Image Keywords</label>
              <div class="keywords-chips" id="keywordsChips_${imageCount}"></div>
              <div class="keyword-input-group">
                <input type="text" class="google-input" 
                       id="keywordInput_${imageCount}" 
                       placeholder="Enter keyword">
                <button class="google-button primary add-keyword-btn" 
                        onclick="addKeywordFromInput(${imageCount})">
                  <i class="fas fa-plus"></i> Add
                </button>
              </div>
            </div>
            
            <div class="description-section">
              <label class="google-label">Image Description</label>
              <textarea class="google-input description" 
                        id="imageDescription_${imageCount}"></textarea>
              <button class="google-button secondary regenerate-btn" 
                      onclick="regenerateAnalysis(${imageCount})">
                <i class="fas fa-sync-alt"></i> Regenerate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  container.appendChild(uploadBlock);
  initializeImageBlock(imageCount);
  imageCount++;

  if (imageCount >= CONFIG.MAX_IMAGES) {
    document.getElementById("addImageBtn").style.display = "none";
  }
}

// Initialize image block events
function initializeImageBlock(index) {
  const uploadArea = document.getElementById(`uploadArea_${index}`);
  const imageUpload = document.getElementById(`imageUpload_${index}`);
  const keywordInput = document.getElementById(`keywordInput_${index}`);

  // Drag and drop handlers
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file && isValidImageFile(file)) {
      handleImageUpload(file, index);
    }
  });

  // Click upload handlers
  uploadArea.addEventListener("click", () => {
    imageUpload.click();
  });

  imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && isValidImageFile(file)) {
      handleImageUpload(file, index);
    }
  });

  // Keyword input handler
  if (keywordInput) {
    // Enter key triggers keyword addition
    keywordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addKeywordFromInput(index);
      }
    });

    // Button click triggers keyword addition
    const addKeywordBtn = keywordInput.nextElementSibling;
    if (addKeywordBtn) {
      addKeywordBtn.addEventListener("click", (e) => {
        e.preventDefault();
        addKeywordFromInput(index);
      });
    }
  }
}

// Add keyword
function addKeywordFromInput(index) {
  const input = document.getElementById(`keywordInput_${index}`);
  const keyword = input.value.trim();

  if (keyword) {
    // Prevent duplicate entries
    const existingKeywords = Array.from(
      document
        .getElementById(`keywordsChips_${index}`)
        .getElementsByClassName("keyword-chip")
    ).map((chip) => chip.textContent.replace("×", "").trim());

    if (!existingKeywords.includes(keyword)) {
      addKeywordChip(keyword, index);
      input.value = ""; // Reset input field
    } else {
      // Alert user if keyword already exists
      Swal.fire({
        title: "Duplicate Keyword",
        text: "This keyword already exists",
        icon: "warning",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }
}

// Handle image upload and preview
function handleImageUpload(file, index) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const previewImg = document.getElementById(`imagePreview_${index}`);
      const imageInput = document.getElementById(`imageUpload_${index}`);

      // Bind file to input element
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      imageInput.files = dataTransfer.files;

      // Calculate proportional scale dimensions
      const containerWidth = CONFIG.IMAGE_CONTAINER_SIZE;
      const containerHeight = CONFIG.IMAGE_CONTAINER_SIZE;
      let width = img.width;
      let height = img.height;

      const ratio = Math.min(containerWidth / width, containerHeight / height);

      width *= ratio;
      height *= ratio;

      // Apply image dimensions      previewImg.style.width = `${width}px`;
      previewImg.style.height = `${height}px`;
      previewImg.src = e.target.result;

      // Display preview interface and hide upload controls      document.getElementById(`uploadArea_${index}`).style.display = "none";
      document.getElementById(`cancelUpload_${index}`).style.display = "none";
      document.getElementById(`previewSection_${index}`).style.display =
        "block";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Image analysis function
async function analyzeImage(index) {
  try {
    const imageInput = document.getElementById(`imageUpload_${index}`);
    const file = imageInput.files[0];
    if (!file) return;

    // Display analysis loading state
    Swal.fire({
      title: "Analyzing Image",
      text: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/analyze_image/", {
      method: "POST",
      body: formData,
    });

    // New: view raw response payload
    // console.log("API Raw Response:", await response.clone().text());

    const result = await response.json();

    // New: inspect parsed data content
    // console.log("API Parsed Result:", result);
    // console.log("Keywords:", result.data?.keywords);
    // console.log("Description:", result.data?.description);

    if (!result.success) {
      throw new Error(result.error || "Analysis failed");
    }

    // Validate returned data structure
    if (
      !result.data ||
      !Array.isArray(result.data.keywords) ||
      typeof result.data.description !== "string"
    ) {
      throw new Error("Invalid response format");
    }

    // Persist original analysis result data
    const keywordsContainer = document.getElementById(`keywordsChips_${index}`);
    const descriptionInput = document.getElementById(
      `imageDescription_${index}`
    );

    // Store raw data in dataset for reference
    keywordsContainer.dataset.originalKeywords = JSON.stringify(
      result.data.keywords
    );
    descriptionInput.dataset.originalDescription = result.data.description;

    // Update UI state transition    const analyzeBtn = document.getElementById(`analyzeBtn_${index}`);
    const analysisResults = document.getElementById(`analysisResults_${index}`);

    // Toggle visibility between button and results    analyzeBtn.style.display = "none";
    analysisResults.style.display = "block";

    setTimeout(() => {
      analysisResults.classList.add("show");
    }, 100);

    // Render chips and description text    result.data.keywords.forEach((keyword) => addKeywordChip(keyword, index));
    descriptionInput.value = result.data.description;

    Swal.close();
  } catch (error) {
    // console.error("Analysis error:", error);
    Swal.fire({
      title: "Error",
      text: error.message,
      icon: "error",
    });
  }
}

function updateImageAnalysis(index, data) {
  const keywordsContainer = document.getElementById(`keywordsChips_${index}`);
  const descriptionInput = document.getElementById(`imageDescription_${index}`);
  const analysisResults = document.getElementById(`analysisResults_${index}`);

  // Store original analysis results in dataset attributes
  keywordsContainer.dataset.originalKeywords = JSON.stringify(data.keywords);
  descriptionInput.dataset.originalDescription = data.description;

  // Reset existing keywords list
  keywordsContainer.innerHTML = "";

  // Display keywords as chips
  data.keywords.forEach((keyword) => {
    if (keyword && typeof keyword === "string") {
      addKeywordChip(keyword.trim(), index);
    }
  });

  // Render description text content
  if (data.description && typeof data.description === "string") {
    descriptionInput.value = data.description.trim();
  }

  // Toggle analysis result area visibility
  analysisResults.style.display = "block";

  // Deactivate the analysis button
  const analyzeBtn = document.getElementById(`analyzeBtn_${index}`);
  if (analyzeBtn) {
    analyzeBtn.style.display = "none";
  }
}

// Add keyword chip
function addKeywordChip(keyword, index) {
  const chip = document.createElement("div");
  chip.className = "keyword-chip";
  chip.innerHTML = `
    ${keyword}
    <span class="chip-delete" onclick="this.parentElement.remove()">×</span>
  `;
  document.getElementById(`keywordsChips_${index}`).appendChild(chip);
}

// Regenerate analysis
async function regenerateAnalysis(index) {
  const analysisResults = document.getElementById(`analysisResults_${index}`);
  document.getElementById(`keywordsChips_${index}`).innerHTML = "";
  document.getElementById(`imageDescription_${index}`).value = "";
  analysisResults.classList.remove("show");
  await analyzeImage(index);
}

// Remove upload area
function removeUploadArea(blockId) {
  document.getElementById(blockId).remove();
  imageCount--;
  document.getElementById("addImageBtn").style.display = "inline-block";
}

// Remove uploaded image
function removeImage(blockId) {
  document.getElementById(blockId).remove();
  imageCount--;
  document.getElementById("addImageBtn").style.display = "inline-block";
}

// Validate and proceed
async function validateAndProceed() {
  // Basic field validation  const title = document.getElementById("EssayTitle").value.trim();
  if (!title) {
    await Swal.fire({
      icon: "error",
      ...ERROR_MESSAGES.emptyTitle,
    });
    return;
  }

  // Image presence validation  const imageBlocks = document.querySelectorAll(".image-block");
  if (imageBlocks.length === 0) {
    await Swal.fire({
      icon: "error",
      ...ERROR_MESSAGES.noImage,
    });
    return;
  }

  // Ensure all images have been analyzed
  if (
    [...imageBlocks].some(
      (block) => block.querySelector(".analyze-btn")?.style.display !== "none"
    )
  ) {
    await Swal.fire({
      icon: "warning",
      ...ERROR_MESSAGES.unanalyzedImage,
    });
    return;
  }

  // Compile setup state data
  const setupData = {
    title,
    images: [...imageBlocks].map((block, index) => ({
      description:
        document.getElementById(`imageDescription_${index}`)?.value || "",
      keywords: Array.from(
        document
          .getElementById(`keywordsChips_${index}`)
          ?.getElementsByClassName("keyword-chip") || []
      ).map((el) => el.textContent.trim().replace("×", "")),
    })),
  };

  // Show final confirmation dialog with countdown
  const result = await Swal.fire({
    title: "Ready to Start Your Homework?",
    html: `
      <div class="confirmation-dialog">
        <p class="confirmation-message">
          Please confirm that your <b>Title, Uploaded Images, and Analyzed Context Information</b> are correct.
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
    showConfirmButton: true,
    confirmButtonDisabled: true,
    didOpen: () => {
      const confirmButton = Swal.getConfirmButton();
      confirmButton.disabled = true;
      setTimeout(() => {
        confirmButton.disabled = false;
      }, 5000);
    },
  });

  if (result.isConfirmed) {
    try {
      // Display loading state during transition
      Swal.fire({
        title: "Preparing Your Environment",
        text: "Please wait...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Construct final payload structure
      const setupInfo = {
        sid: sessionStorage.getItem("sid"),
        title: document.getElementById("EssayTitle").value.trim(),
        images: await Promise.all(
          [...imageBlocks].map(async (block, index) => {
            const imgElement = block.querySelector(`#imagePreview_${index}`);
            const keywordsContainer = document.getElementById(
              `keywordsChips_${index}`
            );
            const descriptionInput = document.getElementById(
              `imageDescription_${index}`
            );

            // Retrieve original AI analysis context
            const originalKeywords = JSON.parse(
              keywordsContainer.dataset.originalKeywords || "[]"
            );
            const originalDescription =
              descriptionInput.dataset.originalDescription || "";

            // Capture user modifications
            const currentKeywords = Array.from(
              keywordsContainer.getElementsByClassName("keyword-chip")
            ).map((el) => el.textContent.trim().replace("×", ""));
            const currentDescription = descriptionInput.value;

            return {
              file_data: imgElement.src, // Base64 image payload
              keywords: originalKeywords, // Original AI keywords
              description: originalDescription, // Original AI description
              modify_keywords: currentKeywords, // User-refined keywords
              modify_description: currentDescription, // User-refined description
            };
          })
        ),
      };

      // console.log("Sending data:", setupInfo); // Debug log
      // Call initialize homework API
      const response = await fetch("/initialize_homework1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(setupInfo),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to initialize homework");
      }

      // Save setup data with essay ID
      setupData.eid = data.eid;
      sessionStorage.setItem("hw1WritingSetup", JSON.stringify(setupData));

      // Close loading state and redirect
      Swal.close();
      window.location.href = "/hw1_writing";
    } catch (error) {
      // console.error("Initialization failed:", error);
      await Swal.fire({
        icon: "error",
        title: "Initialization Failed",
        text: error.message,
        confirmButtonColor: "#dc3545",
      });
    }
  }
}
