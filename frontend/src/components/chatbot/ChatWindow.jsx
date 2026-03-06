import React, { useState, useRef, useEffect } from "react";
import { Send, Power, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Plot from "react-plotly.js";
import { sendMessage as sendChatMessage } from "../../services/chatApi";

const getCurrentTime = () =>
  new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

const INITIAL_MESSAGE = {
  role: "bot",
  text: "Welcome to Kirloskar Pneumatic Company Limited! How can I assist you today?\n\nPlease choose from the following options or type your own question:",
  options: [
    "Plot a horizontal bar chart of the top 10 'Dealer Name' by average 'RunHrs'",
    "Plot a line chart showing the total number of complaints logged per year",
    "How many unique Compressor 'Model' types do we have?",
    "Which 'Dealer Name' has the highest number of logged complaints?",
    "How many rows mention the word 'leak' or 'vibration' in the 'Nature of complaint' column?",
    "What is the most frequently mentioned item in the 'Spares / Part Replaced' column?",
  ],
  time: getCurrentTime(),
};

const cleanText = (text) => (text ? text.replace(/\\n/g, "\n") : "");

export default function ChatWindow({ onClose }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      setMessages([{ ...INITIAL_MESSAGE, time: getCurrentTime() }]);
      setInput("");
    }
  };

  const handleSend = async (overrideText = null) => {
    const textToSend = typeof overrideText === "string" ? overrideText : input;
    if (!textToSend.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: textToSend, time: getCurrentTime() }]);
    if (typeof overrideText !== "string") setInput("");
    setIsLoading(true);

    try {
      const data = await sendChatMessage(textToSend);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.answer, graph_json: data.graph_json, time: getCurrentTime() },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Connection to backend failed. Please try again later.", time: getCurrentTime() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[9999] w-[460px] h-[640px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[var(--border-color)] animate-[fadeIn_0.2s_ease-out]">
      {/* Header */}
      <div className="bg-[var(--primary-teal)] text-white px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center">
            <span className="text-[var(--primary-teal)] font-bold text-sm">K</span>
          </div>
          <h3 className="font-semibold text-[19px]">KBot</h3>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 bg-[#fdfdfd] flex flex-col gap-5">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <span className={`text-[11px] text-gray-500 mb-1.5 ${msg.role === "user" ? "mr-1" : "ml-1"}`}>
              {msg.role === "user" ? "You" : "KBot"}
            </span>
            <div
              className={`p-4 text-[13px] leading-relaxed shadow-sm ${
                msg.graph_json ? "max-w-[95%] w-full" : "max-w-[85%]"
              } ${
                msg.role === "user"
                  ? "bg-[var(--primary-teal-light)] text-gray-800 rounded-2xl rounded-tr-sm"
                  : "bg-[#f4f6f8] text-gray-800 rounded-2xl rounded-tl-sm border border-gray-200"
              }`}
            >
              {msg.role === "user" ? (
                <div style={{ whiteSpace: "pre-wrap" }}>{cleanText(msg.text)}</div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p style={{ marginBottom: "8px", whiteSpace: "pre-wrap" }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginBottom: "8px" }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ listStyleType: "decimal", paddingLeft: "20px", marginBottom: "8px" }}>{children}</ol>,
                    li: ({ children }) => <li style={{ marginBottom: "4px" }}>{children}</li>,
                    strong: ({ children }) => <strong style={{ fontWeight: "bold", color: "#111827" }}>{children}</strong>,
                  }}
                >
                  {cleanText(msg.text)}
                </ReactMarkdown>
              )}

              {msg.options && (
                <div className="flex flex-wrap gap-2 mt-3.5">
                  {msg.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(opt)}
                      disabled={isLoading}
                      className="px-3.5 py-2 text-[11px] font-medium border border-[var(--primary-teal)] text-[var(--primary-teal)] bg-white rounded-full hover:bg-[var(--primary-teal-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {msg.graph_json && (() => {
                try {
                  const parsed = JSON.parse(msg.graph_json);
                  return (
                    <div className="mt-3.5 rounded-lg border border-gray-200 overflow-hidden bg-white p-2">
                      <Plot
                        data={parsed.data}
                        layout={{
                          ...parsed.layout,
                          autosize: true,
                          margin: { t: 40, r: 20, l: 55, b: 90 },
                          paper_bgcolor: "transparent",
                          plot_bgcolor: "transparent",
                          font: { family: "Inter, sans-serif", color: "#475569", size: 10 },
                          legend: { orientation: "h", y: -0.4, x: 0 },
                        }}
                        useResizeHandler
                        style={{ width: "100%", height: "340px" }}
                        config={{ responsive: true, displayModeBar: false }}
                      />
                    </div>
                  );
                } catch {
                  return null;
                }
              })()}

              <span className="text-[10px] text-gray-400 block text-right mt-1.5">{msg.time}</span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-gray-500 mb-1 ml-1">KBot</span>
            <div className="bg-[#f4f6f8] text-gray-500 p-3.5 rounded-2xl rounded-tl-sm border border-gray-100">
              <div className="flex gap-1.5 items-center h-4">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 shrink-0">
        <div className="flex justify-end px-4 pt-2.5 gap-2 text-gray-400">
          <Power
            size={17}
            onClick={handleClearChat}
            title="Restart Session"
            className="cursor-pointer text-orange-400 hover:text-red-500 transition-colors"
          />
        </div>
        <div className="px-4 pb-4 pt-1 flex items-center gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 text-[14px] outline-none text-gray-700 placeholder-gray-400 bg-transparent py-2.5"
            placeholder="Type your question..."
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-2.5 text-[var(--primary-teal)] hover:bg-teal-50 rounded-full transition-colors disabled:opacity-50"
          >
            <Send size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
