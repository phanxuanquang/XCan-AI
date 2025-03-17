# © 2024 Phan Xuan Quang / XCan AI
------------
XCan AI is a powerful tool designed to simplify the extraction of text from images. It can handle various types of content, including tables, code, mathematical formulas, and more. Additionally, it can translate the extracted text into Vietnamese while preserving the original format.

The users just input the image by pasting (`Ctrl + V`) or select the image from the local device, then the AI handles the rest to provide the text in the image if any. In addition, the tool can help to translate the text in the image into Vietnamese without changing the text format.

## Features

![Image](https://i.imgur.com/xXga9lT.png)

- **Text Extraction**: Extracts text from images with high fidelity, maintaining the original layout and formatting.
- **Translation**: Translates extracted text into Vietnamese without altering the format.
- **Support for Various Formats**: Handles tables, code snippets, mathematical formulas, and more.
- **User-Friendly Interface**: Allows users to input images by pasting, selecting from the local device, or taking a photo.

## Getting Started

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (for the web frontend)
- [Visual Studio](https://visualstudio.microsoft.com/) or [Visual Studio Code](https://code.visualstudio.com/)

### Installation

1. **Clone the repository**:
    ```sh
    git clone https://github.com/phanxuanquang/XCan-AI.git
    cd XCan-AI
    ```

2. **Backend Setup**:
- In Visual Studio Code: 
    - Navigate to the `XCan.Api` directory:
        ```sh
        cd XCan.Api
        ```
    - Restore the .NET dependencies:
        ```sh
        dotnet restore
        ```
    - Build the project:
        ```sh
        dotnet build
        ```
- In Visual Studio:
    - Build the project `XCan.Api`.
3. **Frontend Setup**:
    - Navigate to the `xcan.web` directory:
        ```sh
        cd ../xcan.web
        ```
    - Install the Node.js dependencies:
        ```sh
        npm install
        ```

### Running the Application

1. **Start the Backend**:
    - Navigate to the `XCan.Api` directory:
        ```sh
        cd ../XCan.Api
        ```
    - Run the application:
        ```sh
        dotnet run
        ```

2. **Start the Frontend**:
    - Navigate to the `xcan.web` directory:
        ```sh
        cd ../xcan.web
        ```
    - Run the application:
        ```sh
        npm start
        ```
    - Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Usage

1. **Gemini API Key**: Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and enter it in the application.
2. **Upload Image**: Paste, drag & drop, or select an image from your local device.
3. **Extract Text**: Click the "Scan" button to extract text from the image.
4. **Translate Text**: Click the "Translate" button to translate the extracted text into Vietnamese.

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**.
2. **Create a new branch**:
    ```sh
    git checkout -b feature/your-feature-name
    ```
3. **Make your changes**.
4. **Commit your changes**:
    ```sh
    git commit -m "Add your commit message"
    ```
5. **Push to the branch**:
    ```sh
    git push origin feature/your-feature-name
    ```
6. **Create a Pull Request**.


## Contact

For any questions or feedback, please open an **Issue** or **Discussion** in this repository.
