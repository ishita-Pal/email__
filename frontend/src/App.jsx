import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EmailList from "./components/EmailList";
import EmailDetail from "./components/EmailDetail";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EmailList />} />
        <Route path="/email/:id" element={<EmailDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
