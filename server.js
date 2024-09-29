const express = require('express');
const app = express();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const sharp = require('sharp');
const Replicate = require('replicate');

require('dotenv').config();

// Add these lines to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

console.log('API Token loaded:', !!process.env.REPLICATE_API_TOKEN);

app.use(express.static('public'));
app.use('/training_files', express.static('training_files'));

app.post('/generate', upload.none(), async (req, res) => {
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
  } else if (input['prompt-method'] === 'visual') {
    // Build prompt from visual selections
    if (input.clothing) {
      promptParts.push(input.clothing);
    }
    if (input.location) {
      promptParts.push(input.location);
    }
  } else if (input['prompt-method'] === 'overige') {
    // Use the selected overige prompt
    if (input.prompt) {
      promptParts.push(input.prompt);
    }
  } else {
    // Use manual prompt
    if (input.prompt) {
      promptParts.push(input.prompt);
    }
  }

  // Construct the final prompt
  input.prompt = promptParts.join(', ');

  // Remove 'prompt-method' and unnecessary inputs before sending to Replicate
  delete input['prompt-method'];
  delete input.scene;
  delete input.camera_position;
  delete input.pants;
  delete input.shoes;
  delete input.shirts;
  delete input.headwear;
  delete input.gaze_direction;
  delete input.pose;
  delete input.clothing;
  delete input.location;
  delete input['overige-input-1'];
  delete input['overige-input-2'];
  delete input['overige-input-3'];

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

// Route to handle training
app.post('/train', upload.array('images'), async (req, res) => {
  try {
    const trigger_word = req.body.trigger_word || 'TOK';
    const sanitizedTriggerWord = trigger_word.replace(/\s+/g, '-').toLowerCase();

    const trainingId = Date.now().toString();
    const processedDir = path.join(__dirname, 'training_files', trainingId);
    fs.mkdirSync(processedDir, { recursive: true });

    // Process images
    const processImagePromises = req.files.map(async (file) => {
      const outputFileName = `a_photo_of_${sanitizedTriggerWord}.png`;
      const outputFilePath = path.join(processedDir, outputFileName);

      try {
        // Read the uploaded file into a buffer
        const imageBuffer = fs.readFileSync(file.path);

        // Process the image buffer with sharp
        const processedImageBuffer = await sharp(imageBuffer)
          .png()
          .toBuffer();

        // Write the processed image buffer to the output file
        fs.writeFileSync(outputFilePath, processedImageBuffer);

        // Delete the original uploaded file after processing is complete
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Error processing file:', file.path, err);
        throw err;
      }
    });

    // Wait for all image processing to complete
    await Promise.all(processImagePromises);

    // Create zip file
    const zipFileName = `training_images_${trainingId}.zip`;
    const zipPath = path.join(processedDir, zipFileName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    const files = fs.readdirSync(processedDir);
    files.forEach((file) => {
      if (file !== zipFileName) {
        archive.file(path.join(processedDir, file), { name: file });
      }
    });

    await archive.finalize();

    // Create a new model without the 'owner' field
    const model = await replicate.models.create({
      name: `flux-${sanitizedTriggerWord}`,
      visibility: "public",
      hardware: "gpu-t4",
      description: `A fine-tuned FLUX.1 model for ${sanitizedTriggerWord}`
    });

    console.log(`Model created: ${model.name}`);
    console.log(`Model URL: https://replicate.com/${model.owner}/${model.name}`);

    // Start the training
    const training = await replicate.trainings.create({
      version: "ostris/flux-dev-lora-trainer:4ffd32160efd92e956d39c5338a9b8fbafca58e03f791f6d8011f3e20e8ea6fa",
      input: {
        input_images: fs.createReadStream(zipPath),
        steps: 1000,
      },
      destination: `${model.owner}/${model.name}`
    });

    console.log(`Training started: ${training.status}`);
    console.log(`Training URL: https://replicate.com/p/${training.id}`);

    res.json({ 
      training_id: training.id,
      model_name: model.name,
      model_url: `https://replicate.com/${model.owner}/${model.name}`,
      training_url: `https://replicate.com/p/${training.id}`
    });
  } catch (error) {
    console.error('Error processing images:', error);
    res.status(500).json({ error: 'An error occurred while starting the training.' });
  }
});

// Add this route to server.js to get the training status
app.get('/training-status/:id', async (req, res) => {
  const trainingId = req.params.id;
  try {
    const training = await replicate.trainings.get(trainingId);
    res.json({ status: training.status });
  } catch (error) {
    console.error('Error fetching training status:', error);
    res.status(500).json({ error: 'An error occurred while fetching training status.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));