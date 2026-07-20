import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Brain, Bot, HelpCircle, ArrowRight, CheckCircle } from "lucide-react";
import { Transaction, Budget, ChatMessage } from "../types";

interface AICounselorProps {
  transactions: Transaction[];
  budgets: Budget[];
  chatHistory: ChatMessage[];
  onAddChatMessage: (msg: ChatMessage) => void;
}

export default function AICounselor({
  transactions,
  budgets,
  chatHistory,
  onAddChatMessage
}: AICounselorProps) {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompts
  const suggestions = [
    "How can I save money?",
    "Where am I overspending?",
    "Suggest a customized budget.",
    "What will my expenses be next month?"
  ];

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  // Handler to send query to Express backend Chatbot route
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}-user`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    onAddChatMessage(userMsg);
    setInputText("");
    setIsTyping(true);

    try {
      // 2. Query Fullstack server
      const chatPayload = [...chatHistory, userMsg];
      const response = await fetch("/api/ai/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatPayload,
          transactions,
          budgets
        })
      });

      if (response.ok) {
        const data = await response.json();
        // 3. Add AI Message
        const aiMsg: ChatMessage = {
          id: `chat-${Date.now()}-ai`,
          sender: "ai",
          text: data.text || "I was unable to retrieve a response from the model. Please check the network.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        onAddChatMessage(aiMsg);
      } else {
        throw new Error("Chatbot API response failure");
      }
    } catch (e) {
      console.error("Chatbot integration failed:", e);
      // Add local error fallback message
      const errorMsg: ChatMessage = {
        id: `chat-${Date.now()}-ai`,
        sender: "ai",
        text: "I am having trouble connecting to my cognitive services right now. Let me try compiling standard advice instead. (Note: Ensure process.env.GEMINI_API_KEY is configured correctly inside Settings > Secrets!)",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      onAddChatMessage(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="ai-advisor-panel">
      {/* Left Column: Chat Assistant Interface */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-md animate-pulse">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight">FinAI Counselor</span>
                <span className="text-[8px] bg-indigo-500 text-indigo-100 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-[10px] text-indigo-200">Machine Learning Personal Advisory Agent</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/15 px-2.5 py-1 rounded-xl">
            <Brain size={14} /> Cloud Connected
          </div>
        </div>

        {/* Chat Message Box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center h-full py-12 max-w-md mx-auto space-y-4">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full">
                <Sparkles size={32} className="animate-spin" style={{ animationDuration: "3s" }} />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-800">Meet FinAI - Your Personalized Advisor</h4>
                <p className="text-xs text-gray-400 leading-relaxed mt-1">
                  Ask me anything about your current budgets, overspending zones, potential savings targets, or cash flow forecasts.
                </p>
              </div>
              <div className="w-full space-y-2 pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-left">Quick Topics</span>
                <div className="grid grid-cols-1 gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSendMessage(s)}
                      className="text-left w-full p-3 bg-white hover:bg-slate-50 border border-gray-100 rounded-2xl text-xs font-semibold text-gray-700 transition-all flex justify-between items-center cursor-pointer group"
                    >
                      <span>{s}</span>
                      <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {chatHistory.map((m) => {
            const isUser = m.sender === "user";
            return (
              <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot size={15} />
                  </div>
                )}
                <div className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.01)]"
                }`}>
                  {/* Handle linebreaks elegantly for formatting */}
                  <div className="whitespace-pre-line font-medium">
                    {m.text}
                  </div>
                  <span className={`text-[8px] mt-1.5 block text-right font-semibold ${isUser ? "text-indigo-200" : "text-gray-400"}`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex justify-start items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={15} />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.01)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input form */}
        <form onSubmit={handleFormSubmit} className="p-4 bg-white border-t border-gray-100 flex gap-2 shrink-0">
          <input
            type="text"
            placeholder="Ask 'Where is my money going?' or 'Suggest a savings plan'..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-medium"
          />
          <button
            type="submit"
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all cursor-pointer shadow-sm flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Right Column: AI Model Info & Direct Actions */}
      <div className="space-y-6">
        {/* System Capabilities Summary */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <HelpCircle size={18} className="text-indigo-600" />
            <h4 className="text-sm font-extrabold text-gray-900 tracking-tight">How AI Advisor works</h4>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-gray-500 font-semibold">
            <div className="flex gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 h-fit">
                <Brain size={14} />
              </div>
              <div>
                <h5 className="font-bold text-gray-800">Dynamic Context Analysis</h5>
                <p className="mt-0.5">FinAI analyzes your entire live transaction ledger, including categories, savings rates, and budget allocations in real-time.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 h-fit">
                <Sparkles size={14} />
              </div>
              <div>
                <h5 className="font-bold text-gray-800">Predictive Cash Flow ML</h5>
                <p className="mt-0.5">Using simple linear regression and Gemini's contextual logic, we forecast next month's spending and savings index.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0 h-fit">
                <CheckCircle size={14} />
              </div>
              <div>
                <h5 className="font-bold text-gray-800">Guaranteed Offline fallback</h5>
                <p className="mt-0.5">Even if the central Gemini API is offline, our built-in rules heuristics will immediately takeover to keep your insights live.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestion Bubble Launcher */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Bot size={150} />
          </div>
          <h4 className="text-sm font-extrabold tracking-tight">Try a topic instantly</h4>
          <p className="text-xs text-indigo-200">Tap any preset prompt below to launch automatic scanning immediately:</p>
          <div className="space-y-2 pt-1 relative z-10">
            <button
              onClick={() => handleSendMessage("Suggest a customized 50/30/20 budget for my income")}
              className="text-left w-full p-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer block"
            >
              📝 Suggest a 50/30/20 budget
            </button>
            <button
              onClick={() => handleSendMessage("Am I spending too much on subscriptions?")}
              className="text-left w-full p-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer block"
            >
              💻 Review subscription loads
            </button>
            <button
              onClick={() => handleSendMessage("How can I build an emergency fund of ₹1,00,000?")}
              className="text-left w-full p-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer block"
            >
              🏦 Savings plan for ₹1,00,000 stash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
