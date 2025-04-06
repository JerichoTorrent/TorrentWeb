import { MentionsInputStyle } from "react-mentions";

const rawMentionStyle: MentionsInputStyle = {
  control: {
    backgroundColor: "#1e1e22",
    fontSize: 14,
    fontWeight: "normal",
    padding: "5px",
    borderRadius: "4px",
    border: "1px solid #444",
  },
  highlighter: {
    overflow: "hidden",
    padding: "5px",
  },
  input: {
    margin: 0,
    color: "white",
    padding: "5px",
    outline: "none",
    border: "none",
    backgroundColor: "transparent",
  },
  suggestions: {
    list: {
      backgroundColor: "#2a2a2a",
      border: "1px solid #444",
      fontSize: 14,
      borderRadius: "4px",
      maxHeight: 200,
      overflowY: "auto",
      zIndex: 100,
    },
    item: {
      padding: "8px 10px",
      cursor: "pointer",
    },
    // @ts-expect-error react-mentions type doesn't include this
    itemFocused: {
      backgroundColor: "#a86fff",
      color: "black",
    },
  },
};

const mentionStyle = rawMentionStyle as any;
export default mentionStyle;
