document.addEventListener('DOMContentLoaded', () => {
  const generateForm = document.getElementById('generate-form');
  const loadingDiv = document.getElementById('loading');
  const outputDiv = document.getElementById('output');
  const manualPromptRadio = document.getElementById('manual-prompt');
  const guidedPromptRadio = document.getElementById('guided-prompt');
  const manualPromptGroup = document.getElementById('manual-prompt-group');
  const guidedPromptContainer = document.getElementById('guided-prompt-container');
  const promptInput = document.getElementById('prompt');

  // Toggle between manual and guided prompt input
  manualPromptRadio.addEventListener('change', () => {
    manualPromptGroup.style.display = 'block';
    guidedPromptContainer.style.display = 'none';
  });

  guidedPromptRadio.addEventListener('change', () => {
    manualPromptGroup.style.display = 'none';
    guidedPromptContainer.style.display = 'block';
  });

  // Initialize the correct display state
  if (manualPromptRadio.checked) {
    manualPromptGroup.style.display = 'block';
    guidedPromptContainer.style.display = 'none';
  } else {
    manualPromptGroup.style.display = 'none';
    guidedPromptContainer.style.display = 'block';
  }

  // Handle collapsible sections
  const collapsibleHeaders = document.querySelectorAll('.collapsible');
  collapsibleHeaders.forEach(header => {
    header.addEventListener('click', () => {
      header.classList.toggle('active');
      const content = header.nextElementSibling;
      if (content.style.display === 'block' || content.style.display === '') {
        content.style.display = 'none';
      } else {
        content.style.display = 'block';
      }
    });
  });

  // Handle gaze option selection
  const gazeOptions = document.querySelectorAll('.gaze-option');
  let selectedGazeOption = null;
  gazeOptions.forEach(option => {
    option.addEventListener('click', () => {
      if (selectedGazeOption) {
        selectedGazeOption.classList.remove('selected');
      }
      option.classList.add('selected');
      selectedGazeOption = option;
    });
  });

  // Build prompt from guided selections
  const sceneSelect = document.getElementById('scene');
  const cameraPositionSelect = document.getElementById('camera-position');
  const pantsSelect = document.getElementById('pants');
  const shoesSelect = document.getElementById('shoes');
  const shirtsSelect = document.getElementById('shirts');
  const headwearSelect = document.getElementById('headwear');
  const poseSelect = document.getElementById('pose');

  function updatePrompt() {
    let promptParts = [];

    // Static prompts for each selection
    if (sceneSelect.value) {
      promptParts.push(sceneSelect.value);
    }

    if (cameraPositionSelect.value) {
      promptParts.push(cameraPositionSelect.value);
    }

    // Clothes
    let clothesParts = [];

    if (pantsSelect.value) {
      clothesParts.push(pantsSelect.value);
    }

    if (shoesSelect.value) {
      clothesParts.push(shoesSelect.value);
    }

    if (shirtsSelect.value) {
      clothesParts.push(shirtsSelect.value);
    }

    if (headwearSelect.value) {
      clothesParts.push(headwearSelect.value);
    }

    if (clothesParts.length > 0) {
      promptParts.push(clothesParts.join(', '));
    }

    // Gaze Direction
    if (selectedGazeOption) {
      promptParts.push(selectedGazeOption.getAttribute('data-value'));
    }

    // Pose
    if (poseSelect.value) {
      promptParts.push(poseSelect.value);
    }

    promptInput.value = promptParts.join(', ');
  }

  // Add event listeners to update the prompt when selections change
  sceneSelect.addEventListener('change', updatePrompt);
  cameraPositionSelect.addEventListener('change', updatePrompt);
  pantsSelect.addEventListener('change', updatePrompt);
  shoesSelect.addEventListener('change', updatePrompt);
  shirtsSelect.addEventListener('change', updatePrompt);
  headwearSelect.addEventListener('change', updatePrompt);
  poseSelect.addEventListener('change', updatePrompt);
  gazeOptions.forEach(option => {
    option.addEventListener('click', updatePrompt);
  });

  // Initialize prompt
  updatePrompt();

  // Form submission
  generateForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(generateForm);
    // Get guided selections if guided prompt is selected
    if (guidedPromptRadio.checked) {
      formData.append('scene', sceneSelect.value);
      formData.append('camera_position', cameraPositionSelect.value);
      formData.append('pants', pantsSelect.value);
      formData.append('shoes', shoesSelect.value);
      formData.append('shirts', shirtsSelect.value);
      formData.append('headwear', headwearSelect.value);
      if (selectedGazeOption) {
        formData.append('gaze_direction', selectedGazeOption.getAttribute('data-value'));
      }
      formData.append('pose', poseSelect.value);
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
});