// src/components/ResultDisplay.js
import React from "react";
import { Grid, IconButton, Tooltip } from "@mui/material";
import { ContentCopy, AutoFixHigh } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import TranslateIcon from "@mui/icons-material/Translate";

const ResultDisplay = ({
  ocrResult,
  handleCopyToClipboard,
  handleOcrAgain,
}) => {
  return (
    <Grid
      item
      xs={12}
      style={{
        marginTop: 10,
        marginBottom: 20,
        textAlign: "left",
        background: "white",
        borderRadius: 5,
        paddingTop: 1,
      }}
    >
      <Grid
        style={{
          paddingTop: 5,
          paddingLeft: 15,
          paddingRight: 15,
        }}
      >
        <ReactMarkdown>{ocrResult}</ReactMarkdown>
      </Grid>
      <Grid style={{ textAlign: "left", padding: 10, paddingTop: 0 }}>
        <Tooltip title="Copy" arrow>
          <IconButton
            onClick={handleCopyToClipboard}
            color="secondary"
            size="small"
          >
            <ContentCopy fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Scan Again" arrow>
          <IconButton
            onClick={handleOcrAgain}
            color="secondary"
            size="small"
            style={{ marginLeft: "0.1rem" }}
          >
            <AutoFixHigh fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Translate" arrow>
          <IconButton
            onClick={handleOcrAgain}
            color="secondary"
            size="small"
            style={{ marginLeft: "0.1rem" }}
          >
            <TranslateIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
};

export default ResultDisplay;
