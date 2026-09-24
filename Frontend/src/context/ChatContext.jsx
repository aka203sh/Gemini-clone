// import React, { createContext, useState, useRef, useEffect } from 'react'
//                                               // ⬆️ ADD useEffect here
// import { createChatSession, sendMessage as sendMessageToGemini } from '../config/gemini'
// import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
// import { auth, googleProvider } from '../firebase'

// export const ChatContext = createContext(null)

// const ChatContextProvider = ({ children }) => {
//   const [chats, setChats] = useState([]);
//   const [currentChatId, setCurrentChatId] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const sessionsRef = useRef({});

//   // ⬇️ ADD THIS BLOCK — new user state + login/logout functions
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//     });
//     return () => unsubscribe();
//   }, []);

//   const login = async () => {
//     try {
//       await signInWithPopup(auth, googleProvider);
//     } catch (err) {
//       console.error("Login error:", err);
//     }
//   };

//   const logout = async () => {
//     await signOut(auth);
//   };
//   // ⬆️ END OF NEW BLOCK

//   const newChat = () => {
//     const id = Date.now().toString();
//     const chat = { id, title: "New Chat", messages: [] };
//     setChats(prev => [chat, ...prev]);
//     setCurrentChatId(id);
//     return id;
//   };

//   const selectChat = (id) => {
//     setCurrentChatId(id);
//   };

//   const sendMessage = async (text) => {
//     if (!text.trim()) return;

//     let chatId = currentChatId;
//     if (!chatId) {
//       chatId = newChat();
//     }

//     setChats(prev => prev.map(chat => {
//       if (chat.id !== chatId) return chat;
//       const isFirstMessage = chat.messages.length === 0;
//       return {
//         ...chat,
//         title: isFirstMessage ? text.slice(0, 30) : chat.title,
//         messages: [...chat.messages, { question: text, answer: "" }],
//       };
//     }));

//     setLoading(true);

//     try {
//       if (!sessionsRef.current[chatId]) {
//         sessionsRef.current[chatId] = createChatSession();
//       }
//       const result = await sendMessageToGemini(sessionsRef.current[chatId], text);

//       setChats(prev => prev.map(chat => {
//         if (chat.id !== chatId) return chat;
//         const updatedMessages = [...chat.messages];
//         updatedMessages[updatedMessages.length - 1].answer = result;
//         return { ...chat, messages: updatedMessages };
//       }));
//     } catch (err) {
//       setChats(prev => prev.map(chat => {
//         if (chat.id !== chatId) return chat;
//         const updatedMessages = [...chat.messages];
//         updatedMessages[updatedMessages.length - 1].answer = "Something went wrong. Check the console for details.";
//         return { ...chat, messages: updatedMessages };
//       }));
//     }
//     setLoading(false);
//   };

//   const currentChat = chats.find(c => c.id === currentChatId) || null;

//   const contextValue = {
//     chats,
//     currentChat,
//     currentChatId,
//     loading,
//     newChat,
//     selectChat,
//     sendMessage,
//     user,     // ⬅️ ADD
//     login,    // ⬅️ ADD
//     logout,   // ⬅️ ADD
//   };

//   return (
//     <ChatContext.Provider value={contextValue}>
//       {children}
//     </ChatContext.Provider>
//   );
// };

// export default ChatContextProvider;

import React, { createContext, useState, useRef, useEffect } from 'react'
import { createChatSession, sendMessage as sendMessageToGemini } from '../config/gemini'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

export const ChatContext = createContext(null)

const ChatContextProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const sessionsRef = useRef({});

  // Track login state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const hasLoadedRef = useRef(false); // tracks whether current user's chats have loaded

// Load this user's chats from Firestore whenever they log in
useEffect(() => {
  const loadChats = async () => {
    hasLoadedRef.current = false; // block saves while loading
    if (!user) {
      setChats([]);
      setCurrentChatId(null);
      hasLoadedRef.current = true; // nothing to load, safe to save from now on
      return;
    }
    const userDocRef = doc(db, "users", user.uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      setChats(snap.data().chats || []);
    } else {
      setChats([]);
    }
    hasLoadedRef.current = true; // loading is done, saves are now safe
  };
  loadChats();
}, [user]);

// Save chats to Firestore any time they change (only if logged in AND loaded)
useEffect(() => {
  if (!user || !authReady || !hasLoadedRef.current) return;
  const saveChats = async () => {
    const userDocRef = doc(db, "users", user.uid);
    try {
      await setDoc(userDocRef, { chats }, { merge: true });
    } catch (err) {
      console.error("Firestore save error:", err);
    }
  };
  saveChats();
}, [chats, user, authReady]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const logout = async () => {
    await signOut(auth);
    sessionsRef.current = {};
  };

  const newChat = () => {
    const id = Date.now().toString();
    const chat = { id, title: "New Chat", messages: [] };
    setChats(prev => [chat, ...prev]);
    setCurrentChatId(id);
    return id;
  };

  const selectChat = (id) => {
    setCurrentChatId(id);
  };

 const sendMessage = async (text, imageData = null) => {
  if (!text.trim() && !imageData) return;

  let chatId = currentChatId;
  if (!chatId) {
    chatId = newChat();
  }

  setChats(prev => prev.map(chat => {
    if (chat.id !== chatId) return chat;
    const isFirstMessage = chat.messages.length === 0;
    return {
      ...chat,
      title: isFirstMessage ? (text || "Attachment chat").slice(0, 30) : chat.title,
      messages: [...chat.messages, {
        question: text,
        answer: "",
        attachment: imageData ? {
          previewUrl: imageData.previewUrl,
          fileName: imageData.fileName,
          mimeType: imageData.mimeType,
        } : null,
      }],
    };
  }));

  setLoading(true);

  try {
  if (!sessionsRef.current[chatId]) {
    const existingChat = chats.find(c => c.id === chatId);
    const priorMessages = existingChat ? existingChat.messages.filter(m => m.answer) : [];
    const rebuiltHistory = priorMessages.flatMap(m => [
      { role: "user", parts: [{ text: m.question }] },
      { role: "model", parts: [{ text: m.answer }] },
    ]);
    sessionsRef.current[chatId] = createChatSession(rebuiltHistory);
  }
    const result = await sendMessageToGemini(sessionsRef.current[chatId], text, imageData);

    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      const updatedMessages = [...chat.messages];
      updatedMessages[updatedMessages.length - 1].answer = result;
      return { ...chat, messages: updatedMessages };
    }));
  } catch (err) {
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      const updatedMessages = [...chat.messages];
      updatedMessages[updatedMessages.length - 1].answer = "Something went wrong. Check the console for details.";
      return { ...chat, messages: updatedMessages };
    }));
  }
  setLoading(false);
};

  const currentChat = chats.find(c => c.id === currentChatId) || null;

  const contextValue = {
    chats,
    currentChat,
    currentChatId,
    loading,
    newChat,
    selectChat,
    sendMessage,
    user,
    login,
    logout,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContextProvider;