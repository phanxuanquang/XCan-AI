// src/components/ApiKeyDialog.js
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Grid,
  Snackbar,
} from "@mui/material";
import { Close } from "@mui/icons-material";

const ApiKeyDialog = ({
  open,
  onClose,
  apiKey,
  setApiKey,
  onSubmit,
  isCheckingApiKey,
  isApiKeyChecked,
}) => {
  const handleClose = () => {
    if (!apiKey) {
      showSnackbar("Enter your API key to continue!", "error");
    } else if (!isApiKeyChecked) {
      showSnackbar("Validate your API key to continue!", "error");
    } else {
      onClose();
    }
  };
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  const handleGetApiKey = () => {
    window.open("https://aistudio.google.com/app/apikey", "_blank");
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle variant="h6" style={{ paddingBottom: 10 }}>
          Enter Gemini API Key
        </DialogTitle>
        <DialogContent tyle={{ paddingBottom: 0 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <TextField
                autoFocus
                margin="dense"
                placeholder="AIza . . ."
                type="text"
                fullWidth
                variant="standard"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleGetApiKey}
                style={{ height: "2.5rem" }}
              >
                Get API Key
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions style={{ justifyContent: "center", paddingBottom: 20 }}>
          <Button
            onClick={onSubmit}
            color="secondary"
            variant="contained"
            disabled={!apiKey || isCheckingApiKey}
            style={{ border: "none", boxShadow: "none" }}
          >
            Validate
          </Button>
        </DialogActions>
      </Dialog>

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
    </>
  );
};

export default ApiKeyDialog;
