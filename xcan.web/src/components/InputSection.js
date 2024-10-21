import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  Button,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import { PhotoCamera, AutoFixHigh, ExpandMore } from "@mui/icons-material";

const InputSection = ({
  image,
  setImage,
  handleFileUpload,
  handleSubmit,
  expanded,
  setExpanded,
  ocrResult,
}) => {
  const sampleImage = "https://i.imgur.com/jHKXjqD.jpeg";
  const uploadBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePaste = (event) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          setImage(event.target.result);
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  return (
    <Accordion
      expanded={ocrResult ? true : expanded}
      onChange={ocrResult ? null : () => setExpanded(!expanded)}
      style={{
        borderRadius: 5,
        boxShadow: "none",
      }}
    >
      <AccordionSummary expandIcon={!ocrResult && <ExpandMore />}>
        <Typography style={{ fontWeight: "bold" }}>Get Started</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} style={{ textAlign: "center" }}>
            <Box
              ref={uploadBoxRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleImageClick}
              style={{
                border: isDragging ? "2px solid #00f" : "2px dashed #ccc",
                borderRadius: 10,
                padding: 5,
                width: "95%",
                height: "30rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                margin: "0 auto",
                position: "relative",
                backgroundColor: isDragging ? "#e3f2fd" : "transparent",
                cursor: image ? "pointer" : "default",
              }}
            >
              {image ? (
                <img
                  src={image}
                  alt="Uploaded"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 6,
                  }}
                />
              ) : (
                <img
                  src={sampleImage}
                  alt="Sample"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 6,
                  }}
                />
              )}
            </Box>
            <Typography
              variant="caption"
              display="block"
              gutterBottom
              style={{
                marginTop: 5,
              }}
            >
              You can click, paste, drag & drop an image, or take a photo
            </Typography>{" "}
            <input
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
            />
          </Grid>

          {!image && (
            <Grid item xs={12} style={{ textAlign: "center" }}>
              <label htmlFor="file-upload">
                <Button
                  variant="contained"
                  color="primary"
                  component="span"
                  startIcon={<PhotoCamera />}
                  style={{
                    border: "none",
                    boxShadow: "none",
                  }}
                >
                  Take a Photo
                </Button>
              </label>
            </Grid>
          )}

          {image && (
            <Grid
              item
              xs={12}
              style={{ textAlign: "center", padding: 0, paddingLeft: 10 }}
            >
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AutoFixHigh />}
                onClick={handleSubmit}
                style={{
                  border: "none",
                  boxShadow: "none",
                  marginTop: 10,
                  background: "linear-gradient(45deg, #9e05f7, #f705cb)",
                  color: "white",
                  transition: "background 0.5s ease, transform 0.5s ease",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
                size="large"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Scan
              </Button>
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default InputSection;
