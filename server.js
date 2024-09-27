const express = require('express');
const app = express();
const dotenv = require('dotenv');
const Replicate = require('replicate');

dotenv.config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.use(express.static('public'));
app.use(express.json());

app.post('/generate', async (req, res) => {
  const input = req.body;

  // Build the prompt on the server side
  let promptParts = [];

  // Use HF LoRA as the subject
  if (input.hf_lora) {
    promptParts.push(input.hf_lora);
  }

  // If guided prompt is selected, build prompt from selections
  if (input['prompt-method'] === 'guided') {
    if (input.scene) {
      promptParts.push(input.scene);
    }
    if (input.camera_position) {
      promptParts.push(input.camera_position);
    }
    // Clothes
    let clothesParts = [];
    if (input.pants) clothesParts.push(input.pants);
    if (input.shoes) clothesParts.push(input.shoes);
    if (input.shirts) clothesParts.push(input.shirts);
    if (input.headwear) clothesParts.push(input.headwear);
    if (clothesParts.length > 0) {
      promptParts.push(clothesParts.join(', '));
    }
    // Gaze Direction
    if (input.gaze_direction) {
      promptParts.push(input.gaze_direction);
    }
    // Pose
    if (input.pose) {
      promptParts.push(input.pose);
    }
  } else {
    // Use manual prompt
    if (input.prompt) {
      promptParts.push(input.prompt);
    }
  }

  // Construct the final prompt
  input.prompt = promptParts.join(', ');

  // Remove 'prompt-method' and guided selections from input before sending to Replicate
  delete input['prompt-method'];
  delete input.scene;
  delete input.camera_position;
  delete input.pants;
  delete input.shoes;
  delete input.shirts;
  delete input.headwear;
  delete input.gaze_direction;
  delete input.pose;

  try {
    console.log('Generation started with input:', input);

    const output = await replicate.run(
      'lucataco/flux-dev-lora:613a21a57e8545532d2f4016a7c3cfa3c7c63fded03001c2e69183d557a929db',
      { input }
    );

    console.log('Generation completed with output:', output);

    res.json({ output });
  } catch (error) {
    console.error('Error during generation:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));