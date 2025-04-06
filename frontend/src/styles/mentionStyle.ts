import { MentionsInputStyle } from "react-mentions";

const rawMentionStyle: MentionsInputStyle = {
  control: {
    backgroundColor: "#1e1e22",
    fontSize: 14,
    color: "white",
    border: "1px solid #3f3f46",
    borderRadius: "6px",
    padding: "12px",
    minHeight: "140px",
    lineHeight: 1.5,
    display: "flex",
    alignItems: "flex-start",
  },
  highlighter: {
    overflow: "hidden",
    color: "transparent",
    padding: "12px",
  },
  input: {
    margin: 0,
    color: "white",
    backgroundColor: "transparent",
    outline: 0,
    padding: "12px",
    fontSize: 14,
    lineHeight: 1.5,
  },
  suggestions: {
    list: {
      backgroundColor: "#2a2a2e",
      border: "1px solid #555",
      fontSize: 14,
      borderRadius: "4px",
      overflow: "hidden",
    },
    item: {
      padding: "6px 12px",
      borderBottom: "1px solid #333",
      color: "white",
      "&focused": {
        backgroundColor: "#6b21a8",
      },
    },
  },
};

const mentionStyle = rawMentionStyle as any;
export default mentionStyle;
