import React, { useState } from 'react';
import { over } from 'stompjs';
// import SockJS from 'sockjs-client';
import SockJS from 'sockjs-client/dist/sockjs';
//the global is undefined error was because global is only available in Node.js environment
//the solution for this error is using the built version for use this library in browser

var stompClient=null;
const ChatRoom = () => {
  const [publicChat, setPublicChat] = useState([]);
  const [privateChat, setPrivateChat] = useState(new Map());
  const [tab, setTab] = useState("CHATROOM")
  const [memberList, setMemberList] = useState([]);
  const [userData, setUserData] = useState({
    username:"",
    receivername:"",
    connected: false,
    message:""
  })

  const handleValue = (event) => {
    const {value, name}=event.target;
    setUserData({...userData, [name]:value});
  }

  const handleMessage = (event) => {
    const {value}=event.target;
    setUserData({...userData, "message":value});
  }

  const registerUser = () => {
    let Sock=new SockJS("http://localhost:8080/ws")
    stompClient=over(Sock);
    stompClient.connect({}, onConnected, onError);
  }

  const onConnected = () => {
    setUserData({...userData, "connected": true})
    stompClient.subscribe('/chatroom/public', onPublicMessageReceived);
    stompClient.subscribe('/user/'+userData.username+'/private', onPrivateMessageReceived);
    userJoin();
  }
  const userJoin = () => {
    let chatMessage = {
      senderName:userData.username,
      message:userData.message,
      status:'JOIN'
    };
    setMemberList((prevMembers)=> [...prevMembers, userData.username]);
    stompClient.send('/app/message', {}, JSON.stringify(chatMessage));
  }

  const onPublicMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload.body);
    switch(payloadData.status){
      case "JOIN":
          if(!privateChat.get(payloadData.senderName)){
            privateChat.set(payloadData.senderName,[]);
      setPrivateChat(new Map(privateChat));
          }
        break;
      case "MESSAGE":
        publicChat.push(payloadData)
        setPublicChat([...publicChat])
        break;
    }
  }
  const onPrivateMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload);
    if(privateChat.get(payloadData.senderName)){
      privateChat.get(payloadData.senderName).push(payloadData);
      setPrivateChat(new Map(privateChat));
    }else {
      let list=[];
      list.push(payloadData);
      privateChat.set(payloadData.senderName,list);
      setPrivateChat(new Map(privateChat));
    }
  }

  const sendPublicMessage = () => {
    if (stompClient){
      let chatMessage={
        senderName:userData.username,
        message:userData.message,
        status: 'MESSAGE'
      };
      stompClient.send('/app/message',{},JSON.stringify(chatMessage));
      setUserData({...userData,"message":""});
    }
  }
  const sendPrivateMessage = () => {
    if (stompClient){
      let chatMessage={
        senderName:userData.username,
        receivername:tab,
        message:userData.message,
        status: 'MESSAGE'
      };
      let privateChatMessages = privateChat.get(tab) || [];
      privateChatMessages.push(chatMessage);
      privateChat.set(tab, privateChatMessages);
      stompClient.send('/app/message',{},JSON.stringify(chatMessage));
      setUserData({...userData,"message":""});
    }
  }
  const onError = (err) => {
    console.log(err);
  }
  return (
    <>
    <div className='logo'><p className='logo-letter'>ChatRoom</p></div>
    <div className="container">
      {/* if it's not connected then you need to input name */}
      
      {userData.connected? 
      <div className='chat-box'>
        <div className='row-container'>
        <div className='member-list'>
          <ul type="none">
          <li onClick={()=>{setTab("CHATROOM")}} className={`member ${tab==="CHATROOM" && "active"}`}>Chatroom</li>
          {[...privateChat.keys()].map((name, index)=>(
              <li type="none" onClick={()=>{setTab(name)}} className={`member ${tab===name && "active"}`} key={index}>
                {name}
              </li>
            ))}
          </ul>
        </div>

        {tab==="CHATROOM" && <div className='chat-content'>
        <div className='feed'>
          <div className='message-feed'>
          <ul className='chat-messages'>
          {publicChat.map((chat,index)=> (
            <li className='message' key={index} type="none">
              {chat.senderName !==userData.username && <div className='avatar'>
                {chat.senderName}
                </div>}
                <div className='message-data'>{chat.message}</div>
                {chat.senderName ===userData.username && <div className='avatar self'>
                {chat.senderName}
                </div>}  
            </li>
          ))}
          </ul>
          </div>
          <div className='chat-update'>
          <ul className='private-chat-messages'>
            {[...privateChat.keys()].map((name, index)=>(
              <li type="none" onClick={()=>{setTab(name)}} className={`member ${tab===name && "active"}`} key={index}>
                {name} joined chatroom.
              </li>
            ))}
          </ul>
        </div>
        </div>
          <div className='send-messages'>
            <input type="text" 
            className='input-message' 
            placeholder='@All' 
            value={userData.message}
            onChange={handleMessage}
            />
            <button type="button" className='send-button' onClick={sendPublicMessage}>Send</button>
          </div>
      </div>}
      </div>
      {tab!=="CHATROOM" && <div className='chat-content'>
      <ul className='send-messages'>
        {[...privateChat.get(tab)].map((chat,index)=> (
            <li className={`message ${chat.senderName === userData.username && "self"}`} key={index}>
              {chat.senderName !==userData.username && <div className='avatar'>
                {chat.senderName}
                </div>}
                <div className='message-data'>{chat.message}</div>
                {chat.senderName ===userData.username && <div className='avatar self'>
                {chat.senderName}
                </div>}  
            </li>
          ))}
          </ul>
          <div className='send-messages'>
            <input type="text" 
            className='input-message'
            name='message' 
            placeholder={`@${tab}`}
            value={userData.message}
            onChange={handleMessage}
            />
            <button type="button" className='send-button' onClick={sendPrivateMessage}>Send</button>
          </div>
      </div>}
      </div>
      :
      <div className='register'>
        <input
      id='user-name'
      name='username'
      placeholder='Enter the user name'
      value={userData.username}
      onChange={handleValue}
      required
      />
      <button type="button" onClick={registerUser}>Connect</button>
      </div>}
      </div>
      </>
  )
}

export default ChatRoom;