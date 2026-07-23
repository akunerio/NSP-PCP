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
    text: "Please enter an essay title",
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
document.addEventListener("DOMContentLoaded", async function () {
  function waitForElement(selector) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  const waitForScripts = () => {
    return new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        window.addEventListener("load", resolve);
      }
    });
  };

  const generateSetupPage = async () => {
    const mainElement = await waitForElement("main");
    mainElement.innerHTML = `
        <div class="setup-container">
          <div class="setup-content">
            <div class="page-header">
              <h1 id="title-step" class="google-style-heading">Homework Demo: My favorite food</h1>
              <h2 class="google-style-subheading">Writing Preparation</h2>
            </div>

            <div id="instruction-step" class="setup-instructions">
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
              <input type="text" id="essay-title-step" class="google-input" 
                     placeholder="Enter Essay title" required>
            </div>
      
            <div id="upload-step" class="setup-section">
              <label class="google-label">Image Upload (Max ${CONFIG.MAX_IMAGES})</label>
              <div id="imageUploadContainer"></div>
              <button class="google-button secondary" id="addImageBtn" 
                      onclick="addImageUploadBlock()">
                <i class="fas fa-plus"></i> Add Image
              </button>
            </div>
      
            <div id="action-step" class="setup-actions">
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

    await initializeSetupPage();
  };

  const initializeSetupPage = async () => {
    addImageUploadBlock();
    await Promise.all([
      waitForElement("#title-step"),
      waitForElement("#instruction-step"),
      waitForElement("#essay-title-step"),
      waitForElement("#upload-step"),
      waitForElement(".upload-area"),
      waitForElement("#action-step"),
    ]);
  };

  const initializeDriver = async () => {
    try {
      if (!window.driver) {
        console.error("Driver.js not loaded");
        return;
      }

      const driverObj = window.driver.js.driver({
        animate: true,
        opacity: 0.75,
        // showProgress: true,
        allowClose: false,
        overlayClickNext: true,
        showButtons: ["next", "previous"],
        className: "driverjs-theme",
        popoverClass: "driver-popover",
        stageBackground: "#ffffff",
        allowKeyboardControl: true,
        disableActiveInteraction: false,
        onPopoverRender: (popover, { config, state }) => {
          const firstButton = document.createElement("button");
          firstButton.innerText = "Skip";
          popover.footerButtons.appendChild(firstButton);

          firstButton.addEventListener("click", () => {
            driverObj.drive(8);
          });
        },
        steps: [
          {
            element: "#title-step",
            popover: {
              title: "Homework Topic",
              description:
                "Here, your homework topic will be set, and you need to come up with your essay title and a contextual image based on this topic.",
              position: "bottom",
              side: "left",
              align: "start",
            },
          },
          {
            element: "#instruction-step",
            popover: {
              title: "Writing Instructions",
              description:
                "Here you will find detailed instructions. Please read them carefully!",
              position: "right",
              side: "left",
              align: "start",
            },
          },
          {
            element: "#essay-title-step",
            popover: {
              title: "Enter Your Title",
              description:
                "Type in your essay title here. Make sure it matches the topic!",
              position: "bottom",
              side: "left",
              align: "start",
            },
          },
          {
            element: "#upload-step",
            popover: {
              title: "Image Upload Section",
              description: "You can upload images related to the topic here.",
              position: "left",
              side: "left",
              align: "start",
            },
          },
          {
            element: ".upload-area",
            popover: {
              title: "Upload Area",
              description:
                "You can click or drag and drop images into this area to upload them.<br><br><b>(Only images in jpg, png, or webp format are allowed!)</b>",
              position: "top",
              side: "left",
              align: "start",
            },
          },
          {
            popover: {
              title: "Image Analysis",
              description: `
  <div style="text-align: left; padding: 10px;">
      <p>After uploading the image, an <b>"Analyze Image"</b> button will appear.<br>Click it to start the analysis. Once the analysis results are available, you can proceed with the following actions:</p>
    <div style="margin-bottom: 20px;">
      <div style="margin-bottom: 15px;">
        <strong style="color: #1a73e8;">1. Generate Keywords</strong>
        <ul style="margin: 8px 0 0 20px; padding: 0;">
          <li style="margin: 5px 0;">AI will automatically generate keywords to describe your image</li>
          <li style="margin: 5px 0;">You can add or remove keywords as needed</li>
        </ul>
      </div>
  
      <div style="margin-bottom: 15px;">
        <strong style="color: #1a73e8;">2. Generate Description</strong>
        <ul style="margin: 8px 0 0 20px; padding: 0;">
          <li style="margin: 5px 0;">AI will create a detailed description of your image</li>
          <li style="margin: 5px 0;">You can modify the description to better match your memory</li>
        </ul>
      </div>
    </div>
    </div>`,
              position: "mid-center",
            },
          },
          {
            element: "#addImageBtn",
            popover: {
              title: "Add More Images",
              description:
                "Click this button to add more images (maximum 3 images allowed).",
              position: "right",
              side: "top",
              align: "center",
            },
          },
          {
            element: "#action-step",
            popover: {
              title: "Ready to Write",
              description:
                'After completing all steps, click <b>"Start"</b> to begin writing your essay.',
              position: "top",
              side: "top",
              align: "end",
            },
          },
          {
            popover: {
              title: "After finishing the guidance...",
              description: `
  <div style="text-align: left; padding: 10px;">    
    <div style="margin-bottom: 20px;">
      <div style="margin-bottom: 15px;">
        <strong style="color: #1a73e8;">1. Try adding a title.</strong>
        <ul style="margin: 8px 0 0 20px; padding: 0;">
          <li style="margin: 5px 0;">Set your essay title based on the homework topic.</li>
        </ul>
      </div>
  
      <div style="margin-bottom: 15px;">
        <strong style="color: #1a73e8;">2. Try analyzing an image.</strong>
        <ul style="margin: 8px 0 0 20px; padding: 0;">
          <li style="margin: 5px 0;">Click the upload area to load a default image.</li>
          <li style="margin: 5px 0;">Click "Analyze Image" to generate default keywords and descriptions.</li>
          <li style="margin: 5px 0;">Try adding or deleting image keywords.</li>
          <li style="margin: 5px 0;">Try modifying the image description.</li>
        </ul>
      </div>

       <div style="margin-bottom: 15px;">
        <strong style="color: #1a73e8;">3. Try click "Start" go to writing guidance.</strong>
      </div>
    </div>
    </div>`,
              position: "mid-center",
            },
          },
        ],
      });

      await driverObj.drive();
    } catch (error) {
      console.error("Failed to initialize driver:", error);
    }
  };

  try {
    await waitForScripts();

    await generateSetupPage();

    await new Promise((resolve) => {
      const checkDriver = () => {
        if (window.driver) {
          resolve();
        } else {
          setTimeout(checkDriver, 100);
        }
      };
      checkDriver();
    });

    await initializeDriver();
  } catch (error) {
    console.error("Failed to initialize page:", error);
  }
});

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

function initializeImageBlock(index) {
  const uploadArea = document.getElementById(`uploadArea_${index}`);
  const keywordInput = document.getElementById(`keywordInput_${index}`);

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
    handleImageUpload(null, index);
  });

  uploadArea.addEventListener("click", () => {
    handleImageUpload(null, index);
  });

  if (keywordInput) {
    keywordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addKeywordFromInput(index);
      }
    });

    const addKeywordBtn = keywordInput.nextElementSibling;
    if (addKeywordBtn) {
      addKeywordBtn.addEventListener("click", (e) => {
        e.preventDefault();
        addKeywordFromInput(index);
      });
    }
  }
}

function addKeywordFromInput(index) {
  const input = document.getElementById(`keywordInput_${index}`);
  const keyword = input.value.trim();

  if (keyword) {
    const existingKeywords = Array.from(
      document
        .getElementById(`keywordsChips_${index}`)
        .getElementsByClassName("keyword-chip")
    ).map((chip) => chip.textContent.replace("×", "").trim());

    if (!existingKeywords.includes(keyword)) {
      addKeywordChip(keyword, index);
      input.value = ""; 
    } else {
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

function handleImageUpload(file, index) {
  const defaultImageUrl = "/static/assets/img/demo.jpg";

  const previewImg = document.getElementById(`imagePreview_${index}`);

  previewImg.onload = function () {
    const containerWidth = CONFIG.IMAGE_CONTAINER_SIZE;
    const containerHeight = CONFIG.IMAGE_CONTAINER_SIZE;
    let width = this.naturalWidth;
    let height = this.naturalHeight;

    const ratio = Math.min(containerWidth / width, containerHeight / height);
    width *= ratio;
    height *= ratio;

    this.style.width = `${width}px`;
    this.style.height = `${height}px`;

    document.getElementById(`uploadArea_${index}`).style.display = "none";
    document.getElementById(`cancelUpload_${index}`).style.display = "none";
    document.getElementById(`previewSection_${index}`).style.display = "block";
  };

  previewImg.onerror = function () {
    Swal.fire({
      icon: "error",
      title: "Image Load Error",
      text: "Failed to load the image. Please try again.",
    });
  };

  previewImg.src = defaultImageUrl;
}

async function analyzeImage(index) {
  try {
    Swal.fire({
      title: "Analyzing Image",
      text: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockResult = {
      success: true,
      data: {
        keywords: [
          "beef noodles",
          "rich broth",
          "tender meat",
          "springy noodles",
          "aromatic",
          "traditional cuisine",
        ],
        description:
          "This is a mouthwatering bowl of traditional beef noodle soup. The deep brown broth with glistening oil droplets on its surface showcases its rich layered flavors. Large chunks of beef appear tender and juicy, perfectly paired with straight, chewy handmade noodles. The dish is garnished with fresh green vegetables and scallions, which not only enhance its visual appeal but also add nutritional value. This dish perfectly exemplifies the essence of traditional comfort food.",
      },
    };

    const keywordsContainer = document.getElementById(`keywordsChips_${index}`);
    const descriptionInput = document.getElementById(
      `imageDescription_${index}`
    );
    const analyzeBtn = document.getElementById(`analyzeBtn_${index}`);
    const analysisResults = document.getElementById(`analysisResults_${index}`);

    keywordsContainer.dataset.originalKeywords = JSON.stringify(
      mockResult.data.keywords
    );
    descriptionInput.dataset.originalDescription = mockResult.data.description;

    analyzeBtn.style.display = "none";
    analysisResults.style.display = "block";

    setTimeout(() => {
      analysisResults.classList.add("show");
    }, 100);

    mockResult.data.keywords.forEach((keyword) =>
      addKeywordChip(keyword, index)
    );
    descriptionInput.value = mockResult.data.description;

    Swal.close();
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: "Failed to analyze image",
      icon: "error",
    });
  }
}

function updateImageAnalysis(index, data) {
  const keywordsContainer = document.getElementById(`keywordsChips_${index}`);
  const descriptionInput = document.getElementById(`imageDescription_${index}`);
  const analysisResults = document.getElementById(`analysisResults_${index}`);

  // Store original analysis results in dataset for reference
  keywordsContainer.dataset.originalKeywords = JSON.stringify(data.keywords);
  descriptionInput.dataset.originalDescription = data.description;

  // Clear existing keywords before adding new ones
  keywordsContainer.innerHTML = "";

  // Render keywords as chips
  data.keywords.forEach((keyword) => {
    if (keyword && typeof keyword === "string") {
      addKeywordChip(keyword.trim(), index);
    }
  });

  // Render description text
  if (data.description && typeof data.description === "string") {
    descriptionInput.value = data.description.trim();
  }

  // Show analysis result section
  analysisResults.style.display = "block";

  // Hide the initial analyze button
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
  // Basic form validation (title)
  const title = document.getElementById("essay-title-step").value.trim();
  if (!title) {
    await Swal.fire({
      icon: "error",
      ...ERROR_MESSAGES.emptyTitle,
    });
    return;
  }

  // Image validation (at least one image)
  const imageBlocks = document.querySelectorAll(".image-block");
  if (imageBlocks.length === 0) {
    await Swal.fire({
      icon: "error",
      ...ERROR_MESSAGES.noImage,
    });
    return;
  }

  // Check if all images have been analyzed
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

  // Collect and format setup data
  const setupData = {
    title: title,
    images: [...imageBlocks].map((block, index) => ({
      description:
        document.getElementById(`imageDescription_${index}`)?.value || "",
      keywords: Array.from(
        document
          .getElementById(`keywordsChips_${index}`)
          ?.getElementsByClassName("keyword-chip") || []
      ).map((el) => el.textContent.trim().replace("×", "")),
    })),
    eid: "default_essay_id", // Use default essay ID
  };

  // Show final confirmation dialog before starting
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
      // Save setup configuration to session storage
      sessionStorage.setItem("hwDemoWritingSetup", JSON.stringify(setupData));

      // Navigate to writing instruction page
      window.location.href = "/hw_writing_instruct";
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to proceed to writing page",
        confirmButtonColor: "#dc3545",
      });
    }
  }
}
