import { useState, useContext, useRef } from 'react'
import './Main.css'
import { assets } from '../../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import html2pdf from 'html2pdf.js'

const Main = () => {
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // { base64, mimeType, previewUrl, fileName }
  const [converting, setConverting] = useState(false);
  const fileInputRef = useRef(null);
  const { currentChat, loading, sendMessage, user, login, logout } = useContext(ChatContext);

  const convertHtmlToPdfBase64 = async (htmlContent) => {
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.padding = '20px';
    container.style.fontFamily = 'Arial, sans-serif';

    const opt = {
      margin: 10,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const dataUriString = await html2pdf().set(opt).from(container).outputPdf('datauristring');
    const base64 = dataUriString.split(',')[1];
    return base64;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type;

    // Images and PDFs: send as raw bytes directly, Gemini reads them natively
    if (fileType.startsWith('image/') || fileType === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        setSelectedImage({
          base64,
          mimeType: fileType,
          previewUrl: fileType === 'application/pdf' ? null : URL.createObjectURL(file),
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
      return;
    }

    // Word documents: convert to HTML, then to a real PDF
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        setConverting(true);
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const base64Pdf = await convertHtmlToPdfBase64(result.value);
        setSelectedImage({
          base64: base64Pdf,
          mimeType: 'application/pdf',
          previewUrl: null,
          fileName: file.name.replace(/\.docx$/i, '.pdf'),
        });
      } catch (err) {
        console.error("Word to PDF conversion error:", err);
        alert("Could not convert this Word document. Please try another file.");
      }
      setConverting(false);
      e.target.value = "";
      return;
    }

    // Excel sheets: convert to HTML table, then to a real PDF
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel'
    ) {
      try {
        setConverting(true);
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        let combinedHtml = '';
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          combinedHtml += `<h3>${sheetName}</h3>` + XLSX.utils.sheet_to_html(sheet);
        });
        const base64Pdf = await convertHtmlToPdfBase64(combinedHtml);
        setSelectedImage({
          base64: base64Pdf,
          mimeType: 'application/pdf',
          previewUrl: null,
          fileName: file.name.replace(/\.xlsx?$/i, '.pdf'),
        });
      } catch (err) {
        console.error("Excel to PDF conversion error:", err);
        alert("Could not convert this Excel file. Please try another file.");
      }
      setConverting(false);
      e.target.value = "";
      return;
    }

    alert("Unsupported file type. Please upload an image, PDF, Word doc, or Excel sheet.");
    e.target.value = "";
  };

  const onSend = async () => {
    if (!input.trim() && !selectedImage) return;
    const currentInput = input;
    const currentImage = selectedImage;
    setInput("");
    setSelectedImage(null);
    await sendMessage(currentInput, currentImage);
  };

  const renderMarkdown = (text) => (
    <ReactMarkdown
      components={{
        code({node, inline, className, children, ...props}) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>{children}</code>
          );
        }
      }}
    >
      {text}
    </ReactMarkdown>
  );

  const messages = currentChat ? currentChat.messages : [];

  return (
    <div className='main'>
      <div className="nav">
        <p>Gemini</p>
        <div className="nav-right">
          {user ? (
            <img
              className="user-photo"
              src={user.photoURL}
              alt="profile"
              onClick={logout}
              title="Click to log out"
              referrerPolicy="no-referrer"
            />
          ) : (
            <button className="login-btn" onClick={login}>Sign in with Google</button>
          )}
        </div>
      </div>
      <div className="main-container">

        {messages.length === 0 ? (
          <>
            <div className="greet">
              <p><span>Hello, Dev.</span></p>
              <p className="">How Can I help you today?</p>
            </div>
            <div className="cards">
              <div className="card">
                <p>Suggest beautiful places to use on an upcoming road trip</p>
                <img src={assets.compass_icon} alt=""/>
              </div>
              <div className="card">
                <p>Briefly summarize this concept: urban planning</p>
                <img src={assets.bulb_icon} alt=""/>
              </div>
              <div className="card">
                <p>Brainstrom team bonding activities for our work retreat</p>
                <img src={assets.message_icon} alt=""/>
              </div>
              <div className="card">
                <p>Improve the readability of the following code</p>
                <img src={assets.code_icon} alt=""/>
              </div>
            </div>
          </>
        ) : (
          <div className="result">
            {messages.map((msg, index) => (
              <div key={index} className="result-block">
                <div className="result-title">
                  {msg.attachment && (
                    msg.attachment.previewUrl ? (
                      <img src={msg.attachment.previewUrl} alt="sent" className="sent-image" />
                    ) : (
                      <div className="sent-file-chip">📄 {msg.attachment.fileName}</div>
                    )
                  )}
                  <p>{msg.question}</p>
                </div>
                {msg.answer ? (
                  <div className="result-data">{renderMarkdown(msg.answer)}</div>
                ) : (
                  loading && index === messages.length - 1 && <p>Loading...</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="main-bottom">
          <div className="search-box">
            {converting && (
              <div className="image-preview">
                <span className="file-chip">Converting file to PDF...</span>
              </div>
            )}
            {selectedImage && !converting && (
              <div className="image-preview">
                {selectedImage.previewUrl ? (
                  <img src={selectedImage.previewUrl} alt="selected" />
                ) : (
                  <span className="file-chip">📄 {selectedImage.fileName}</span>
                )}
                <span className="remove-btn" onClick={() => setSelectedImage(null)}>✕</span>
              </div>
            )}
            <input
              type="text"
              placeholder='Enter a prompt here'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }}
            />
            <div className="">
              <input
                type="file"
                accept="image/*,application/pdf,.docx,.xlsx,.xls"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <img
                src={assets.gallery_icon}
                alt=""
                onClick={() => fileInputRef.current.click()}
                style={{ cursor: 'pointer' }}
              />
              {/* <img src={assets.mic_icon} alt="" /> */}
              <img src={assets.send_icon} alt="" onClick={onSend} style={{ cursor: 'pointer' }} />
            </div>
          </div>
          <p className="bottom-info">
            Gemini may display inaccurate info, including about people, so double-check its responses. your privacy and Gemini Apps.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Main