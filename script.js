document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const imageSrc = event.target.result;

        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            processImage(img);
        };
    };

    reader.readAsDataURL(file);
});

function processImage(img) {
    const canvas = document.getElementById('processedImageCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the original image on the canvas
    ctx.drawImage(img, 0, 0, img.width, img.height);
    document.getElementById('originalImage').src = img.src;

    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Apply grayscale conversion
    applyGrayscale(imageData, ctx);

    // Apply edge detection (Sobel Filter)
    const sobelData = sobelFilter(ctx, imageData);

    // Analyze histogram and detect abnormalities
    const histogram = analyzeHistogram(imageData);
    const abnormalities = detectAbnormalities(imageData, histogram);

    // Display result and analysis
    const diagnosisElement = document.getElementById('diagnosis');
    if (abnormalities > 10000) {  // Adjust threshold based on testing
        diagnosisElement.textContent = "Possible abnormalities detected. Consult a professional.";
    } else {
        diagnosisElement.textContent = "No significant abnormalities detected.";
    }

    document.getElementById('result').classList.remove('hidden');
}

function applyGrayscale(imageData, ctx) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const gray = 0.3 * red + 0.59 * green + 0.11 * blue;
        data[i] = data[i + 1] = data[i + 2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);
}

function sobelFilter(ctx, imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const sobelData = ctx.createImageData(width, height);
    const sobelResult = sobel(data, width, height);

    for (let i = 0; i < sobelResult.length; i++) {
        const value = sobelResult[i];
        const intensity = Math.min(value, 255);  // Ensure intensity is within valid range
        sobelData.data[i * 4] = intensity;
        sobelData.data[i * 4 + 1] = intensity;
        sobelData.data[i * 4 + 2] = intensity;
        sobelData.data[i * 4 + 3] = 255;
    }

    return sobelData;
}

function sobel(data, width, height) {
    const kernelX = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
    ];
    const kernelY = [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1]
    ];

    const grayscale = [];
    for (let i = 0; i < data.length; i += 4) {
        grayscale.push(data[i]);
    }

    const sobelData = [];
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const pixelX = (
                kernelX[0][0] * grayscale[(y - 1) * width + (x - 1)] +
                kernelX[0][1] * grayscale[(y - 1) * width + x] +
                kernelX[0][2] * grayscale[(y - 1) * width + (x + 1)] +
                kernelX[1][0] * grayscale[y * width + (x - 1)] +
                kernelX[1][1] * grayscale[y * width + x] +
                kernelX[1][2] * grayscale[y * width + (x + 1)] +
                kernelX[2][0] * grayscale[(y + 1) * width + (x - 1)] +
                kernelX[2][1] * grayscale[(y + 1) * width + x] +
                kernelX[2][2] * grayscale[(y + 1) * width + (x + 1)]
            );

            const pixelY = (
                kernelY[0][0] * grayscale[(y - 1) * width + (x - 1)] +
                kernelY[0][1] * grayscale[(y - 1) * width + x] +
                kernelY[0][2] * grayscale[(y - 1) * width + (x + 1)] +
                kernelY[1][0] * grayscale[y * width + (x - 1)] +
                kernelY[1][1] * grayscale[y * width + x] +
                kernelY[1][2] * grayscale[y * width + (x + 1)] +
                kernelY[2][0] * grayscale[(y + 1) * width + (x - 1)] +
                kernelY[2][1] * grayscale[(y + 1) * width + x] +
                kernelY[2][2] * grayscale[(y + 1) * width + (x + 1)]
            );

            const magnitude = Math.sqrt((pixelX * pixelX) + (pixelY * pixelY)) >>> 0;
            sobelData.push(magnitude);
        }
    }

    return sobelData;
}

function analyzeHistogram(imageData) {
    const data = imageData.data;
    const histogram = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
        const grayValue = data[i];
        histogram[grayValue]++;
    }

    // Example of focusing on specific intensity ranges
    const abnormalRange = histogram.slice(0, 50).reduce((a, b) => a + b, 0);
    return abnormalRange;
}

function detectAbnormalities(imageData, histogram) {
    const data = imageData.data;
    let edgeAbnormalities = 0;
    let intensityAbnormalities = histogram;  // Already calculated from histogram analysis

    // Define new thresholds based on improved understanding
    const edgeThreshold = 100;  // Adjust based on testing
    const intensityThreshold = 500;  // Adjust based on testing

    // Count edge-based abnormalities
    for (let i = 0; i < data.length; i += 4) {
        const intensity = data[i];
        if (intensity > edgeThreshold) {
            edgeAbnormalities++;
        }
    }

    // Combine results for final assessment
    const totalAbnormalities = edgeAbnormalities + intensityAbnormalities;
    return totalAbnormalities;
}
