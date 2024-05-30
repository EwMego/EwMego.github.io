// src/ImageResizer.js

import React, { useState } from 'react';
import Resizer from 'react-image-file-resizer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const ImageResizer = () => {
    const [images, setImages] = useState([]);
    const [resizedImages, setResizedImages] = useState([]);
    const [width, setWidth] = useState(800);
    const [height, setHeight] = useState(600);

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        setImages(files);
    };

    const resizeImages = () => {
        const promises = images.map((image) => {
            const fileType = image.type.split('/')[1].toUpperCase();
            return new Promise((resolve) => {
                Resizer.imageFileResizer(
                    image,
                    width,
                    height,
                    fileType,
                    100,
                    0,
                    (uri) => {
                        resolve({ uri, fileType });
                    },
                    'blob'
                );
            });
        });

        Promise.all(promises).then((resized) => {
            setResizedImages(resized);
        });
    };

    const downloadZip = () => {
        const zip = new JSZip();
        resizedImages.forEach((image, index) => {
            const extension = images[index].name.split('.').pop();
            zip.file(`image_${index + 1}.${extension}`, image.uri);
        });

        zip.generateAsync({ type: 'blob' }).then((content) => {
            saveAs(content, 'resized_images.zip');
        });

        
    };

    return (
        <div>
            <h1>Image Resizer</h1>
            <div>
                <label htmlFor="image-upload">Upload Images:</label>
                <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>
            <div>
                <label>
                    Desired Width:
                    <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                    />
                </label>
                <label>
                    Desired Height:
                    <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                    />
                </label>
            </div>
            <button onClick={resizeImages}>Resize Images</button>
            <button onClick={downloadZip} disabled={resizedImages.length === 0}>
                Download as Zip
            </button>
        </div>
    );
};

export default ImageResizer;
