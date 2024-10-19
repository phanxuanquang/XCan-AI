import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Typography,
  Grid,
  Container,
  Box,
  Backdrop,
  CircularProgress,
  Alert,
} from "@mui/material";
import { PhotoCamera, ContentCopy, Close, AutoFixHigh } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import "./App.css";

const App = () => {
  const [image, setImage] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [apiKey, setApiKey] = useState(""); // State for API key
  const [openApiKeyDialog, setOpenApiKeyDialog] = useState(true); // State to control the API key dialog
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(false); // Loading state for API key check
  const [isApiKeyChecked, setIsApiKeyChecked] = useState(false); // Track if API key has been checked

  // Sample image to display
  const sampleImage = "https://placehold.co/1600x400"; // Link to the sample image

  useEffect(() => {
    const checkMobileDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      if (/android|iphone|ipad|ipod/i.test(userAgent.toLowerCase())) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };
    checkMobileDevice();

    // Load API key from local storage
    const storedApiKey = localStorage.getItem("apiKey");
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setOpenApiKeyDialog(false); // Close dialog if API key is present
      setIsApiKeyChecked(true); // Mark API key as checked if it exists
    }
  }, []);

  const handleApiKeySubmit = async () => {
    if (apiKey) {
      setIsCheckingApiKey(true); // Start loading
      try {
        const response = await fetch(`https://abc.com/API/CheckApiKey/${apiKey}`);
        if (response.status === 200) {
          localStorage.setItem("apiKey", apiKey); // Save API key in local storage
          setOpenApiKeyDialog(false); // Close dialog
          setIsApiKeyChecked(true); // Mark API key as checked
        } else if (response.status === 401) {
          addAlert("Invalid API Key! Please enter a valid API Key."); // Show alert for invalid key
        } else {
          addAlert("An error occurred while checking the API Key."); // General error alert
        }
      } catch (error) {
        console.error("Error checking API key:", error);
        addAlert("An error occurred while checking the API Key."); // Handle fetch error
      } finally {
        setIsCheckingApiKey(false); // Stop loading
      }
    } else {
      addAlert("Please enter a valid API key!");
    }
  };

  const handleGetApiKey = () => {
    window.open("https://aistudio.google.com/app/apikey", "_blank"); // Open the link in a new tab
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (image) {
      setLoading(true);
      try {
        const response = await fetch("https://abc.com/API/ocr", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`, // Include the API key in headers
          },
          body: JSON.stringify({ image: image }),
        });

        const result = await response.json();
        setOcrResult(result.text);
        setOpenDialog(true);
      } catch (error) {
        console.error("Error sending image:", error);
        addAlert("An error occurred while sending the image.");
      } finally {
        setLoading(false);
      }
    } else {
      addAlert("Please upload or capture an image!");
    }
  };

  const addAlert = (message) => {
    const newAlert = { id: Date.now(), message };

    setAlerts((prevAlerts) => {
      if (prevAlerts.length >= 5) {
        const alertsAfterRemoval = prevAlerts.slice(1);
        return [...alertsAfterRemoval, newAlert];
      }
      return [...prevAlerts, newAlert];
    });

    setTimeout(() => {
      removeAlert(newAlert.id);
    }, 5000);
  };

  const removeAlert = (id) => {
    setAlerts((prevAlerts) => {
      const alertToRemove = prevAlerts.find(alert => alert.id === id);
      if (alertToRemove) {
        alertToRemove.fadeOut = true; // Add fade-out class
        // Use setTimeout to remove alert after fade-out effect is complete
        setTimeout(() => {
          setAlerts(prevAlerts.filter(alert => alert.id !== id));
        }, 500); // Fade-out duration is 0.5s
      }
      return prevAlerts;
    });
  };

  const handlePasteImage = (event) => {
    const clipboardItems = event.clipboardData.items;
    for (let i = 0; i < clipboardItems.length; i++) {
      const item = clipboardItems[i];
      if (item.type.includes("image")) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  useEffect(() => {
    if (!isMobile) {
      window.addEventListener("paste", handlePasteImage);
    }
    return () => {
      if (!isMobile) {
        window.removeEventListener("paste", handlePasteImage);
      }
    };
  }, [isMobile]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(ocrResult);
    addAlert("Copied to clipboard!");
  };

  const handleCloseApiKeyDialog = () => {
    if (!isApiKeyChecked) {
      addAlert("Please check the API key before closing!"); // Alert if trying to close without API key checked
    } else {
      setOpenApiKeyDialog(false);
    }
  };

  return (
    <div className="container">
      {/* API Key Dialog */}
      <Dialog open={openApiKeyDialog} onClose={handleCloseApiKeyDialog}>
        <DialogTitle>Enter API Key</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <TextField
                autoFocus
                margin="dense"
                label="API Key"
                type="text"
                fullWidth
                variant="standard" // Changed variant to 'standard'
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </Grid>
            <Grid item>
              <Button
                variant="outlined" // Outlined variant for button
                onClick={handleGetApiKey}
                style={{ height: '56px' }} // Height should match TextField
              >
                Get API Key
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleApiKeySubmit} color="primary" disabled={!apiKey || isCheckingApiKey}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Display all alerts here */}
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          severity="error"
          onClose={() => removeAlert(alert.id)}
          className="alert-animation"
          style={{
            position: "fixed",
            top: 20 + alerts.indexOf(alert) * 60,
            right: 20,
            zIndex: 1000,
            width: "300px",
            backgroundColor: "#ffebee",
            color: "#d32f2f",
            border: "none",
            boxShadow: "none",
          }}
        >
          {alert.message}
        </Alert>
      ))}

      {/* Main Content */}
      <Container className="main">
        <Grid container justifyContent="center">
          {/* Title Box */}
          <Grid item xs={12} style={{ marginBottom: '20px', textAlign: 'center' }}>
            <Box
              sx={{
                backgroundColor: '#3f51b5',
                color: 'white',
                borderRadius: '10px',
                padding: '10px',
                border: 'none',
              }}
            >
              <Typography variant="h4" style={{ fontWeight: 'bold' }}>
                XCan AI
              </Typography>
            </Box>
          </Grid>

          {/* Main Container */}
          <Grid item xs={12} sm={8} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={12} style={{ textAlign: "center" }}>
                {!image && (
                  <div>
                    <input
                      accept="image/*"
                      id="file-upload"
                      type="file"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload">
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PhotoCamera />}
                        style={{
                          border: 'none', // Flat style
                          boxShadow: 'none', // Flat style
                        }}
                      >
                        Capture Image with Camera
                      </Button>
                    </label>
                  </div>
                )}
              </Grid>

              <Grid item xs={12} style={{ textAlign: "center" }}>
                <Box
                  style={{
                    border: '2px dashed #ccc',
                    borderRadius: '10px',
                    padding: '10px',
                    width: '320px',
                    height: '240px',
                    marginTop: '20px',
                    position: 'relative',
                  }}
                >
                  {image ? (
                    <img
                      src={image}
                      alt="Uploaded"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        borderRadius: "10px",
                      }}
                    />
                  ) : (
                    <img
                      src={sampleImage}
                      alt="Sample"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        borderRadius: "10px",
                      }}
                    />
                  )}
                </Box>
              </Grid>

              {image && (
                <Grid item xs={12} style={{ textAlign: "center", marginTop: "20px" }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AutoFixHigh />}
                    onClick={handleSubmit}
                    style={{
                      border: 'none', // Flat style
                      boxShadow: 'none', // Flat style
                    }}
                  >
                    Scan Now
                  </Button>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>

        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>OCR Result</DialogTitle>
          <DialogContent>
            <ReactMarkdown>{ocrResult}</ReactMarkdown>
          </DialogContent>
          <DialogActions>
            <IconButton onClick={handleCopyToClipboard} color="primary">
              <ContentCopy />
            </IconButton>
            <IconButton onClick={() => setOpenDialog(false)} color="secondary">
              <Close />
            </IconButton>
          </DialogActions>
        </Dialog>
      </Container>

      <Backdrop open={loading || isCheckingApiKey} style={{ zIndex: 1200 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
};

export default App;
