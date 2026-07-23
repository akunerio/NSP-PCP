// Demo data configuration
const DEMO_DATA = {
  essay: {
    eid: "demo_essay_id",
    topic: "My Favorite Food",
    content: "",
    state: "Editing",
  },
  images: [
    {
      iid: "demo",
      modify_keywords: [
        "beef noodles",
        "rich broth",
        "tender meat",
        "springy noodles",
        "aromatic",
        "traditional cuisine",
      ],
      modify_description:
        "This is a mouthwatering bowl of traditional beef noodle soup. The deep brown broth with glistening oil droplets on its surface showcases its rich layered flavors. Large chunks of beef appear tender and juicy, perfectly paired with straight, chewy handmade noodles. The dish is garnished with fresh green vegetables and scallions, which not only enhance its visual appeal but also add nutritional value. This dish perfectly exemplifies the essence of traditional comfort food.",
    },
  ],
  predictions: [],
};

document.addEventListener("DOMContentLoaded", async function () {
  const initializeDriver = async () => {
    try {
      if (!window.driver) {
        console.error("Driver.js not loaded");
        return;
      }

      const driverObj = window.driver.js.driver({
        animate: true,
        opacity: 0.75, 
        // Show progress indicator if needed
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
            driverObj.drive(11);
          });
        },
        onHighlightStarted: (element, step) => {
          const sidebar = document.querySelector(".sidebar");
          const mainContent = document.querySelector(".main-content");
          const stepIndex = step.index;

          if (stepIndex >= 4 && stepIndex <= 7) {
            sidebar.classList.remove("collapsed");
            mainContent.classList.remove("sidebar-collapsed");
          } else {
            sidebar.classList.add("collapsed");
            mainContent.classList.add("sidebar-collapsed");
          }
        },
        steps: [
          // 1. Writing Instruction
          {
            element: "#writing-instruction",
            popover: {
              title: "Writing Instructions",
              description:
                "Here you will find detailed instructions. Please read them carefully.",
              position: "bottom",
            },
          },
          // 2. Writing Area
          {
            element: ".editor-container",
            popover: {
              title: "Writing Area",
              description:
                "This is your main writing area. You can write and edit your essay here.",
              position: "left",
            },
          },
          // 3. Essay Title
          {
            element: ".topic-title",
            popover: {
              title: "Essay Title",
              description: "Your essay title is displayed here.",
              position: "bottom",
            },
          },
          // 4. Context Information
          {
            element: ".context-container",
            popover: {
              title: "Context Information",
              description:
                "Your uploaded images, keywords, and descriptions are displayed here for reference while writing.<br><br><b>(You can lick on the image to zoom up it.)</b>",
              position: "right",
            },
          },

          // 5. Prediction Guide
          {
            element: "#prediction-instruction",
            popover: {
              title: "Prediction Guide",
              description:
                "Generate personalized predictions based on your writing history to support your writing!<br><br>You can read the instructions to learn how to use the prediction feature.",
              position: "left",
            },
          },
          // 6. Prediction Button
          {
            element: "#predictionBtn",
            popover: {
              title: "Prediction Button",
              description:
                "Click this button when you want AI to predict the next sentence. The button will be activated when your cursor is in a valid position.",
              position: "left",
            },
          },

          {
            popover: {
              title: 'After clicking "Prediction Button"...',
              description: `
  <div style="text-align: left; padding: 10px;">    
    <div style="margin-bottom: 20px;">
      <div style="margin-bottom: 15px;">
        <strong style="color: #1a73e8;">You will need to wait for about 90 seconds!</strong>
        <ul style="margin: 8px 0 0 20px; padding: 0;">
          <li style="margin: 5px 0;">It takes some time, but please be patient and do not leave the page! Thank you!</li>
        </ul>
      </div>
      <div style="margin-bottom: 20px;">
      <div style="margin-bottom: 15px;">
        <strong style="color: #1a73e8;">About Prediction Result</strong>
        <p>You will receive a set of prediction results, and you can choose one of the following options:</p>
        <ul style="margin: 8px 0 0 20px; padding: 0;">
          <li style="margin: 5px 0;"><b>Correct:</b> If you feel the result is what you want, click "Correct," and the result will be inserted into your essay.</li>
          <li style="margin: 5px 0;"><b>Modify:</b> If you think the result is not entirely accurate, you can click "Modify" to modify the predicted sentence. The edited result will be inserted into your essay.</li>
          <li style="margin: 5px 0;"><b>Incorrec:</b> If you feel the result is completely wrong, click "Incorrect," and the result will not be inserted into your essay.</li>
        </ul>
      </div>
    </div>`,
              position: "mid-center",
            },
          },
          // 7. Prediction History
          {
            element: ".prediction-history-title",
            popover: {
              title: "Prediction History",
              description:
                "All your previous predictions will be displayed here. You can review and manage them at any time.",
              position: "left",
            },
          },
          // 8. Reset Button
          {
            element: ".header-left button",
            popover: {
              title: "Reset Essay",
              description:
                "Click here to reset your essay. This will clear all content and return to the setup page.",
              position: "bottom",
            },
          },
          // 9. Save Button
          {
            element: ".header-center button",
            popover: {
              title: "Save Essay",
              description:
                "Remember to save your progress regularly by clicking this button.",
              position: "bottom",
            },
          },
          // 10. Submit Button
          {
            element: ".header-right button",
            popover: {
              title: "Submit Essay",
              description:
                "Click here when you have completed your essay and want to submit it.",
              position: "bottom",
            },
          },
          {
            popover: {
              title: "After finishing the guidance...",
              description: `
  <div style="text-align: left; padding: 10px;">    
    <div style="margin-bottom: 20px;">
      <div style="margin-bottom: 15px;">
        <strong style="color: #1a73e8;">1. Try writing some content in the writing area.</strong>
      </div>
  
      <div style="margin-bottom: 15px;">
        <strong style="color: #1a73e8;">2. Try using the prediction feature according to the instructions.</strong>
        <ul style="margin: 8px 0 0 20px; padding: 0;">
          <li style="margin: 5px 0;">Generate several predictions and try clicking each option.</li>
        </ul>
      </div>

       <div style="margin-bottom: 15px;">
        <strong style="color: #1a73e8;">3. Try Click all the buttons to understand their functions.</strong>
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
    await waitForScriptsInit();

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
    await Swal.fire({
      title: "Error",
      text: "Failed to initialize the page. Please try again later.",
      icon: "error",
      confirmButtonText: "OK",
    });
    window.location.href = "/";
  }
});

// Wait for scripts to initialize before starting page logic
function waitForScriptsInit() {
  return new Promise((resolve) => {
    const checkScriptsInit = setInterval(() => {
      if (document.querySelector("#layoutSidenav_content")) {
        clearInterval(checkScriptsInit);
        initializePage();
        resolve();
      }
    }, 100);
  });
}

// Main page initialization logic
async function initializePage() {
  try {
    sessionStorage.setItem("essayData", JSON.stringify(DEMO_DATA));

    createInterface();

    document.querySelectorAll(".instruction-box").forEach((box) => {
      if (box.id === "writing-instruction") {
        box.classList.add("expanded");
        const content = box.querySelector(".instruction-content");
        if (content) content.style.display = "block";
        const icon = box.querySelector(".instruction-icon");
        if (icon) icon.style.transform = "rotate(180deg)";
      }

      box.addEventListener("click", function () {
        this.classList.toggle("expanded");
        const content = this.querySelector(".instruction-content");
        const icon = this.querySelector(".instruction-icon");

        if (content) {
          content.style.display = this.classList.contains("expanded")
            ? "block"
            : "none";
        }
        if (icon) {
          icon.style.transform = this.classList.contains("expanded")
            ? "rotate(180deg)"
            : "rotate(0deg)";
        }
      });
    });

    initializeSidebar();
    initializeResources(DEMO_DATA.images);

    const titleElement = document.getElementById("articleTitle");
    if (titleElement) {
      titleElement.textContent = DEMO_DATA.essay.topic;
    }
  } catch (error) {
    console.error("Error in initializePage:", error);
  }
}

// Initialize previous prediction cards from data
function initializePredictionCards(predictions) {
  const container = document.querySelector(".prediction-content");
  if (!container) {
    return;
  }

  predictions.forEach((prediction) => {
    const card = createExistingPredictionCard(prediction);
    container.appendChild(card);
  });
}

// Create a card element for an existing prediction
function createExistingPredictionCard(prediction) {
  const card = document.createElement("div");
  card.className = "prediction-result-card";
  card.id = prediction.pid;

  const finalResult =
    prediction.option === "Incorrect"
      ? "[Incorrect]"
      : prediction.option === "Modify"
      ? prediction.modify_pcontent
      : prediction.pcontent;

  const markedContent = prediction.record_content.replace(
    finalResult,
    `<span class="highlighted-text" style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px;">${finalResult}</span>`
  );

  card.dataset.finalResult = finalResult;
  card.dataset.recordContent = markedContent;

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

// Build the main user interface structure
function createInterface() {
  const mainStructure = `
    <main>
      <div class="writing-container">
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

        <div class="main-content">
          <div class="editor-section">
            <div class="topic-title">
              <h2><span class="topic-label">Title: </span><span id="articleTitle"></span></h2>
            </div>

            <div class="instruction-box" id="writing-instruction">
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
            
            <div class="area-title"> Writing Area </div>
            <div class="editor-container">
              <div id="editor" class="editor" contenteditable="true"></div>
            </div>

            <div class="area-title"> Context Information </div>
            <div class="context-container">
              <div class="resources-container">
              </div>
            </div>
          </div>

          <div class="sidebar">
            <div class="sidebar-tabs">
              <button class="tab-btn active" data-tab="prediction">
                <i class="fas fa-chart-line"></i> <br />Prediction Function
              </button>
            </div>

            <div class="sidebar-content">
              <div class="tab-panel active" id="predictionPanel">
                <div class="prediction-container">
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

  const mainContent = document.querySelector("#layoutSidenav_content main");
  if (mainContent) {
    mainContent.innerHTML = mainStructure;
  } else {
  }
}

// Handle essay reset request
function handleReset() {
  Swal.fire({
    title: "Reset Homework",
    html: `
      <p style="text-align: center;">
        Do you want to reset your homework?
        <br><br>
        This will reset your images and title, clear all current progress, and return to the setup page.
      </p>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Reset",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
  }).then((result) => {
    if (result.isConfirmed) {
      try {
        localStorage.removeItem("writingContent");
        sessionStorage.removeItem("essayData");

        window.location.href = "/hw_writing_setup_instruct";
      } catch (error) {
        console.error("Reset error:", error);
        Swal.fire({
          icon: "error",
          title: "Reset Failed",
          text: "Failed to reset homework. Please try again.",
        });
      }
    }
  });
}

// Handle essay save request
function handleSave() {
  try {
    const editor = document.getElementById("editor");
    if (!editor) {
      throw new Error("Editor element not found");
    }
    const content = editor.innerHTML;

    const title = document.getElementById("articleTitle").textContent;

    localStorage.setItem(
      "writingContent",
      JSON.stringify({
        title: title,
        content: content,
      })
    );

    const essayDataStr = sessionStorage.getItem("essayData");
    if (essayDataStr) {
      const essayData = JSON.parse(essayDataStr);
      essayData.essay.content = content;
      sessionStorage.setItem("essayData", JSON.stringify(essayData));
    }

    Swal.fire({
      icon: "success",
      title: "Saved!",
      text: "Your content has been saved successfully.",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Save error:", error);
    Swal.fire({
      icon: "error",
      title: "Save Failed",
      text: error.message,
    });
  }
}

// Load and display context resources (images/keywords)
function initializeResources(images) {
  const container = document.querySelector(
    ".editor-section .resources-container"
  );

  if (!container) {
    return;
  }

  images.forEach((image, index) => {
    const resourceElement = createResourceElement(image, index);
    container.appendChild(resourceElement);
  });
}

// Create a resource element with keyword chips and description
function createResourceElement(image, index) {
  const div = document.createElement("div");
  div.className = "resource-item";

  const extensions = [".jpg", ".png", ".webp"];
  const imgElement = new Image();
  let loadedImage = false;

  const tryLoadImage = (extIndex = 0) => {
    if (extIndex >= extensions.length) {
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

  div.querySelector(".resource-preview").addEventListener("click", () => {
    showResourceModal(
      div.dataset.imagePath,
      image.modify_keywords,
      image.modify_description
    );
  });

  tryLoadImage();

  return div;
}

// Show resource details in a modal
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
    showConfirmButton: true,
    confirmButtonText: "Close",
    confirmButtonColor: "#6c757d",
    customClass: {
      popup: "resource-modal-popup",
      confirmButton: "btn btn-secondary",
    },
  });
}

// Create the sidebar prediction panel
function createPredictionPanel() {
  const predictionContainer = document.querySelector(".prediction-container");
  if (!predictionContainer) {
    return;
  }

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
            <div class="instruction-box expanded" id="prediction-instruction">
                <div class="instruction-header">
                    <svg class="instruction-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="transform: rotate(180deg);">
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
  const instructionBox = predictionContainer.querySelector(".instruction-box");
  instructionBox.addEventListener("click", function () {
    this.classList.toggle("expanded");
  });

  const predictionBtn = document.getElementById("predictionBtn");
  predictionBtn.disabled = true;
  predictionBtn.addEventListener("click", handlePrediction);

  initializePredictionFunction();
}

// Update UI status for prediction availability
function updatePredictionStatus(editor, isValidPosition, hasValidEnding) {
  const statusElement = document.getElementById("predictionStatus");
  const content = editor.textContent.trim();

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

  statusElement.textContent = "State: Ready to predict";
  statusElement.classList.add("success");
}

// Handle next sentence prediction request
async function handlePrediction() {
  try {
    const editor = document.getElementById("editor");
    const predictionBtn = document.getElementById("predictionBtn");
    const overlay = document.querySelector(".prediction-overlay");

    const predictMark = document.createElement("span");
    predictMark.className = "highlighted-text prediction-mark";
    predictMark.textContent = "[PREDICTED SENTENCE]";
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.insertNode(predictMark);

    editor.contentEditable = "false";
    predictionBtn.disabled = true;
    if (overlay) overlay.classList.add("active");

    let timerInterval;
    let remainingTime = 90;

    Swal.fire({
      title: "Predicting Next Sentence",
      html: `
        <div class="prediction-waiting">
            <div class="countdown">${remainingTime}</div>
            <p>Sentence prediction is in progress.</p>
            <p><b>Just a moment—this'll take around 90 seconds. Don't leave the page!</b></p>
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

    await new Promise((resolve) => setTimeout(resolve, 3000));
    await Swal.close();

    const cardId = `prediction-${Date.now()}`;
    createPredictionResultCard(
      "This is a DEMO prediction sentence.",
      cardId,
      editor.textContent
    );

    editor.contentEditable = "true";
    predictionBtn.disabled = false;
    if (overlay) overlay.classList.remove("active");
  } catch (error) {
    console.error("Prediction error:", error);
    Swal.fire({
      icon: "error",
      title: "Prediction Failed",
      text: error.message,
    });
  }
}

// Initialize sidebar tabs and toggles
function initializeSidebar() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(`${btn.dataset.tab}Panel`);
      targetPanel.classList.add("active");
    });
  });

  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "sidebar-toggle";
  toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

  sidebar.appendChild(toggleBtn);

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    document
      .querySelector(".main-content")
      .classList.toggle("sidebar-collapsed");
  });

  createPredictionPanel();
}

// Handle essay submission request
async function handleSubmit() {
  try {
    const result = await Swal.fire({
      title: "Confirm Submission",
      text: "Do you want to submit your essay?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Submit",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      localStorage.removeItem("writingContent");
      sessionStorage.removeItem("essayData");

      await Swal.fire({
        icon: "success",
        title: "Submitted Successfully!",
        text: "Your essay has been submitted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      window.location.href = "/";
    }
  } catch (error) {
    console.error("Submit error:", error);
    Swal.fire({
      icon: "error",
      title: "Submit Failed",
      text: error.message,
    });
  }
}

const textarea = document.getElementById("articleInput");
const prevSentence = document.getElementById("prevSentence");
const currentSentence = document.getElementById("currentSentence");
const nextSentence = document.getElementById("nextSentence");
const currentCase = document.getElementById("currentCase");
const markedText = document.getElementById("markedText");

function normalizeText(text) {
  return text
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/，/g, ",")
    .replace(/。/g, ".")
    .replace(/！/g, "!")
    .replace(/？/g, "?")
    .trim();
}

// Update prediction button state based on cursor position
function updatePrediction() {
  const editor = document.getElementById("editor");
  const predictionBtn = document.getElementById("predictionBtn");
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);

  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editor);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  const cursorPosition = preCaretRange.toString().length;

  const originalText = editor.textContent;

  const charBeforeCursor = originalText[cursorPosition - 1];
  const isAtStart = cursorPosition === 0;
  const isValidPosition = isAtStart || /[.!?]/.test(charBeforeCursor);
  const lastChar = originalText.trim().slice(-1);
  const hasValidEnding = /[.!?]/.test(lastChar);

  predictionBtn.disabled = !(isValidPosition && hasValidEnding);

  updatePredictionStatus(editor, isValidPosition, hasValidEnding);

  const markedText = document.getElementById("markedText");

  if (!isValidPosition) {
    markedText.textContent = originalText;
    return;
  }

  const beforeText = originalText.slice(0, cursorPosition);
  const afterText = originalText.slice(cursorPosition);

  const markContent = beforeText + " [PREDICTED SENTENCE] " + afterText;
  markedText.textContent = markContent;
}

// Initialize event listeners for the prediction feature
function initializePredictionFunction() {
  const editor = document.getElementById("editor");

  editor.addEventListener("input", updatePrediction);
  editor.addEventListener("click", updatePrediction);
  editor.addEventListener("keyup", updatePrediction);
}

// Utility for number suffixes
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

// Create a card for a new prediction result
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

  const editor = document.getElementById("editor");
  card.dataset.originalHtml = editor.innerHTML;

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

  if (existingCards.length > 0) {
    container.insertBefore(card, existingCards[0]);
  } else {
    container.appendChild(card);
  }
}

// Show info for an existing prediction record
async function showExistingPredictionInfo(pid) {
  const card = document.getElementById(pid);
  if (!card || !card.dataset.recordContent) {
    return;
  }

  try {
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
  }
}

// Show info for a new prediction record
async function showPredictionInfo(cardId) {
  const card = document.getElementById(cardId);
  const finalResult = card.dataset.finalResult;
  const originalHtml = card.dataset.originalHtml;

  try {
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = originalHtml;

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

    Swal.fire({
      title: "Prediction Record",
      html: tempContainer.innerHTML,
      width: "600px",
      customClass: {
        htmlContainer: "prediction-record-container",
        popup: "text-align-left-popup",
      },
    });
  } catch (error) {}
}

// Disable interaction buttons on a prediction card
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

// Handle "Correct" choice for prediction
async function handleCorrect(cardId) {

  const card = findPredictionCard(cardId);
  if (!card) return;

  try {
    const button = card.querySelector(".btn-correct");
    const editor = document.getElementById("editor");
    const predictedText = card.querySelector(".prediction-text").textContent;

    card.querySelectorAll(".prediction-btn").forEach((btn) => {
      btn.classList.remove("selected");
      btn.disabled = true;
      btn.style.opacity = "0.5";
    });

    button.classList.add("selected");
    button.style.opacity = "1";
    button.style.cursor = "not-allowed";

    const editContainer = card.querySelector(".edit-container");
    if (editContainer) {
      editContainer.style.display = "none";
    }

    const currentHtml = editor.innerHTML;
    const updatedHtml = currentHtml.replace(
      /<span class="highlighted-text prediction-mark">\[PREDICTED SENTENCE\]<\/span>/,
      ` ${predictedText}`
    );
    editor.innerHTML = updatedHtml;

    const pid = await savePredictionResult(cardId, "Correct");

    finishPredictionFlow(pid || cardId, predictedText);
  } catch (error) {
  }
}

// Handle "Modify" choice for prediction
function handleModify(cardId) {

  const card = findPredictionCard(cardId);
  if (!card) return;

  const button = card.querySelector(".btn-modify");
  const editContainer = card.querySelector(".edit-container");
  const editInput = card.querySelector(".edit-input");

  card.querySelectorAll(".prediction-btn").forEach((btn) => {
    btn.classList.remove("selected");
  });

  button.classList.add("selected");

  editInput.readOnly = false;
  editContainer.style.display = "block";

  editInput.focus();
}

// Confirm modified prediction result
async function handleEditConfirm(cardId) {

  const card = findPredictionCard(cardId);
  if (!card) return;

  try {
    const editInput = card.querySelector(".edit-input");
    const modifiedText = editInput.value;
    const editor = document.getElementById("editor");

    const currentHtml = editor.innerHTML;
    const updatedHtml = currentHtml.replace(
      /<span class="highlighted-text prediction-mark">\[PREDICTED SENTENCE\]<\/span>/,
      ` ${modifiedText}`
    );
    editor.innerHTML = updatedHtml;

    const pid = await savePredictionResult(cardId, "Modify", modifiedText);

    finishPredictionFlow(pid || cardId, modifiedText);
  } catch (error) {
  }
}

// Handle "Incorrect" choice for prediction
async function handleIncorrect(cardId) {

  const card = findPredictionCard(cardId);
  if (!card) return;

  try {
    const button = card.querySelector(".btn-incorrect");
    const editor = document.getElementById("editor");

    card.querySelectorAll(".prediction-btn").forEach((btn) => {
      btn.classList.remove("selected");
      btn.disabled = true;
      btn.style.opacity = "0.5";
    });

    button.classList.add("selected");
    button.style.opacity = "1";
    button.style.cursor = "not-allowed";

    const editContainer = card.querySelector(".edit-container");
    if (editContainer) {
      editContainer.style.display = "none";
    }

    const currentHtml = editor.innerHTML;
    const updatedHtml = currentHtml.replace(
      /<span class="highlighted-text prediction-mark">\[PREDICTED SENTENCE\]<\/span>/,
      ""
    );
    editor.innerHTML = updatedHtml;

    const pid = await savePredictionResult(cardId, "Incorrect");

    finishPredictionFlow(pid || cardId, "[Incorrect]");
  } catch (error) {}
}

// Helper to find prediction card by ID
function findPredictionCard(id) {
  let card = document.getElementById(id);
  if (!card) {
    card = document.querySelector(
      `.prediction-result-card[data-temp-id="${id}"]`
    );
  }
  if (!card) {
    return null;
  }
  return card;
}

// Save prediction outcome to session storage (demo mode)
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

    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = originalHtml;

    const predictMark = tempContainer.querySelector(".prediction-mark");
    if (predictMark) {
      const highlightedSpan = document.createElement("span");
      highlightedSpan.className = "highlighted-text";
      highlightedSpan.style.backgroundColor = "#fef08a";
      highlightedSpan.style.padding = "2px 4px";
      highlightedSpan.style.borderRadius = "2px";

      const finalText =
        option === "Incorrect"
          ? "[Incorrect]"
          : option === "Modify"
          ? modifiedContent
          : card.querySelector(".prediction-text").textContent;

      highlightedSpan.textContent = finalText;
      predictMark.parentNode.replaceChild(highlightedSpan, predictMark);
    }

    tempContainer.style.textAlign = "left";

    const predictionData = {
      pname: cardIdText.replace("ID: ", ""),
      pcontent: card.querySelector(".prediction-text").textContent,
      option: option,
      modify_pcontent: modifiedContent,
      record_content: tempContainer.innerHTML,
      prompt: prompt,
    };

    card.dataset.finalResult =
      option === "Incorrect"
        ? "[Incorrect]"
        : modifiedContent || predictionData.pcontent;
    card.dataset.recordContent = tempContainer.innerHTML;

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
  } catch (error) {
    throw error;
  }
}

// Finalize UI after prediction selection
function finishPredictionFlow(cardId, result) {
  const card = document.getElementById(cardId);
  const overlay = document.querySelector(".prediction-overlay");

  const buttons = card.querySelectorAll(".prediction-btn");
  buttons.forEach((button) => {
    if (button.classList.contains("selected")) {
      button.style.cursor = "not-allowed";
    } else {
      button.disabled = true;
      button.style.opacity = "0.5";
    }
  });

  const editContainer = card.querySelector(".edit-container");
  if (editContainer) {
    const editInput = editContainer.querySelector(".edit-input");
    if (editInput) {
      editInput.readOnly = true;
      editInput.classList.add("disabled");
    }
  }

  const infoIcon = card.querySelector(".info-icon");
  if (infoIcon) {
    infoIcon.style.display = "block";
  }

  card.dataset.finalResult = result;

  if (overlay) overlay.classList.remove("active");

  const editor = document.getElementById("editor");
  if (editor) editor.contentEditable = "true";
}

// End prediction process and clean up
function endPredictionFlow() {
  const card = document.querySelector(".prediction-result-card");
  if (card) card.remove();

  const editor = document.getElementById("editor");
  editor.contentEditable = "true";

  updatePrediction();
}
