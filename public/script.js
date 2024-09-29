document.addEventListener('DOMContentLoaded', () => {
  const generateForm = document.getElementById('generate-form');
  const loadingDiv = document.getElementById('loading');
  const outputDiv = document.getElementById('output');
  const manualPromptRadio = document.getElementById('manual-prompt');
  const guidedPromptRadio = document.getElementById('guided-prompt');
  const visualPromptRadio = document.getElementById('visual-prompt');
  const overigePromptRadio = document.getElementById('overige-prompt');
  const manualPromptGroup = document.getElementById('manual-prompt-group');
  const guidedPromptContainer = document.getElementById('guided-prompt-container');
  const visualPromptContainer = document.getElementById('visual-prompt-container');
  const overigePromptContainer = document.getElementById('overige-prompt-container');
  const promptInput = document.getElementById('prompt');
  const hfLoraInput = document.getElementById('hf_lora');
  const useLoraCheckbox = document.getElementById('use_lora');
  const overigeButtons = document.querySelectorAll('.overige-button');
  let selectedOverigeButton = null;
  let selectedGazeOption = null;


  // Toggle between prompt input methods
  function updatePromptMethod() {
    manualPromptGroup.style.display = manualPromptRadio.checked ? 'block' : 'none';
    guidedPromptContainer.style.display = guidedPromptRadio.checked ? 'block' : 'none';
    visualPromptContainer.style.display = visualPromptRadio.checked ? 'block' : 'none';
    overigePromptContainer.style.display = overigePromptRadio.checked ? 'block' : 'none';

    // Get headers and sections
    const guidedPromptSection = document.getElementById('guided-prompt-section');
    const visualPromptSection = document.getElementById('visual-prompt-section');

    // Show or hide the guided prompt section
    if (guidedPromptRadio.checked) {
      guidedPromptSection.style.display = 'block';
    } else {
      guidedPromptSection.style.display = 'none';
    }

    // Show or hide the visual prompt section
    if (visualPromptRadio.checked) {
      visualPromptSection.style.display = 'block';
    } else {
      visualPromptSection.style.display = 'none';
    }
  }

  manualPromptRadio.addEventListener('change', updatePromptMethod);
  guidedPromptRadio.addEventListener('change', updatePromptMethod);
  visualPromptRadio.addEventListener('change', updatePromptMethod);
  overigePromptRadio.addEventListener('change', updatePromptMethod);

  // Initialize the correct display state
  updatePromptMethod();

  // Handle collapsible sections
  const collapsibleHeaders = document.querySelectorAll('.collapsible');

  collapsibleHeaders.forEach(header => {
    header.addEventListener('click', () => {
      header.classList.toggle('active');
      const content = header.nextElementSibling;
      if (content) {
        if (content.style.display === 'block' || content.style.display === '') {
          content.style.display = 'none';
        } else {
          content.style.display = 'block';
        }
      }
    });
  });

  // Visual Prompt Builder Selections
  let selectedClothingOption = null;
  let selectedLocationOption = null;
  const clothingOptions = document.querySelectorAll('#clothing-options .visual-option');
  const locationOptions = document.querySelectorAll('#location-options .visual-option');

  function handleOptionClick(options, selectedOption, clickedOption) {
    if (selectedOption) {
      selectedOption.classList.remove('selected');
    }
    clickedOption.classList.add('selected');
    return clickedOption;
  }

  clothingOptions.forEach(option => {
    option.addEventListener('click', () => {
      selectedClothingOption = handleOptionClick(clothingOptions, selectedClothingOption, option);
      updateVisualPrompt();
    });
  });

  locationOptions.forEach(option => {
    option.addEventListener('click', () => {
      selectedLocationOption = handleOptionClick(locationOptions, selectedLocationOption, option);
      updateVisualPrompt();
    });
  });

  function updateVisualPrompt() {
    let prompt = "A highly detailed portrait of ";

    // Include the subject if using HF LoRA
    const useLora = useLoraCheckbox.checked;
    const hfLoraValue = hfLoraInput.value.trim();

    if (useLora && hfLoraValue) {
      prompt += hfLoraValue + " ";
    } else {
      prompt += "a person ";
    }

    // Add clothing description
    if (selectedClothingOption) {
      prompt += selectedClothingOption.getAttribute('data-value') + " ";
    }

    // Add location description
    if (selectedLocationOption) {
      prompt += selectedLocationOption.getAttribute('data-value') + " ";
    }

    // Add style modifiers
    prompt += ", ultra-realistic, 8K resolution, sharp focus";

    // Set the prompt input value
    promptInput.value = prompt;
  }

  // Update event listeners
  clothingOptions.forEach(option => {
    option.addEventListener('click', () => {
      selectedClothingOption = handleOptionClick(clothingOptions, selectedClothingOption, option);
      updateVisualPrompt();
    });
  });

  locationOptions.forEach(option => {
    option.addEventListener('click', () => {
      selectedLocationOption = handleOptionClick(locationOptions, selectedLocationOption, option);
      updateVisualPrompt();
    });
  });

  // Update the prompt when HF LoRA or Use LoRA changes
  hfLoraInput.addEventListener('input', updateVisualPrompt);
  useLoraCheckbox.addEventListener('change', updateVisualPrompt);

  // Gaze Direction Selection
  const gazeOptions = document.querySelectorAll('.gaze-option');

  gazeOptions.forEach(option => {
    option.addEventListener('click', () => {
      if (selectedGazeOption) {
        selectedGazeOption.classList.remove('selected');
      }
      option.classList.add('selected');
      selectedGazeOption = option;
      updatePrompt();
    });
  });

  // Update prompt for guided selections
  const sceneSelect = document.getElementById('scene');
  const cameraPositionSelect = document.getElementById('camera-position');
  const pantsSelect = document.getElementById('pants');
  const shoesSelect = document.getElementById('shoes');
  const shirtsSelect = document.getElementById('shirts');
  const headwearSelect = document.getElementById('headwear');
  const poseSelect = document.getElementById('pose');

  function updatePrompt() {
    if (!guidedPromptRadio.checked) return;

    let promptParts = [];

    // HF LoRA and Use LoRA
    if (useLoraCheckbox.checked && hfLoraInput.value.trim()) {
      promptParts.push(hfLoraInput.value.trim());
    }

    // Scene
    if (sceneSelect && sceneSelect.value) {
      promptParts.push(sceneSelect.value);
    }

    // Camera Position
    if (cameraPositionSelect && cameraPositionSelect.value) {
      promptParts.push(cameraPositionSelect.value);
    }

    // Clothes
    let clothesParts = [];
    [pantsSelect, shirtsSelect, shoesSelect, headwearSelect].forEach(select => {
      if (select && select.value) {
        clothesParts.push(select.value);
      }
    });
    if (clothesParts.length > 0) {
      promptParts.push(`wearing ${clothesParts.join(', ')}`);
    }

    // Gaze Direction
    if (selectedGazeOption) {
      promptParts.push(selectedGazeOption.getAttribute('data-value'));
    }

    // Pose
    if (poseSelect && poseSelect.value) {
      promptParts.push(poseSelect.value);
    }

    // Set the prompt input value
    promptInput.value = promptParts.join(', ');
  }

  // Call updatePrompt whenever a selection changes
  document.querySelectorAll('#guided-prompt-container select, #guided-prompt-container input[type="color"]').forEach(element => {
    element.addEventListener('change', updatePrompt);
  });

  document.querySelectorAll('.gaze-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.gaze-option').forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      updatePrompt();
    });
  });

  // Initial call to set up the prompt
  updatePrompt();

  // Add event listeners to update the prompt when selections change
  if (sceneSelect) sceneSelect.addEventListener('change', updatePrompt);
  if (cameraPositionSelect) cameraPositionSelect.addEventListener('change', updatePrompt);
  if (pantsSelect) pantsSelect.addEventListener('change', updatePrompt);
  if (shoesSelect) shoesSelect.addEventListener('change', updatePrompt);
  if (shirtsSelect) shirtsSelect.addEventListener('change', updatePrompt);
  if (headwearSelect) headwearSelect.addEventListener('change', updatePrompt);
  if (poseSelect) poseSelect.addEventListener('change', updatePrompt);

  // Form submission handler
  generateForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Update the prompt one last time before submission
    if (guidedPromptRadio.checked) {
      updatePrompt();
    }

    const formData = new FormData(generateForm);

    // Use the compiled prompt for guided and manual methods
    if (guidedPromptRadio.checked || manualPromptRadio.checked) {
      formData.set('prompt', promptInput.value);
    }

    // Include visual selections if visual prompt is selected
    if (visualPromptRadio.checked) {
      if (selectedClothingOption) {
        formData.append('clothing', selectedClothingOption.getAttribute('data-value'));
      }
      if (selectedLocationOption) {
        formData.append('location', selectedLocationOption.getAttribute('data-value'));
      }
    }

    // For overige prompt, keep the existing logic
    if (overigePromptRadio.checked && selectedOverigeButton) {
      formData.set('prompt', selectedOverigeButton.getAttribute('data-prompt'));
    }

    const input = Object.fromEntries(formData.entries());

    // Remove undefined or empty values
    Object.keys(input).forEach(key => {
      if (input[key] === undefined || input[key] === null || input[key] === '') {
        delete input[key];
      }
    });

    // Convert string inputs to numbers where necessary
    if (input.num_outputs) input.num_outputs = parseInt(input.num_outputs);
    if (input.num_inference_steps) input.num_inference_steps = parseInt(input.num_inference_steps);
    if (input.output_quality) input.output_quality = parseInt(input.output_quality);
    if (input.guidance_scale) input.guidance_scale = parseFloat(input.guidance_scale);
    if (input.lora_scale) input.lora_scale = parseFloat(input.lora_scale);
    if (input.prompt_strength) input.prompt_strength = parseFloat(input.prompt_strength);
    if (input.seed) input.seed = parseInt(input.seed);

    // Convert 'disable_safety_checker' checkbox value to boolean
    input.disable_safety_checker = !!input.disable_safety_checker;

    try {
      // Show loading spinner and clear previous output
      loadingDiv.style.display = 'block';
      outputDiv.innerHTML = '';

      const response = await fetch('/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (response.ok) {
        // Hide loading spinner
        loadingDiv.style.display = 'none';

        data.output.forEach((imageUrl) => {
          const img = document.createElement('img');
          img.src = imageUrl;
          outputDiv.appendChild(img);
        });
      } else {
        loadingDiv.style.display = 'none';
        alert('Error: ' + data.error);
      }
    } catch (error) {
      loadingDiv.style.display = 'none';
      console.error('Error:', error);
      alert('An error occurred while generating the image.');
    }
  });

  // Handle Advanced Settings Collapsible
  const advancedCollapsibleHeader = document.querySelector('.advanced-section .collapsible');
  const advancedSettingsContent = document.querySelector('.advanced-settings-content');

  advancedCollapsibleHeader.addEventListener('click', () => {
    advancedCollapsibleHeader.classList.toggle('active');
    advancedSettingsContent.classList.toggle('active');
  });

  overigeButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (selectedOverigeButton) {
        selectedOverigeButton.classList.remove('selected');
      }
      button.classList.add('selected');
      selectedOverigeButton = button;
      promptInput.value = button.getAttribute('data-prompt');
    });
  });

  // Call updatePrompt whenever a selection changes
  [sceneSelect, cameraPositionSelect, pantsSelect, shoesSelect, shirtsSelect, headwearSelect, poseSelect].forEach(select => {
    if (select) select.addEventListener('change', updatePrompt);
  });

  useLoraCheckbox.addEventListener('change', updatePrompt);
  hfLoraInput.addEventListener('input', updatePrompt);

  // Update prompt when switching to guided prompt
  guidedPromptRadio.addEventListener('change', () => {
    if (guidedPromptRadio.checked) {
      updatePrompt();
    }
  });

  // Call updatePrompt whenever a selection changes
  [sceneSelect, cameraPositionSelect, pantsSelect, shoesSelect, shirtsSelect, headwearSelect, poseSelect].forEach(select => {
    if (select) select.addEventListener('change', updatePrompt);
  });

  // Event listeners for gaze options
  document.querySelectorAll('.gaze-option').forEach(option => {
    option.addEventListener('click', () => {
      if (selectedGazeOption) {
        selectedGazeOption.classList.remove('selected');
      }
      option.classList.add('selected');
      selectedGazeOption = option;
      updatePrompt();
    });
  });

  // Update the prompt when HF LoRA or Use LoRA changes
  hfLoraInput.addEventListener('input', updatePrompt);
  useLoraCheckbox.addEventListener('change', updatePrompt);

  // Update prompt when guided prompt is selected
  guidedPromptRadio.addEventListener('change', updatePrompt);

  // Training Modal Logic
  const trainingButton = document.getElementById('training-button');
  const trainingModal = document.getElementById('training-modal');
  const trainingModalClose = document.getElementById('training-modal-close');
  const trainingForm = document.getElementById('training-form');
  const dropArea = document.getElementById('drop-area');
  const imagesInput = document.getElementById('images-input');
  const previewContainer = document.getElementById('preview-container');

  let filesList = [];

  trainingButton.addEventListener('click', () => {
    trainingModal.style.display = 'block';
  });

  trainingModalClose.addEventListener('click', () => {
    trainingModal.style.display = 'none';
    resetTrainingForm();
  });

  window.addEventListener('click', (event) => {
    if (event.target == trainingModal) {
      trainingModal.style.display = 'none';
      resetTrainingForm();
    }
  });

  // Drag and Drop functionality
  ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
      dropArea.classList.add('hover');
    }, false);
  });

  ;['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
      dropArea.classList.remove('hover');
    }, false);
  });

  dropArea.addEventListener('drop', handleDrop, false);
  dropArea.addEventListener('click', () => {
    imagesInput.click();
  });

  imagesInput.addEventListener('change', handleFiles, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files } });
  }

  function handleFiles(e) {
    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
      filesList.push(files[i]);
    }
    updatePreview();
  }

  function updatePreview() {
    previewContainer.innerHTML = '';
    filesList.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewImage = document.createElement('div');
        previewImage.classList.add('preview-image');
        previewImage.innerHTML = `
          <img src="${reader.result}" alt="${file.name}">
          <button class="remove-image" data-index="${index}">&times;</button>
        `;
        previewContainer.appendChild(previewImage);

        // Add event listener to the remove button
        previewImage.querySelector('.remove-image').addEventListener('click', (e) => {
          const idx = e.currentTarget.getAttribute('data-index');
          filesList.splice(idx, 1);
          updatePreview();
        });
      };
      reader.readAsDataURL(file);
    });
  }

  function resetTrainingForm() {
    filesList = [];
    previewContainer.innerHTML = '';
    trainingForm.reset();
  }

  trainingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (filesList.length === 0) {
      alert('Please upload at least one image.');
      return;
    }

    const formData = new FormData();

    // Append images
    filesList.forEach((file) => {
      formData.append('images', file);
    });

    // Append the trigger word
    formData.append('trigger_word', document.getElementById('trigger-word').value || 'TOK');

    try {
      const response = await fetch('/train', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const trainingId = data.training_id;
        alert('Training started successfully. Training ID: ' + trainingId);
        trainingModal.style.display = 'none';
        resetTrainingForm();

        // Start checking training status
        checkTrainingStatus(trainingId);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while starting the training.');
    }
  });

  // Add this function to script.js to check training status

  function checkTrainingStatus(trainingId) {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'training-status';
    statusDiv.innerText = 'Training status: Starting...';
    document.body.appendChild(statusDiv);

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/training-status/${trainingId}`);
        if (response.ok) {
          const data = await response.json();
          statusDiv.innerText = `Training status: ${data.status}`;

          if (data.status === 'succeeded' || data.status === 'failed' || data.status === 'canceled') {
            clearInterval(intervalId);
            if (data.status === 'succeeded') {
              alert('Training completed successfully!');
            } else {
              alert('Training failed or was canceled.');
            }
            // Remove the statusDiv after completion
            document.body.removeChild(statusDiv);
          }
        } else {
          console.error('Error fetching training status:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching training status:', error);
      }
    }, 5000); // Poll every 5 seconds
  }
});