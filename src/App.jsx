import Resizer from 'react-image-file-resizer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useId, useState } from 'react';

let nextId = 1;

function get_image_dimesions(image_file) {
  return new Promise(function (res) {
    const img = new Image();
    img.onload = function () {
      res({ width: img.width, height: img.height });
    };

    img.src = URL.createObjectURL(image_file);
  });
}

function App() {
  const [file, setFile] = useState([]);
  const [msg, setMessage] = useState('');
  const [is_error, setError] = useState(false);
  const [resizedImages, setResizedImages] = useState([]);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);

  async function upload_handler(event) {
    const files = Array.from(event.target.files);

    let completed = true;
    var outputMessage = ''

    const updatedFiles = await Promise.all(
      files.map(async (image) => {
        const fileType = image.type.split('/')[1].toUpperCase();
        const dimensions = await get_image_dimesions(image);
        const imageExists = file.some(existingImage => existingImage.data.name === image.name);
        if (!imageExists) {
          return {
            id: nextId++,
            data: image,
            type: fileType,
            size: `${dimensions.width}x${dimensions.height}`,
            preview: URL.createObjectURL(image),
          };
        } else {
          setError(true);
          outputMessage += image.name + ' :'
         
          completed = false;
        }
      })
    );

    if (completed) {
      setError(false);
      const newFiles = [...file, ...updatedFiles.filter(image => image !== null)];
      newFiles.sort((a, b) => a.id - b.id); // Sort the files array to ensure the image with id 1 is at the top
      setFile(newFiles);
      setMessage('Upload successful.');

      
    } else{
      setMessage('Upload canceled => (' + outputMessage  + ") is already added.");
    }

    // Reset the input value
    event.target.value = '';
  }

  function deleteImage(id) {
    nextId -= 1;
    setFile(prevFiles => prevFiles.filter(image => image.id !== id));
  }

  async function resize_image() {
    const prom = file.map(async (image) => {
      const fileType = image.type;
      const name = image.data.name;
      return new Promise(function(resolve) {
        Resizer.imageFileResizer(
          image.data,
          width,
          height,
          fileType,
          100,
          0,
          (uri) => {
            resolve({ uri, fileType, name });
          },
          'blob'
        );
      });
    });

    const resized = await Promise.all(prom);
    setResizedImages(resized);
    return resized;
  }

  async function export_files() {
    const resized = await resize_image();
   
    const zip = new JSZip();

    resized.forEach(function(image, index) {
      const extension = image.name.split('.');

      zip.file(`${extension[0]}_${width}x${height}.${extension.pop()}`, image.uri);
    });

    setMessage('Sending Download.')

    zip.generateAsync({ type: 'blob' }).then(function(content) {
      saveAs(content, `ImageResizer_${file.length}_${width}x${height}.zip`);
      setFile([])
      setMessage('Export Successful.')

      setTimeout(() => {
        setMessage('')
      }, 2000);
    });
  }

  return (
    <>
      <div className="navbar bg-base-100">
       <div className="navbar-start">
        <div className='flex-1'>
            <label className="btn btn-ghost text-xl" onClick={() => window.location.reload()}>Image Resizer</label>
          </div>
         
       </div>

       <div className="navbar-center">
       <label className="input input-bordered flex items-center gap-2">
        Width & Height
        <input type="number" placeholder="Width & Height" value={width} onChange={function(prev){
           setHeight(prev.target.value)
           setWidth(prev.target.value)
        }}/>
        </label>

       </div>

       <div className="navbar-end">
        <div className='flex-none'>
              <button className="btn btn-square btn-ghost" onClick={file.length > 0 ? export_files : ()=>{}} >
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
                  <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/>
                </svg>
              </button>
            </div>
       </div>
      </div>

      <div className="overflow-x-auto flex justify-center items-center flex-wrap mt-5">
        <table className="table table-pin-rows table-pin-cols flex justify-center">
          {file.length > 0 && (
            <thead>
              <tr>
                <th></th>
                <th>Preview</th>
                <th>Name</th>
                <th>Resolution</th>
                <th>File Type</th>
                <th></th>
              </tr>
            </thead>
          )}
          <tbody>
            {file.map(image => (
              <tr className='select-none' key={image.data.name}>
                <th key={image.data.name + '_id'}>{image.id}</th>
                <th key={image.data.name + '_2d'}>
                  <img src={image.preview} alt={image.data.name} style={{ width: '100px', height: 'auto' }} />
                </th>
                <td key={image.data.name + '_name'}>{image.data.name}</td>
                <td key={image.data.name + '_size'}>{image.size}</td>
                <td key={image.data.name + '_type'}>{image.type}</td>
                <td key={image.data.name + '_delete'}>
                  <button className="btn btn-error" onClick={() => document.getElementById(`modal_${image.id}`).showModal()}>Remove</button>
                  <dialog id={`modal_${image.id}`} className="modal">
                    <div className="modal-box">
                      <h3 className="font-bold text-lg">Warning</h3>
                      <p className="py-4">Are you sure you want to remove?</p>
                      <div className="modal-action">
                        <form method="dialog" className='space-x-3'>
                          <button type="button" className='btn btn-accent' onClick={() => deleteImage(image.id)}>Remove</button>
                          <button type="button" className="btn btn-error" onClick={() => document.getElementById(`modal_${image.id}`).close()}>Cancel</button>
                        </form>
                      </div>
                    </div>
                  </dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col items-center mt-10">
          <label htmlFor="files" className='btn'>Upload Image</label>
          <input id='files' type="file" accept="image/*" multiple hidden onChange={upload_handler} />
          {!is_error ? <span className='text-green-600 mt-5'>{msg}</span> : <span className='text-red-600 mt-5'>{msg}</span>}
        </div>
      </div>
    </>
  );
}

export default App;
