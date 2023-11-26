import React, { useState } from 'react';
import {over} from 'stompjs';
import SockJS from 'sockjs-client';

var stompClient=null;
const ChatRoom = () => {
  const [publicChat, setPublicChat] = useState([]);
  const [privateChat, setPrivateChat] = useState(new Map());
  const [tab, setTab] = useState("CHATROOM")
  const [userData, setUserData] = useState({
    username:"",
    recievername:"",
    connected: false,
    message:""
  })

  const handleUserName = (event) => {
    const {value}=event.target;
    setUserData({...userData, "username":value});
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
  const onError = (err) => {
    console.log(err);
  }
  return (
    <div className="container">
      {/* if it's not connected then you need to input name */}
      {userData.connected?
      <div className='chat-box'>
        <div className='member-list'>
          <ul>
            <li onClick={()=>{setTab("CHATROOM")}} className={`member ${tab==="CHATROOM"}`}>Chatroom</li>
            {[...privateChat.keys()].map((name, index)=>(
              <li className={`member ${tab===name && "active"}`} key={index}>
                {name}
              </li>
            ))}
          </ul>
        </div>
        {tab==="CHATROOM" && <div className='chat-content'>
          <ul className='chat-messages'>
          {publicChat.map((chat,index)=> (
            <li className='message' key={index}>
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
            placeholder='enter your message' 
            value={userData.message}
            onChange={handleMessage}
            />
            <button type="button" className='send-button' onClick={sendPublicMessage}>Send</button>
          </div>
      </div>}
      {tab!=="CHATROOM" && <div className='chat-content'>
      <ul className='chat-messages'>
          {[...publicChat.get(tab)].map((chat,index)=> (
            <li className='message' key={index}>
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
            placeholder={`enter message for ${tab}`}
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
      placeholder='Enter the user name'
      value={userData.username}
      onChange={handleUserName}
      />
      <button type="button" onClick={registerUser}>Connect</button>
      </div>}
      </div>
  )
}

export default ChatRoom;