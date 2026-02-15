import React, { useEffect, useState, useRef } from 'react';
import { Send, Paperclip, Image, FileText, Download, ChevronLeft } from 'lucide-react';

// Routing and Firebase utilities
import { useParams, useNavigate,  } from 'react-router-dom';
import { collection, doc, query, where, orderBy, onSnapshot, getDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { sendMessageLogic } from "../../utils/sendMessage";

// Upload.io client for uploading files/images
import { Upload as UploadClient } from 'upload-js';
import type { UserProfile, Conversation, Message } from '../../component/Interfaces';

const upload = UploadClient({ apiKey: "public_W23MTRB4KCyCEpHHZigugRnUKhMS" });

const Chat: React.FC = () => {
  const { id: routeConversationId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const [conversationId, setConversationId] = useState<string | null>(routeConversationId || null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [otherUser, setOtherUser] = useState<UserProfile & { id: string } | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [uploadingMessages, setUploadingMessages] = useState<Message[]>([]);

  // Responsive state
  const [showMobileChat, setShowMobileChat] = useState(!!routeConversationId);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync state with URL
  useEffect(() => {
    setConversationId(routeConversationId || null);
    setShowMobileChat(!!routeConversationId);
  }, [routeConversationId]);

  // Load conversations
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'conversations'), 
      where('participants', 'array-contains', currentUser.uid));

    const unsub = onSnapshot(q, async (snap) => {
      const items: Conversation[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Conversation));

      items.sort((a, b) => {
        const ta = a.lastUpdated?.toMillis ? a.lastUpdated.toMillis() : a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b.lastUpdated?.toMillis ? b.lastUpdated.toMillis() : b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });

      const otherIds = Array.from(new Set(
        items.map((c) => (c.participants || []).find((p: string) => p !== currentUser.uid)!)
      ));

      const missing = otherIds.filter((id) => id && !userProfiles[id]);
      if (missing.length > 0) {
        const snaps = await Promise.all(missing.map((id) => getDoc(doc(db, 'users', id))));
        const newProfiles: Record<string, UserProfile> = {};
        snaps.forEach((s) => { if (s.exists()) newProfiles[s.id] = s.data(); });
        if (Object.keys(newProfiles).length > 0) setUserProfiles((p) => ({ ...p, ...newProfiles }));
      }

      const enriched = items.map((c) => {
        const otherId = (c.participants || []).find((p: string) => p !== currentUser.uid) || null;
        const profile = otherId ? userProfiles[otherId] : null;
        const displayName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : null;
        return { ...c, otherId, displayName };
      });

      setConversations(enriched);
    });

    return () => unsub();
  }, [currentUser, userProfiles]);

  // Load Messages
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const messagesCol = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesCol, orderBy('createdAt'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    (async () => {
      const convRef = doc(db, 'conversations', conversationId);
      const convSnap = await getDoc(convRef);
      if (convSnap.exists()) {
        const data = convSnap.data() as Conversation;
        const otherId = data.participants.find((p) => p !== currentUser.uid);
        if (otherId) {
          const userSnap = await getDoc(doc(db, 'users', otherId));
          if (userSnap.exists()) setOtherUser({ id: userSnap.id, ...userSnap.data() });
        }
      }
    })();

    return () => unsub();
  }, [conversationId, currentUser]);

  const handleSend = () => {
    const text = inputMessage.trim();
    if (!text || !conversationId || !currentUser) return;

    // Restore original sendMessageLogic parameters
    sendMessageLogic(currentUser, conversationId, "text", { text });
    setInputMessage("");
  };

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, kind: 'file' | 'image') {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !currentUser) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      senderId: currentUser.uid,
      type: kind,
      fileName: file.name,
      text: 'Uploading...',
      createdAt: Timestamp.now(),
      content: undefined
    };

    setUploadingMessages((prev) => [...prev, tempMessage]);

    try {
      const { fileUrl } = await upload.uploadFile(file);
      setUploadingMessages((prev) => prev.filter((m) => m.id !== tempId));

      // Restore original sendMessageLogic parameters for files
      await sendMessageLogic(currentUser, conversationId, kind === 'image' ? 'image' : 'file', {
        fileName: file.name,
        fileUrl,
      });
    } catch (err) {
      alert('Failed to upload');
      setUploadingMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }

  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${id}`);
    setShowMobileChat(true);
  };

  const getDisplayName = (uid: string | undefined | null) => {
    if (!uid) return '';
    if (uid === currentUser?.uid) return 'You';
    const p = userProfiles[uid];
    return p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : uid;
  };

  return (
    <div className="flex h-[calc(80vh-40px)] md:px-5 lg:px-10 overflow-hidden bg-white">
      {/* Sidebar: Visible on Desktop, Hidden on Mobile if chat is open */}
      <div className={`${showMobileChat ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 border-r border-gray-200 overflow-hidden bg-white`}>
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-3xl font-bold font-petrona text-[#1E4263]">Chat</h4>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`flex items-center p-3 cursor-pointer border-l-4 transition-all ${
                conversationId === conv.id ? "border-l-[#E0A817] bg-gray-50" : "border-l-transparent hover:bg-gray-50"
              }`}
            >
              <div className="w-12 h-12 rounded-full mr-3 overflow-hidden bg-gray-200 flex-shrink-0">
                {conv.otherId && userProfiles[conv.otherId]?.photoURL ? (
                  <img src={userProfiles[conv.otherId].photoURL} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">U</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-sm truncate text-gray-900">{conv.displayName || 'User'}</h3>
                  {conv.unread && <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>}
                </div>
                <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat: Visible on Desktop, Hidden on Mobile if list is open */}
      <div className={`${!showMobileChat ? 'hidden' : 'flex'} md:flex flex-1 flex-col overflow-hidden bg-white`}>
        {conversationId && otherUser ? (
          <>
            {/* Header */}
            <div className="flex items-center p-4 bg-gradient-to-br from-[#3D6A89] via-[#378692] to-[#5AB3B6] text-white">
              <button onClick={() => setShowMobileChat(false)} className="md:hidden mr-2">
                <ChevronLeft size={24} />
              </button>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 mr-3">
                {otherUser.photoURL && <img src={otherUser.photoURL} className="w-full h-full object-cover" alt="" />}
              </div>
              <h3 className="font-medium">{otherUser.firstName} {otherUser.lastName}</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#f8fafc]">
              <div className="flex flex-col gap-4">
                {[...messages, ...uploadingMessages].map((msg) => {
                  const isMe = msg.senderId === currentUser?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-xl p-3 rounded-xl shadow-sm ${
                        isMe ? 'bg-[#B1CFD3] text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 border rounded-tl-none'
                      }`}>
                        <div className="text-[10px] opacity-50 mb-1">{getDisplayName(msg.senderId)}</div>
                        
                        {msg.text === 'Uploading...' ? (
                           <div className="animate-pulse flex items-center gap-2 italic text-gray-400">Uploading {msg.fileName}...</div>
                        ) : msg.type === 'image' ? (
                          <img src={msg.fileUrl} className="max-w-full rounded-lg" alt="" />
                        ) : msg.type === 'file' ? (
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/5 rounded underline">
                            <FileText size={18}/> {msg.fileName} <Download size={14}/>
                          </a>
                        ) : (
                          <p className="text-sm">{msg.text}</p>
                        )}

                        <div className="text-[10px] opacity-40 text-right mt-1">
                          {msg.createdAt instanceof Timestamp ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="p-4 ">
              <div className="flex items-end gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Message..."
                  rows={1}
                  className="flex-1 p-2 border  rounded-lg focus:outline-none focus:ring-1 focus:ring-[#378692] resize-none"
                />
                <div className="flex gap-1">
                  <button onClick={() => imageInputRef.current?.click()} className="p-2 text-gray-500"><Image size={20}/></button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500"><Paperclip size={20}/></button>
                  <button onClick={handleSend} className="p-2 bg-[#378692] text-white rounded-full"><Send size={20}/></button>
                </div>
              </div>
              <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => handleFileChange(e, 'file')} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 italic">Select a conversation to start</div>
        )}
      </div>
    </div>
  );
};

export default Chat;