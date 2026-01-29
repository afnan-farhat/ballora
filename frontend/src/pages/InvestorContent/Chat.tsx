// React hooks and UI components
import React, { useEffect, useState, useRef } from 'react';
import { Send, Paperclip, Image, FileText, Download } from 'lucide-react';

// Routing and Firebase utilities
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, doc, query, where, orderBy, onSnapshot, getDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { sendMessageLogic } from "../../utils/sendMessage";

// Upload.io client for uploading files/images
import { Upload as UploadClient } from 'upload-js';
import type { UserProfile, Conversation, Message } from '../../component/Interfaces';



// Main Chat component
const Chat: React.FC = () => {

  // Extract conversation ID from URL
  const { id: routeConversationId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState<string | null>(routeConversationId || null);

  // State variables for managing conversations, users, and messages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [otherUser, setOtherUser] = useState<UserProfile & { id: string } | null>(null);

  // Cache of all user profiles (keyed by UID)
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  // Refs for file/image inputs and scrolling to the end of messages
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Get the currently authenticated user
  const currentUser = auth.currentUser;

  const [uploadingMessages, setUploadingMessages] = useState<Message[]>([]);

  const upload = UploadClient({ apiKey: "public_W23MTRB4KCyCEpHHZigugRnUKhMS" });

  // Effect to load user's conversations from Firestore
  useEffect(() => {
    if (!currentUser) return;




    //-------------------------------------------------------------------------------------
    //1- Query conversations where current user is a participant
    //-------------------------------------------------------------------------------------


    const q = query(collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid));

    const unsub = onSnapshot(q, async (snap) => {


      // Map Firestore docs to Conversation type
      const items: Conversation[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Conversation));



      //-------------------------------------------------------------------------------------
      // 2- Sort conversations by last updated or created time
      //-------------------------------------------------------------------------------------

      items.sort((a, b) => {
        const ta = a.lastUpdated?.toMillis ? a.lastUpdated.toMillis() : a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b.lastUpdated?.toMillis ? b.lastUpdated.toMillis() : b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });



      //-------------------------------------------------------------------------------------
      // 3-  conversations with other participant's profile data
      //-------------------------------------------------------------------------------------

      (async () => {
        try {


          // Collect all other user IDs

          const otherIds = Array.from(new Set(
            items.map((c) => (c.participants || []).find((p: string) => p !== currentUser.uid)!)
          ));

          // Fetch profiles that are missing in cache
          const missing = otherIds.filter((id) => !userProfiles[id]);
          if (missing.length > 0) {
            const snaps = await Promise.all(missing.map((id) => getDoc(doc(db, 'users', id))));
            const newProfiles: Record<string, UserProfile> = {};
            snaps.forEach((s) => {
              if (s.exists()) newProfiles[s.id] = s.data();
            });
            if (Object.keys(newProfiles).length > 0) setUserProfiles((p) => ({ ...p, ...newProfiles }));
          }


          // Map conversations with displayName & otherId from cache

          const informations: Conversation[] = items.map((c) => {
            const otherId = (c.participants || []).find((p: string) => p !== currentUser.uid) || null;
            const profile = otherId ? userProfiles[otherId] : null;
            const displayName = (profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : '') || null;
            return { ...c, otherId, displayName };
          });

          setConversations(informations);
        } catch (err) {
          console.error('Error enriching conversations', err);

        }
      })();
    });

    // Cleanup listener on unmount
    return () => unsub();
  }, [currentUser, userProfiles]);




  //---------------------------------------------------------------
  //4- Update conversationId if route param changes
  //---------------------------------------------------------------


  useEffect(() => {
    if (routeConversationId) setConversationId(routeConversationId);
  }, [routeConversationId]);




  //---------------------------------------------------------------
  //4- Load messages and other user info when conversationId changes
  //---------------------------------------------------------------

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setOtherUser(null);
      return;
    }


  //---------------------------------------------------------------
  //5-   messages in the selected conversation
  //---------------------------------------------------------------


    const messagesCol = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesCol, orderBy('createdAt'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = [];
      snap.forEach((d) => {
        const data = d.data() as Omit<Message, 'id'>;
        msgs.push({ id: d.id, ...data });
      });
      setMessages(msgs);
      // scroll to bottom automatically
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    // fetch conversation to get the other participant info
    (async () => {
      const convRef = doc(db, 'conversations', conversationId);
      const convSnap = await getDoc(convRef);
      if (convSnap.exists()) {
        const data = convSnap.data() as Conversation;
        const participants: string[] = data.participants || [];
        const otherId: string | null = participants.find((p) => p !== currentUser?.uid) || null;
        if (otherId) {
          // prefer leaderProfile passed via navigation state (faster/more reliable)
          const navState = location.state as { leaderId?: string; leaderProfile?: UserProfile };
          if (navState?.leaderId === otherId && navState?.leaderProfile) {
            setOtherUser({ id: otherId, ...navState.leaderProfile });
          } else {
            const userSnap = await getDoc(doc(db, 'users', otherId));
            if (userSnap.exists()) setOtherUser({ id: userSnap.id, ...userSnap.data() });
            else setOtherUser({ id: otherId });
          }
        }
      }
    })();

    return () => unsub();
  }, [conversationId, currentUser, location.state]);









  const handleSelectConversation = (convId: string) => {
    setConversationId(convId); // select conversation
    navigate(`/chat/${convId}`);
  };



  const getDisplayName = (uid: string | undefined | null) => {
    if (!uid) return '';
    if (uid === currentUser?.uid) return 'You';
    const p = userProfiles[uid];
    if (p) return `${p.firstName || ''} ${p.lastName || ''}`.trim();
    if (otherUser && otherUser.id === uid) return `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim();
    return uid;
  };


  const handleSend = () => {
    const text = inputMessage.trim();
    if (!text || !conversationId || !currentUser) return;

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
    };

    setUploadingMessages((prev) => [...prev, tempMessage]);

    try {
      const { fileUrl } = await upload.uploadFile(file);

      setUploadingMessages((prev) => prev.filter((m) => m.id !== tempId));

      await sendMessageLogic(currentUser, conversationId, kind === 'image' ? 'image' : 'file', {
        fileName: file.name,
        fileUrl,
       
      });


    } catch (err) {
      console.error('file send error', err);
      alert('Failed to upload file');
      setUploadingMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      if (e.target) (e.target as HTMLInputElement).value = '';
    }
  }


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  return (
    <div className="flex flex-col h-[80vh] px-20 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col w-80 bg-white border-r border-gray-200 overflow-hidden">
          {/* Sidebar Header */}
          <div className="text-left font-petrona border-b border-gray-200 pb-1">
            <h4 className="text-[44px] font-bold font-petrona text-[#1E4263]">Chat</h4>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto pr-[15px]">
            {conversations.map((conv) => {
              const otherId =
                conv.otherId ||
                conv.participants.find((p: string) => p !== currentUser?.uid);
              const title =
                conv.displayName || getDisplayName(otherId) || "Conversation";
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`flex items-center p-[0.3rem] cursor-pointer border-l-4 transition-all duration-200 text-sm ${conversationId === conv.id
                    ? "border-l-[#E0A817]"
                    : "border-l-transparent hover:bg-gray-50"
                    }`}
                >
                  {/* User Avatar */}
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 overflow-hidden bg-gray-300 text-gray-500 font-medium">
                    {otherId && userProfiles[otherId]?.photoURL ? (
                      <img
                        src={userProfiles[otherId].photoURL}
                        alt={userProfiles[otherId].firstName || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      otherId && (userProfiles[otherId]?.firstName?.[0].toUpperCase() || 'U')
                    )}
                  </div>



                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900">{title}</h3>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">
                          {conv.lastUpdated?.toDate
                            ? conv.lastUpdated.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''
                          }
                        </span>
                        {conv.unread && (
                          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conv.lastMessage || ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          {conversationId && (
            <div className="flex items-center p-4 bg-gradient-to-br from-[#3D6A89] via-[#378692] to-[#5AB3B6] text-white">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 font-medium overflow-hidden bg-white/20">
                {otherUser?.photoURL ? (
                  <img
                    src={otherUser.photoURL}
                    alt={otherUser.firstName || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  otherUser?.firstName ? otherUser.firstName[0].toUpperCase() : 'U'
                )}
              </div>


              <h3 className="text-lg font-medium">
                {otherUser?.firstName ? `${otherUser.firstName} ${otherUser.lastName || ''}` : otherUser?.id}
              </h3>
            </div>
          )}

          {/* Messages Area */}
          {conversationId ? (
            <>
              <div className="flex-1 overflow-y-auto p-1.5 bg-gradient-to-br from-white to-[#eaf4f4]">
                <div className="flex flex-col gap-4">
                  {[...messages, ...uploadingMessages].map((message) => (
                    <div key={message.id} className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xl p-3 rounded-md ${message.senderId === currentUser?.uid
                        ? 'bg-[#B1CFD3] text-black'
                        : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        <div className="text-xs text-gray-500 mb-1">{getDisplayName(message.senderId)}</div>

                        {message.text === 'Uploading...' ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            <span> {message.fileName}</span>
                          </div>
                        ) : message.type === 'file' ? (
                          <div className="flex items-center gap-3">
                            <div className="p-1 bg-[#AC6B61] rounded-sm text-white">
                              <FileText />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm m-0">{message.fileName}</p>
                              <p className="text-xs opacity-75 m-0">{message.fileSize}</p>
                            </div>
                            {message.fileUrl && (
                              <a href={message.fileUrl} target="_blank" rel="noreferrer" className="p-1 rounded-sm hover:bg-black/10 transition">
                                <Download />
                              </a>
                            )}
                          </div>
                        ) : message.type === 'image' ? (
                          <div>
                            <img src={message.fileUrl} alt={message.fileName} className="max-w-full h-auto rounded-sm" />
                            <p className="text-xs opacity-75 mt-1">{message.fileName}</p>
                          </div>
                        ) : (
                          <p className="text-sm m-0">{message.text}</p>
                        )}

                        <p className={`text-xs mt-1 opacity-75 text-left ${message.senderId === currentUser?.uid ? 'text-gray-700' : 'text-gray-400'}`}>
                          {message.createdAt && 'toDate' in message.createdAt ? message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input Area */}
              <div className="p-4 flex-shrink-0">
                <div className="flex items-end gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message"
                      rows={1}
                      className="w-full p-3 border border-gray-200 rounded-md resize-none text-sm focus:outline-none focus:ring-2 focus:ring-[#378692]"
                    />

                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="p-3 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                    >
                      <Image />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                    >
                      <Paperclip />
                    </button>
                    <button
                      onClick={handleSend}
                      className="p-3 rounded-full bg-gradient-to-br from-[#3D6A89] via-[#378692] to-[#5AB3B6] text-white hover:from-[#20465f] hover:via-[#24646e] hover:to-[#3b878a] transition"
                    >
                      <Send />
                    </button>
                  </div>
                </div>

                {/* Hidden Inputs */}
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={(e) => handleFileChange(e, 'image')}
                  accept="image/*"
                  className="hidden"
                  data-testid="image-input"
                />

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e, 'file')}
                  accept=".pdf"
                  className="hidden"
                  data-testid="file-input"
                />

              </div>
            </>
          ) : (
            // Empty State
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-[#eaf4f4]">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="flex gap-1">
                    <div className="w-8 h-8 bg-[#378692] rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                    <div className="w-8 h-8 bg-[#5ca4af] rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Select a conversation</h3>
                <p className="text-gray-500">or start a chat from idea details</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Chat;