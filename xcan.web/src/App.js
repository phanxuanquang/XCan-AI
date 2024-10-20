import React, { useState, useEffect } from "react";
import {
  Backdrop,
  CircularProgress,
  Snackbar,
  IconButton,
  Container,
  Grid,
  Typography,
  Link,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import ApiKeyDialog from "./components/ApiKeyDialog";
import InputSection from "./components/InputSection";
import ResultDisplay from "./components/ResultDisplay";
import "./App.css";

//const domain = process.env.REACT_APP_API_URL;
const domain = "https://localhost:7283";

const App = () => {
  const [image, setImage] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [openApiKeyDialog, setOpenApiKeyDialog] = useState(true);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });
  const [apiKey, setApiKey] = useState("");
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(false);
  const [isApiKeyChecked, setIsApiKeyChecked] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const storedApiKey = localStorage.getItem("apiKey");
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setOpenApiKeyDialog(false);
      setIsApiKeyChecked(true);
    }
  }, []);

  const handleApiKeySubmit = async () => {
    if (apiKey) {
      setIsCheckingApiKey(true);
      try {
        const response = await fetch(
          `${domain}/Main/ValidateApiKey?apiKey=${apiKey}`
        );
        if (response.status === 200) {
          localStorage.setItem("apiKey", apiKey);
          setOpenApiKeyDialog(false);
          setIsApiKeyChecked(true);
        } else if (response.status === 401) {
          showSnackbar(await response.text(), "error");
        } else {
          showSnackbar(
            "An error occurred while validating the API Key.",
            "error"
          );
        }
      } catch (error) {
        showSnackbar(
          "An error occurred while validating the API Key.",
          "error"
        );
      } finally {
        setIsCheckingApiKey(false);
      }
    } else {
      showSnackbar("Please enter a valid API key!", "error");
    }
  };

  const handleSubmit = async () => {
    if (image) {
      setLoading(true);
      try {
        const apiResponse = await fetch(
          `${domain}/Main/ExtractTextFromImage?apiKey=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: `"${image}"`,
          }
        );

        const data = await apiResponse.text();

        if (!apiResponse.ok) {
          throw new Error(data);
        }

        setOcrResult(data);
        setExpanded(false);
      } catch (error) {
        showSnackbar(error, "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(ocrResult);
    showSnackbar("Copied to clipboard!", "success");
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div className="App">
      <Container
        style={{
          paddingTop: 30,
          paddingBottom: 30,
        }}
      >
        <Grid
          container
          style={{
            background: "white",
            paddingTop: 12,
            paddingBottom: 12,
            marginBottom: 10,
            borderRadius: 5,
            textAlign: "center",
          }}
        >
          <Grid item xs={12}>
            <Typography
              variant="h2"
              gutterBottom
              margin={0}
              style={{
                textDecoration: "none",
                fontWeight: "bold",
                background: "linear-gradient(45deg, #f705cb, #05f7f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
              }}
            >
              XCan AI
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body1" gutterBottom margin={0}>
              Find the project on my{" "}
              <Link
                href="https://github.com/phanxuanquang/XCan-AI"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                GitHub repository
              </Link>
              .
            </Typography>
          </Grid>
        </Grid>

        <ApiKeyDialog
          open={openApiKeyDialog}
          onClose={() => setOpenApiKeyDialog(false)}
          apiKey={apiKey}
          setApiKey={setApiKey}
          onSubmit={handleApiKeySubmit}
          isCheckingApiKey={isCheckingApiKey}
          isApiKeyChecked={isApiKeyChecked}
        />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <InputSection
              image={image}
              setImage={setImage}
              handleFileUpload={handleFileUpload}
              handleSubmit={handleSubmit}
              expanded={expanded}
              setExpanded={setExpanded}
            />
            {ocrResult && (
              <ResultDisplay
                ocrResult={ocrResult}
                handleCopyToClipboard={handleCopyToClipboard}
                handleOcrAgain={handleSubmit}
              />
            )}
          </Grid>
        </Grid>
      </Container>

      <Backdrop open={loading || isCheckingApiKey} style={{ zIndex: 1200 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={1500}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <Close fontSize="small" />
          </IconButton>
        }
        severity={snackbar.severity}
      />
    </div>
  );
};

export default App;
