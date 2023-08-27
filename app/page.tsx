"use client";
import { useEffect, useRef, useState } from "react";
import useLLM, { OpenAIMessage } from "usellm";
import lawyer from "@/img/lawyer.png";
import user from "@/img/user.png";
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
    if (!inputText) return;

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
    <div className="p-4 flex items-center justify-center h-screen bg-gray-900 gap-4">
      {/* Sidebar */}
      <div className="p-6 hidden md:flex flex-col h-full bg-sky-500 rounded-2xl gap-6">
        {/* New Chat */}
        <button className="p-2 flex bg-white text-gray-900 font-semibold rounded gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <p>Nuevo Chat</p>
        </button>

        {/* Chats History */}
        <div className="p-4 flex flex-col flex-1 bg-white text-white text-sm font-semibold rounded gap-4">
          <button className="p-2 w-48 bg-sky-700 rounded">
            <p>Chat 1</p>
            <div></div>
          </button>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between gap-4">
          <button className="p-2 flex flex-1 items-center justify-left bg-white text-gray-900 font-semibold rounded gap-2">
            <Image className="w-6 h-6 rounded-[50%]" src={user} alt="Usuario" />
            <p>Usuario</p>
          </button>
          <button className="p-2 flex items-center justify-center bg-white text-gray-900 rounded">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 flex flex-col w-full h-full overflow-y-hidden bg-sky-500 rounded-2xl gap-6">
        <ChatMessages messages={history} />
        <div className="w-full flex gap-2">
          <ChatInput
            placeholder={getInputPlaceholder(status)}
            text={inputText}
            setText={setInputText}
            sendMessage={handleSend}
            disabled={status !== "idle"}
          />
          <button
            className="p-2 border rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-white dark:text-black font-medium"
            onClick={handleSend}
          >
            Enviar
          </button>
          <button
            className="p-2 border rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-white dark:text-black font-medium"
            onClick={handleRecordClick}
          >
            <Icon />
          </button>
        </div>
      </div>
    </div>
  );
}

type Status = "idle" | "recording" | "transcribing" | "streaming";

function getInputPlaceholder(status: Status) {
  switch (status) {
    case "idle":
      return "Pregúntame lo que desees...";
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
      className="p-6 w-full flex flex-col flex-1 overflow-y-auto bg-white text-gray-900 text-sm rounded border-4 border-white gap-5"
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
            <h2 className="italic text-xs">
              El {message.role === "user" ? "Usuario" : "Abogado virtual"} dice
            </h2>
            <div
              className={`p-5 ${
                message.role === "user" ? "bg-gray-900" : "bg-sky-500"
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
