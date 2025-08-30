# Child LLM Safe Guard Chrome Extention

A Chrome extension that helps protect children from inappropriate content by automatically filtering and blurring potentially unsafe content in real-time. The extension offers both local machine learning and GPT-based content filtering options.

## Features

- **Dual-Mode Filtering**:
  - **Local Model**: Fast, offline content filtering using a pre-trained neural network
  - **GPT-4 Integration**: Advanced content analysis using OpenAI's GPT-4 (requires API key)

- **Real-time Protection**:
  - Monitors web pages for new content
  - Automatically blurs potentially unsafe content
  - Preserves the ability to select and read blurred text

- **User-Friendly Interface**:
  - Simple toggle between local and GPT filtering
  - Easy API key management
  - Visual indicators for blocked content

- **Privacy Focused**:
  - Local processing option keeps all data on your device
  - Clear visual distinction between safe and filtered content

## Installation

1. Clone this repository
   ```bash
   git clone https://github.com/ohdoking/child-llm-safe-chrome-extention
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in the top-right corner)

4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar

2. Choose your preferred filtering method:
   - **Local Model**: For fast, offline filtering (no API key required)
   - **GPT-4**: For advanced content analysis (requires OpenAI API key)

3. If using GPT-4, enter your OpenAI API key and click "Save"

4. The extension will automatically filter content on supported websites

## Supported Websites

- ChatGPT (chatgpt.com)
- Google Gemini (gemini.google.com)

## Development

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Building the Extension

1. Install dependencies:
   ```bash
   cd child-safe-model-train
   npm install
   ```

2. Train the local model (optional):
   ```bash
   node train_brain_model.js
   ```
   or for LSTM model:
   ```bash
   node train_brain_model_lstm.js
   ```

3. The trained model will be saved in the `model/` directory

## How It Works

The extension uses two approaches to filter content:

1. **Local Model**:
   - Uses a pre-trained neural network (Brain.js)
   - Processes text locally in the browser
   - No external API calls required
   - Fast but less accurate than GPT-4

2. **GPT-4 Integration**:
   - Sends content to OpenAI's API for analysis
   - More accurate filtering
   - Requires an API key
   - Internet connection required

## Customization

You can train your own model by modifying the training data in `child-safe-model-train/train_data.json` and running the training script.

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For support, please open an issue in the repository.
