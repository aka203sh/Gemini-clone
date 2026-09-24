// import React, { useState } from 'react'
// import './Sidebar.css'
// import {assets} from '../../assets/assets'

// const Sidebar = () => {

//   const [extended,setExtended] = useState(false)
//   return (
//     <div className='sidebar'>
//       <div className="top">
//         <img className="menu" onClick={()=>setExtended(prev=>!prev)} src={assets.menu_icon} alt="" />
//         <div className="new-chat">
//           <img src={assets.plus_icon} alt="" />
//           {extended?<p>New Chat</p>:null}
//         </div>
//         {extended?
//           <div className="recent">
//             <p className="recent-title">Recent</p>
//             <div className="recent-entry">
//               <img src={assets.message_icon} alt="" />
//               <p>What is react ...</p>
//             </div>
//           </div>: null
//         }
//       </div>
//       <div className="bottom">
//         <div className="bottom-item recent-entry">
//           <img src={assets.question_icon} alt=""  />
//           {extended?<p> Help</p>:null}
//         </div>
//         <div className="bottom-item recent-entry">
//           <img src={assets.history_icon} alt=""  />
//           {extended?<p> Activity</p>:null}
//         </div>
//         <div className="bottom-item recent-entry">
//           <img src={assets.setting_icon} alt=""  />
//           {extended?<p> Setting</p>:null}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default Sidebar


import React, { useState, useContext } from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { ChatContext } from '../../context/ChatContext'

const Sidebar = () => {
  const [extended, setExtended] = useState(false)
  const { chats, currentChatId, newChat, selectChat } = useContext(ChatContext);

  return (
    <div className='sidebar'>
      <div className="top">
        <img className="menu" onClick={()=>setExtended(prev=>!prev)} src={assets.menu_icon} alt="" />
        <div className="new-chat" onClick={newChat}>
          <img src={assets.plus_icon} alt="" />
          {extended?<p>New Chat</p>:null}
        </div>
        {extended?
          <div className="recent">
            <p className="recent-title">Recent</p>
            {chats.map(chat => (
              <div
                key={chat.id}
                className={`recent-entry ${chat.id === currentChatId ? 'active' : ''}`}
                onClick={() => selectChat(chat.id)}
              >
                <img src={assets.message_icon} alt="" />
                <p>{chat.title}</p>
              </div>
            ))}
          </div>: null
        }
      </div>
      <div className="bottom">
        <div className="bottom-item recent-entry">
          <img src={assets.question_icon} alt=""  />
          {extended?<p> Help</p>:null}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.history_icon} alt=""  />
          {extended?<p> Activity</p>:null}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.setting_icon} alt=""  />
          {extended?<p> Setting</p>:null}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
