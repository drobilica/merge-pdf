const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const progressBar = document.getElementById('progress-bar');
const feedback = document.getElementById('feedback');
const filenameInput = document.getElementById('filename-input');
const debouncedUpdateProgressBar = debounce(updateProgressBar, 100);

uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFiles);
uploadArea.addEventListener('dragover', (event) => event.preventDefault());
uploadArea.addEventListener('drop', (event) => {
    event.preventDefault();
    fileInput.files = event.dataTransfer.files;
    handleFiles();
});

function validateFiles(files) {
    if (!files.every(file => file.type === 'application/pdf')) {
        feedback.textContent = 'Please upload only PDF files.';
        console.log('Invalid file type detected. Only PDF files are allowed.');
        return false;
    }
    feedback.textContent = '';
    return true;
}

async function handleFiles() {
    console.log('Handling files...');
    const files = Array.from(fileInput.files);
    if (!validateFiles(files)) {
        console.log('Validation failed: Non-PDF files included.');
        return;
    }

    setUIForProcessing(true);
    feedback.textContent = 'Merging...';

    try {
        const mergedPdfBytes = await mergeFiles(files);
        console.log('Merging completed, starting download...');
        const customFilename = getCustomFilename();
        download(mergedPdfBytes, `${customFilename}.pdf`, "application/pdf");
        feedback.textContent = 'Merge completed! Downloading...';
    } catch (error) {
        console.error('Error during file handling: ', error);
        feedback.textContent = 'An error occurred: ' + error.message;
    } finally {
        setUIForProcessing(false);
        console.log('File handling process completed.');
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}


async function mergeFiles(files) {
    console.log('Starting merge of files...');
    const mergedPdf = await PDFLib.PDFDocument.create();
    const fileFeedback = document.getElementById('file-feedback');
    fileFeedback.innerHTML = ''; // Clear existing feedback

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const listItem = document.createElement('div');
        listItem.className = 'item';
        listItem.textContent = `Processing file: ${file.name}`;
        fileFeedback.appendChild(listItem);

        try {
            const fileBytes = await file.arrayBuffer();
            const pdf = await PDFLib.PDFDocument.load(fileBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
            listItem.textContent = `Successfully processed: ${file.name}`;
            debouncedUpdateProgressBar(i, files.length); // Use debounced function here
        } catch (error) {
            listItem.textContent = `Error processing ${file.name}: ${error.message}`;
            listItem.style.color = 'red';
            console.error(`Error processing file ${file.name}: `, error);
        }
    }

    console.log('Merge operation completed.');
    return mergedPdf.save();
}

function updateProgressBar(current, total) {
    progressBar.style.width = `${(current + 1) / total * 100}%`;
}

function getCustomFilename() {
    return filenameInput.value.trim() || 'merged';
}

function download(blob, filename, mimeType) {
    if (!blob || blob.size === 0) {
        console.error('Download failed: No data available.');
        feedback.textContent = 'Download failed: Merged file is empty.';
        return;
    }

    try {
        console.log('Initiating download...');
        const blobUrl = URL.createObjectURL(new Blob([blob], { type: mimeType }));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        console.log('Download initiated for ', filename);
    } catch (error) {
        console.error('Error during download: ', error);
        feedback.textContent = 'An error occurred during download.';
    }
}

function setUIForProcessing(isProcessing) {
    uploadArea.disabled = isProcessing;
    progressBar.style.display = isProcessing ? 'block' : 'none';
    progressBar.style.width = '0%';
    if (!isProcessing) fileInput.value = '';
}
