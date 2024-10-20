// src/components/ResultDisplay.js
import React from "react";
import {
  Grid,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { ContentCopy, AutoFixHigh } from "@mui/icons-material";
import Markdown from "markdown-to-jsx";
import TranslateIcon from "@mui/icons-material/Translate";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";

const ResultDisplay = ({
  ocrResult,
  handleCopyToClipboard,
  handleOcrAgain,
}) => {
  const options = {
    overrides: {
      h1: {
        component: (props) => <h1 style={{ color: "blue" }} {...props} />,
      },
      h2: {
        component: (props) => <h2 style={{ color: "darkgreen" }} {...props} />,
      },
      table: {
        component: (props) => (
          <TableContainer
            component={Paper}
            style={{
              marginTop: "1rem",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Table {...props} size="small" aria-label="a dense table">
              <TableHead>
                <TableRow>{props.children[0].props.children}</TableRow>
              </TableHead>
              <TableBody>{props.children.slice(1)}</TableBody>
            </Table>
          </TableContainer>
        ),
      },
      th: {
        component: (props) => (
          <TableCell
            style={{
              background: "#f4f4f4",
              fontWeight: "bold",
              textAlign: "left",
            }}
            {...props}
          />
        ),
      },
      td: {
        component: (props) => (
          <TableCell
            style={{
              transition: "background-color 0.3s",
              padding: "12px",
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
          return (
            <SyntaxHighlighter language={language} style={solarizedlight}>
              {children}
            </SyntaxHighlighter>
          );
        },
      },
      pre: {
        component: (props) => <pre style={{ margin: 0 }} {...props} />,
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
          paddingTop: 5,
          paddingLeft: 15,
          paddingRight: 15,
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
