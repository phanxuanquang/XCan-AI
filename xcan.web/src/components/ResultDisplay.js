// src/components/ResultDisplay.js
import React from "react";
import {
  Grid,
  IconButton,
  Tooltip,
  Table,
  TableCell,
  Paper,
  Button,
  Typography,
} from "@mui/material";
import { ContentCopy, AutoFixHigh } from "@mui/icons-material";
import Markdown from "markdown-to-jsx";
import TranslateIcon from "@mui/icons-material/Translate";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { MathJax, MathJaxContext } from "better-react-mathjax"; // Thêm thư viện MathJax

const CustomBlockquote = ({ children }) => (
  <blockquote
    style={{
      borderLeft: "4px solid #6200ee",
      paddingLeft: "10px",
      color: "#555",
      fontStyle: "italic",
    }}
  >
    {children}
  </blockquote>
);

const ResultDisplay = ({
  ocrResult,
  handleCopyToClipboard,
  handleOcrAgain,
  handleTranslate,
}) => {
  const options = {
    overrides: {
      h1: {
        component: (props) => (
          <Typography
            variant="h4"
            gutterBottom
            style={{ marginBottom: 5, fontWeight: "bold" }}
            {...props}
          />
        ),
      },
      h2: {
        component: (props) => (
          <Typography
            variant="h5"
            gutterBottom
            style={{ marginBottom: 5 }}
            {...props}
          />
        ),
      },
      h3: {
        component: (props) => (
          <Typography
            variant="h6"
            gutterBottom
            style={{ marginBottom: 5 }}
            {...props}
          />
        ),
      },
      p: {
        component: (props) => (
          <Typography
            variant="body1"
            style={{
              marginBottom: "1rem",
              lineHeight: 1.6,
              whiteSpace: "pre-line",
              margin: "0.5em 0",
            }}
            {...props}
          />
        ),
      },
      table: {
        component: (props) => (
          <Table
            component={Paper}
            size="small"
            style={{
              marginBottom: 15,
              overflow: "auto", // Cho phép bảng cuộn ngang nếu quá rộng
            }}
            {...props}
          />
        ),
      },
      th: {
        component: (props) => (
          <TableCell
            style={{
              background: "#f4f4f4",
              fontWeight: "bold",
              padding: 5,
              textAlign: "center", // Căn giữa cho tiêu đề bảng
            }}
            {...props}
          />
        ),
      },
      td: {
        component: (props) => (
          <TableCell
            style={{
              padding: 5,
              textAlign: "left",
              transition: "background-color 0.3s",
              "&:hover": {
                backgroundColor: "#f9f9f9",
              },
            }}
            {...props}
          />
        ),
      },
      code: {
        component: ({ children, className }) => {
          const language = className ? className.replace("language-", "") : "";
          if (language) {
            return (
              <SyntaxHighlighter language={language} style={solarizedlight}>
                {children}
              </SyntaxHighlighter>
            );
          }
          return (
            <code
              style={{
                backgroundColor: "#e3e3e3",
                margin: 5,
                padding: 2,
                borderRadius: 2,
                fontFamily: "monospace",
              }}
            >
              {children}
            </code>
          );
        },
      },
      pre: {
        component: (props) => <pre style={{ margin: 0 }} {...props} />,
      },
      sup: {
        component: (props) => (
          <sup
            style={{ verticalAlign: "super", fontSize: "smaller" }}
            {...props}
          />
        ),
      },
      sub: {
        component: (props) => (
          <sub
            style={{ verticalAlign: "sub", fontSize: "smaller" }}
            {...props}
          />
        ),
      },
      img: {
        component: (props) => (
          <img
            style={{ maxWidth: "100%", height: "auto" }}
            {...props}
            alt="img"
          />
        ),
      },
      ul: {
        component: (props) => (
          <ul style={{ paddingLeft: 5, marginLeft: 30 }} {...props} />
        ),
      },
      ol: {
        component: (props) => (
          <ol style={{ paddingLeft: 5, marginLeft: 30 }} {...props} />
        ),
      },
      li: {
        component: (props) => <li style={{ marginBottom: 3 }} {...props} />,
      },
      blockquote: {
        component: CustomBlockquote,
      },
      button: {
        component: (props) => (
          <Button
            variant="contained"
            size="small"
            style={{ margin: 3, boxShadow: "none" }}
            {...props}
          >
            {props.children}
          </Button>
        ),
      },
      math: {
        component: ({ children }) => (
          <MathJaxContext>
            <MathJax inline dynamic>
              {children}
            </MathJax>
          </MathJaxContext>
        ),
      },
    },
  };

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
          paddingTop: 10,
          paddingLeft: 15,
          paddingRight: 15,
          overflowX: "auto",
        }}
      >
        <Markdown options={options}>{ocrResult}</Markdown>
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
        <Tooltip title="Translate into Vietnamese" arrow>
          <IconButton
            onClick={handleTranslate}
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
