import axiosInstance from "../services/axios"; // Make sure this path is correct
import { useEffect, useState, useRef } from "react";
import { Send, Mic, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

const defaultWelcomeMessage = {
  id: "1",
  type: "assistant", // 'assistant' or 'user'
  content:
    "Hi! I'm ChefGenie, your personal AI cooking assistant. I can help you with recipe suggestions, ingredient substitutions, cooking techniques, and meal planning. What would you like to cook today?",
  timestamp: new Date(),
};

export default function ChatPage() {
  const [messages, setMessages] = useState(() => {
    try {
      const storedMessages = sessionStorage.getItem("chatMessages");
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        return parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      }
    } catch (error) {
      console.error("Failed to parse messages from sessionStorage", error);
    }
    return [defaultWelcomeMessage];
  });

  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const quickPrompts = [
    "Healthy dinner ideas",
    "Substitute suggestions",
    "5-minute recipes",
    "Budget-friendly meals",
    "Vegetarian options",
    "Meal prep tips",
  ];

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    const messagesToStore = messages.filter((msg) => msg.id !== "typing");
    if (messagesToStore.length > 1) {
      sessionStorage.setItem("chatMessages", JSON.stringify(messagesToStore));
    }
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Your browser doesn't support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      alert(`Error: ${event.error}. Please ensure you've given microphone permission.`);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      handleSendMessage(transcript)
    };
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("Your browser doesn't support speech recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (promptContent = null) => {
    // 1. Determine the content to send
    const contentToSend = promptContent || inputValue;
    if (!contentToSend.trim()) return;

    // 2. Create the new user message
    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: contentToSend,
      timestamp: new Date(),
    };

    // 3. Create a "typing" indicator
    const typingMessage = {
      id: "typing",
      type: "assistant",
      content: "ChefGenie is thinking...",
      timestamp: new Date(),
    };

    // 4. This will hold the correct, up-to-date list for the API
    const newMessagesForApi = [...messages, userMessage];
    const apiMessages = newMessagesForApi.map((msg) => ({
      role: msg.type === "user" ? "user" : "model",
      content: msg.content,
    }));

    // ✅ Update UI immediately
    setMessages((prev) => [...prev, userMessage, typingMessage]);

    if (!promptContent) setInputValue("");

    try {
      console.log("Sending payload:", { messages: apiMessages });
      const response = await axiosInstance.post("/api/chatbot/", {
        messages: apiMessages,
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== "typing"),
        assistantMessage,
      ]);
    } catch (error) {
      console.error("Error fetching AI reply:", error);

      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I ran into an error. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== "typing"),
        errorMessage,
      ]);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setInputValue(prompt);
    handleSendMessage(prompt);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden">
                  {msg.type === "assistant" ? (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-700">
                      U
                    </div>
                  )}
                </div>

                {/* Message */}
                <div
                  className={`flex-1 max-w-lg p-4 rounded-2xl ${msg.type === "user" ? "bg-purple-500 text-white" : "bg-card border border-border"
                    }`}
                >
                  {msg.id === "typing" ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                    </div>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}

                  {msg.id !== "typing" && (
                    <p
                      className={`text-xs mt-2 ${msg.type === "user" ? "text-white/70" : "text-muted-foreground"
                        }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-background">
          <div className="max-w-3xl mx-auto flex items-end gap-3">
            <div className="flex-1 bg-card rounded-2xl border border-border p-2">
              <input
                type="text"
                placeholder="Ask ChefGenie anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="w-full border-0 bg-transparent focus:outline-none"
              />
            </div>

            <button
              onClick={handleMicClick}
              className={`rounded-full w-12 h-12 border flex items-center justify-center transition-all ${isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-accent"
                }`}
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              className="rounded-full w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
              onClick={() => handleSendMessage()}
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Prompts Sidebar */}
      <div className="hidden xl:block w-72 border-l border-border bg-muted/30 p-4">
        <h3 className="mb-4 font-bold">Quick Prompts</h3>
        <div className="space-y-2">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(prompt)}
              className="w-full text-left p-3 rounded-lg bg-card border border-border hover:bg-accent transition-all"
            >
              <p>{prompt}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
