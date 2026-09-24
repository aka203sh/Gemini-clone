// import React from 'react'
// import Sidebar from './components/sidebar/Sidebar'
// import Main from './components/main/main'
// import ChatContextProvider from './context/ChatContext'
// import { auth } from './firebase'
// console.log("Firebase auth object:", auth);
// const App = () => {
//   return (
//     <ChatContextProvider>
//       <Sidebar/>
//       <Main/>
//     </ChatContextProvider>
//   )
// }

// export default App                console.firebase.google.com

import React from 'react'
import Sidebar from './components/sidebar/Sidebar'
import Main from './components/main/Main'
import ChatContextProvider from './context/ChatContext'

const App = () => {
  return (
    <ChatContextProvider>
      <Sidebar/>
      <Main/>
    </ChatContextProvider>
  )
}

export default App