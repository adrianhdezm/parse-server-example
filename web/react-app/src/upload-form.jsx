import { useState } from "react";
import PropTypes from "prop-types";

export const UploadForm = ({ onFileUpload  }) => {
 
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileUpload(file);
    }
  };
 
  const handleUploadClick = () => {
    if (selectedFile) {
      // You can handle the file upload here, e.g., upload to a server
      console.log(`Uploading file: ${selectedFile.name}`);
    }
  };
 
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUploadClick} disabled={!selectedFile}>
        Upload
      </button>
    </div>
  );
 };
 
// PropTypes validation
UploadForm.propTypes = {
  onFileUpload: PropTypes.func.isRequired, // Ensure onLogin is a function and required
};
