// Improved Logo Generation Frontend Code
// Replace the existing logo generation code in your HTML file

/* -------------------------------
   START: AI Logo Generator Logic (IMPROVED)
   ------------------------------- */

// DOM for logo generator
const brandInput = document.getElementById('brand-name');
const generateBtn = document.getElementById('generate-logo-btn');
const previewBox = document.getElementById('logo-preview');
const downloadSvgBtn = document.getElementById('download-svg');
const downloadPngBtn = document.getElementById('download-png');
const logoDescriptionInput = document.getElementById('logo-description-input');
const logoLoading = document.getElementById('logo-loading');

let lastImageData = ''; // Store the generated image data

generateBtn && generateBtn.addEventListener('click', async () => {
    const prompt = logoDescriptionInput.value.trim();
    const brandName = brandInput.value.trim() || 'Logo';

    if (!prompt) {
        alert('Please describe the logo you want to generate.');
        logoDescriptionInput.focus();
        logoDescriptionInput.classList.add('ring-2', 'ring-red-500');
        setTimeout(() => logoDescriptionInput.classList.remove('ring-2', 'ring-red-500'), 2000);
        return;
    }

    // Show loading state
    previewBox.innerHTML = '';
    previewBox.classList.add('hidden');
    logoLoading.classList.remove('hidden');
    downloadSvgBtn.disabled = true;
    downloadPngBtn.disabled = true;
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    try {
        console.log('Sending request to generate logo...');
        
        const response = await fetch('/.netlify/functions/generate-logo', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ prompt: `${brandName} logo: ${prompt}` }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            let errorMessage = 'Failed to generate logo';
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // If we can't parse JSON, use the raw text
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Received response data');

        if (!data.image) {
            throw new Error('No image data received from server');
        }

        lastImageData = data.image;

        // Render the AI-generated image
        previewBox.innerHTML = `
            <img style="width:100%;height:100%;object-fit:contain;border-radius:12px;" 
                 src="${lastImageData}" 
                 alt="${brandName} Logo Preview" 
                 onload="console.log('Image loaded successfully')"
                 onerror="console.error('Failed to load generated image'); this.style.display='none'; this.parentElement.innerHTML='<p class=\\'text-red-400 text-center text-xs p-2\\'>Failed to display logo</p>';" />
        `;

        console.log('Logo generated and displayed successfully');

    } catch (error) {
        console.error('Logo generation error:', error);
        
        let userMessage = 'Sorry, something went wrong while generating your logo.';
        
        if (error.message.includes('API key')) {
            userMessage = 'Service configuration issue. Please try again later.';
        } else if (error.message.includes('Failed to fetch')) {
            userMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.length < 100) {
            userMessage = error.message;
        }

        previewBox.innerHTML = `
            <div class="text-center p-4">
                <div class="text-red-400 text-sm mb-2">⚠️ Generation Failed</div>
                <p class="text-gray-400 text-xs">${userMessage}</p>
                <button class="mt-2 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-xs" onclick="location.reload()">
                    Refresh Page
                </button>
            </div>
        `;
    } finally {
        // Hide loading state and restore button
        logoLoading.classList.add('hidden');
        previewBox.classList.remove('hidden');
        downloadSvgBtn.disabled = false;
        downloadPngBtn.disabled = false;
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Logo';
    }
});

downloadSvgBtn && downloadSvgBtn.addEventListener('click', () => {
    alert('AI-generated logos are provided as PNG images. Use the PNG download button.');
});

downloadPngBtn && downloadPngBtn.addEventListener('click', () => {
    if (!lastImageData) {
        alert('Please generate a logo first.');
        return;
    }
    
    try {
        const brandName = (brandInput && brandInput.value) ? 
            brandInput.value.replace(/[^a-zA-Z0-9]/g, '_') : 'logo';
        
        const a = document.createElement('a');
        a.href = lastImageData;
        a.download = `${brandName}_logo.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        
        console.log('Download initiated');
    } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed. Please try right-clicking the image and selecting "Save image as..."');
    }
});

/* -------------------------------
   END: AI Logo Generator Logic (IMPROVED)
   ------------------------------- */