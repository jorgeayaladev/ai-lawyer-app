"use client";
import { useEffect, useRef, useState } from "react";
import useLLM, { OpenAIMessage } from "usellm";
import lawyer from "@/img/lawyer.png";
import user from "@/img/user.jpg";
import Image from "next/image";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [history, setHistory] = useState<OpenAIMessage[]>([
    {
      role: "assistant",
      content:
        "Hola soy tu abogado de confianza!, mi nombre es Jarvis, puedes consultarme en todo lo relacionado a la justicia peruana.",
    },
  ]);
  const [inputText, setInputText] = useState("");

  const llm = useLLM({ serviceUrl: "https://usellm.org/api/llm" });

  async function handleSend() {
    if (!inputText) {
      return;
    }
    try {
      setStatus("streaming");
      const newHistory = [...history, { role: "user", content: inputText }];
      setHistory(newHistory);
      setInputText("");
      const { message } = await llm.chat({
        messages: newHistory,
        stream: true,
        onStream: ({ message }) => setHistory([...newHistory, message]),
      });
      setHistory([...newHistory, message]);
      setStatus("idle");
      handleSpeak(message.content);
    } catch (error: any) {
      console.error(error);
      window.alert("Ha ocurrido un error! " + error.message);
    }
  }

  async function handleRecordClick() {
    try {
      if (status === "idle") {
        await llm.record();
        setStatus("recording");
      } else if (status === "recording") {
        setStatus("transcribing");
        const { audioUrl } = await llm.stopRecording();
        const { text } = await llm.transcribe({ audioUrl });
        setStatus("streaming");
        const newHistory = [...history, { role: "user", content: text }];
        setHistory(newHistory);
        const { message } = await llm.chat({
          messages: newHistory,
          stream: true,
          onStream: ({ message }) => setHistory([...newHistory, message]),
        });
        setHistory([...newHistory, message]);
        setStatus("idle");
        handleSpeak(message.content);
      }
    } catch (error: any) {
      console.error(error);
      window.alert("Ha ocurrido un error! " + error.message);
    }
  }

  const handleSpeak = (content: string) => {
    if ("speechSynthesis" in window) {
      const synthesis = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(content);
      synthesis.speak(utterance);
    } else {
      console.log("Text-to-Speech is not supported in this browser.");
    }
  };

  const Icon = status === "recording" ? Square : Mic;

  return (
    <div className="p-10 flex items-center justify-center h-screen bg-gray-900">
      <div className="p-10 flex flex-col w-full h-full overflow-y-hidden bg-red-500 rounded-2xl gap-10">
        <ChatMessages messages={history} />
        <div className="w-full flex">
          <ChatInput
            placeholder={getInputPlaceholder(status)}
            text={inputText}
            setText={setInputText}
            sendMessage={handleSend}
            disabled={status !== "idle"}
          />
          <button
            className="p-2 border rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-white dark:text-black font-medium ml-2"
            onClick={handleSend}
          >
            Send
          </button>
          <button
            className="p-2 border rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-white dark:text-black font-medium ml-2"
            onClick={handleRecordClick}
          >
            <Icon />
          </button>
        </div>
      </div>
    </div>
  );
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.substring(1);
}

type Status = "idle" | "recording" | "transcribing" | "streaming";

function getInputPlaceholder(status: Status) {
  switch (status) {
    case "idle":
      return "Preguntame lo que desees...";
    case "recording":
      return "Grabando audio...";
    case "transcribing":
      return "Transcribiendo audio...";
    case "streaming":
      return "Esperando la respuesta...";
  }
}

interface ChatMessagesProps {
  messages: OpenAIMessage[];
}

function ChatMessages({ messages }: ChatMessagesProps) {
  let messagesWindow = useRef<Element | null>(null);

  useEffect(() => {
    if (messagesWindow?.current) {
      messagesWindow.current.scrollTop = messagesWindow.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className="p-10 w-full flex flex-col flex-1 overflow-y-auto bg-white text-gray-900 rounded-l-2xl border-4 border-white gap-5"
      ref={(el) => (messagesWindow.current = el)}
    >
      {messages.map((message, idx) => (
        <div
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          } gap-5`}
          key={idx}
        >
          <Image
            className={`w-12 h-12 ${
              message.role === "user" ? "order-last" : "order-first"
            } rounded-[50%]`}
            src={message.role === "user" ? user : lawyer}
            alt={message.role === "user" ? "Usuario" : "Abogado"}
          />
          <div
            className={`flex flex-col ${
              message.role === "user" ? "order-first" : "order-last"
            } gap-2.5`}
          >
            <h2 className="italic text-sm">
              El {message.role === "user" ? "Usuario" : "Abogado virtual"} dice
            </h2>
            <div
              className={`p-5 ${
                message.role === "user" ? "bg-gray-900" : "bg-red-500"
              } text-white whitespace-pre-wrap rounded-2xl`}
            >
              {message.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ChatInputProps {
  placeholder: string;
  text: string;
  setText: (text: string) => void;
  sendMessage: () => void;
  disabled: boolean;
}

function ChatInput({
  placeholder,
  text,
  setText,
  sendMessage,
  disabled,
}: ChatInputProps) {
  return (
    <input
      className="p-2 border rounded w-full block bg-white text-gray-900"
      type="text"
      placeholder={placeholder}
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendMessage();
        }
      }}
    />
  );
}

const Mic = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" x2="12" y1="19" y2="22"></line>
  </svg>
);

const Square = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
  </svg>
);
