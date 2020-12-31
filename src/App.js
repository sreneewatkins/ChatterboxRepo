import React, { useEffect, useRef, useState } from 'react';  //took out useEffect
import './App.css';
//firebase SDK
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/analytics';
//firebase hooks
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

//identify our project - insert myConfig from firebase website
firebase.initializeApp({
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  //var firebaseConfig = {  this goes 3rd databaseURL: "https://fi...?
    apiKey: "AIzaSyDDv_ycWhvGAVDbWXJVjvK_iiamLN_44HA",
    authDomain: "chatapp-5cfc1.firebaseapp.com",
    databaseURL: "https://console.firebase.google.com/project/chatapp-5cfc1/firestore/data/",
    projectId: "chatapp-5cfc1",
    storageBucket: "chatapp-5cfc1.appspot.com",
    messagingSenderId: "720477821668",
    appId: "1:720477821668:web:459dcee8a81c5feee1eaf1",
    measurementId: "G-3J516L31JF"
  //};
});

//reference to auth and firestore SDK's as global variables
const auth = firebase.auth();
const firestore = firebase.firestore();
const analytics = firebase.analytics();

function App() {

  //this hook returns a user object with id and email and other info if user is signed in, if not user is null
  const [user] = useAuthState(auth);

  return (
    <div className="App">

      <header>
        <h1>⚛️🔥💬Chatterbox</h1>
        <SignOut />
      </header>

      <section>
        {/* ternary operator says if the user is signed in show chatroom else show sign in */}
        {user ? <ChatRoom /> : <SignIn />}
      </section>

    </div>
  );
}
export default App;

function SignIn() {

  const signInWithGoogle = () => {
    //instantiate the provider and pass it to the method signInWithPopup which will trigger the popup window when user clicks the button
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <>  
      {/* listens to click event and runs signInWithGoogle above */}
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
      <p>Do not violate the community guidelines or you will be banned for life!</p>
    </>
  )
}

function SignOut() {

  //check to see if there is a currentuser and display button that triggers signOut fn
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}

function ChatRoom() {

  //useRef hook to reference the dummy prop to enable autoScroll
  const dummy = useRef();

  //in firestore we have a collection of messages. here make a reference to the POINT in the database by calling firestore.collection
  const messagesRef = firestore.collection('messages');
  //make a query that orders the messages by time stamp and limits to the last 25 msgs (could be limitToLast(25))
  const query = messagesRef.orderBy('createdAt').limit(25);

  //listen to updates to the data in real time with useCollectionData hook. it returns an array of objects - ea obj is the chat msg
  //this line REACTS to chgs in real time 
  const [messages] = useCollectionData(query, { idField: 'id' });

  //add a stateful value to our component called a formValue with the useState hook
  const [formValue, setFormValue] = useState('');

  //event handler defined as an async fn in our component that takes the event as its arg.
  const sendMessage = async (e) => {
    
    //stop automatic refresh the page when the form is submitted with this line
    e.preventDefault();

    //grab uid from currentUser
    const { uid, photoURL } = auth.currentUser;

    //add/create a new document in firestore database. takes JS obj as its arg.
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    });

    //reset formValue state to empty string
    setFormValue('');
  }
    //call scrollIntoView when user sends a message
    //dummy.current.scrollIntoView({ behavior: 'smooth' });
    //tutorial used useEffect, video used above line
    useEffect(() => {
      dummy.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages])
    
  return (<>
    <main> 
      {/* map over the array of messages & for ea msg we use a dedicated chat component <ChatMessage w/a key prop with msg.id and passes the document data as the msg prop  */}
      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
   
      {/* empty div or span that references our element with the ref prop and then connect it to our code with the useRef hook */}
      <div ref={dummy}></div>
    </main>

    {/* a way in the UI for user to send a message is the form. call sendMessage when submit button is clicked to write the message to firestore database */}
    <form onSubmit={sendMessage}>

      {/* BIND the input value to the formValue state. when user inputs, we listen w/onchange, and set the value of the chg (e.target.value) to the formValue state using setFormValue*/}
      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="say something nice" />

      <button type="submit" disabled={!formValue}>🕊️</button>

    </form>

  </>)
}

function ChatMessage(props) {
  
  //find the chatmessage child component and show the actual txt by accessing it from the props.message 
  const { text, uid, photoURL } = props.message;

  //compare the uid on the firestore doc to the currently logged in user to tell if sent/received
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (<>

    {/* apply diff styling based on whether the msg was sent/rcvd */}
    <div className={`message ${messageClass}`}>
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} alt="icon URL"/>
      <p>{text}</p>
    </div>

  </>)
}