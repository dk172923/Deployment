import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Card, ProgressBar } from 'react-bootstrap';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-monokai';
import FacePhoneDetection from '../Components/FacePhoneDetection';
//import '../TestPage.css'; // Custom CSS file for additional styling

const TestPage = () => {
  const navigate = useNavigate();
  const { testId } = useParams(); // Get testId from the URL
  const [testDetails, setTestDetails] = useState(null); // Store test details
  const [currentSection, setCurrentSection] = useState('objective'); // Track which section to show
  const [answers, setAnswers] = useState({}); // Store answers for each question
  const [timeLeft, setTimeLeft] = useState(0); // Timer state
  const [score, setScore] = useState(null); // Store total score after submission
  const location = useLocation();
  const { studentData } = location.state || {};

  const [output, setOutput] = useState(''); // For coding output
  const [codeLanguage, setCodeLanguage] = useState('javascript'); // Default language for coding questions
  const [loading, setLoading] = useState(true); // Loading state for the entire test UI
  const [timerStarted, setTimerStarted] = useState(false); // Track if the timer has started

  // Fetch the test details when the component mounts
  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/tests/${testId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch test details');
        }
        const data = await response.json();
        setTestDetails(data);
        setTimeLeft(data.duration * 60); // Convert duration to seconds

        // Set a timer to simulate loading for 10 seconds
        setTimeout(() => {
          setLoading(false); // Set loading to false after 10 seconds
          setTimerStarted(true); // Start the timer after loading
        }, 10000); // 10 seconds
      } catch (error) {
        console.error(error);
      }
    };

    fetchTestDetails();
  }, [testId]);

  // Timer setup to count down after loading
  useEffect(() => {
    if (timerStarted && timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerId);
            handleSubmitTest(); // Submit test when time is up
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [timerStarted, timeLeft]);

  // Handle answer changes
  const handleAnswerChange = (questionId, value) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };

  // Handle code language change
  const handleLanguageChange = (e) => {
    setCodeLanguage(e.target.value);
  };

  // Code execution using CodeX API
  const executeCode = async (code) => {
    const payload = {
      code: code,
      language: codeLanguage === 'javascript' ? 'js' : 'py',
      input: '',
    };

    try {
      const response = await fetch('http://localhost:3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload).toString(),
      });

      const result = await response.json();
      console.log("Result: ", result);
      if (result.status === 200) {
        setOutput(result.output || 'No output generated');
        return result.output; // Return output for comparison
      } else {
        setOutput(result.error || 'Error executing code');
        return null; // Handle error case
      }
    } catch (error) {
      console.error('Error executing code:', error);
      setOutput('Error executing code');
      return null; // Handle error case
    }
  };

  // Submit the test
  const handleSubmitTest = async () => {
    let correctCount = 0;
    const subjectiveScores = [];
    const codingScores = [];
    const sectionScores = {
      objective: 0,
      subjective: [],
      coding: [],
    };

    if (testDetails) {
      for (const question of testDetails.questions) {
        if (question.type === 'objective') {
          const userAnswer = answers[question._id];
          if (userAnswer === question.answer) {
            correctCount++;
            sectionScores.objective++;
          }
        } else if (question.type === 'subjective') {
          const userAnswer = answers[question._id];
          const response = await fetch('http://localhost:5000/api/evaluate-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: question.question, answer: userAnswer }),
          });
          const data = await response.json();
          subjectiveScores.push(data.score);
          sectionScores.subjective.push(data.score);
        } else if (question.type === 'coding') {
          const userAnswer = answers[question._id];
          if (!userAnswer) {
            console.error('User has not provided a code answer');
            codingScores.push(0); // No answer, award 0 points
            continue; // Skip to the next question
          }

          const executionResult = await executeCode(userAnswer); // Wait for code execution
          console.log(executionResult);
          const correctAnswer = question.answer;

          if (executionResult.trim() === correctAnswer.trim()) {
            codingScores.push(10);
          } else {
            codingScores.push(0); // No points if it doesn't match
          }
        }
      }

      const totalSubjectiveScore = subjectiveScores.reduce((acc, score) => acc + score, 0);
      sectionScores.subjective = totalSubjectiveScore;

      const totalCodingScore = codingScores.reduce((acc, score) => acc + score, 0);
      sectionScores.coding = totalCodingScore;

      const totalScore = correctCount + totalSubjectiveScore + totalCodingScore;
      const scorePercentage = (totalScore / (correctCount + subjectiveScores.length * 10 + codingScores.length * 10)) * 100;
      setScore(scorePercentage);

      const finalResults = {
        testDetails,
        studentDetails: studentData,
        scores: sectionScores,
      };

      try {
        const response = await fetch('http://localhost:5000/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalResults),
        });
        if (!response.ok) {
          throw new Error('Failed to store results in the database');
        }
        navigate('/submission', { state: finalResults });
      } catch (error) {
        console.error(error.message);
      }

      alert(`Test submitted successfully! Your total score is: ${scorePercentage.toFixed(2)}%`);
    }
  };

  const handleNextSection = () => {
    if (currentSection === 'objective') {
      setCurrentSection('subjective');
    } else if (currentSection === 'subjective') {
      setCurrentSection('coding');
    }
  };

  const formatTimeLeft = (time) => {
    const minutes = String(Math.floor(time / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <Container style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)', margin: '20px auto', maxWidth: '800px' }}>
      <FacePhoneDetection />
  
      {loading ? (
        <div style={{ textAlign: 'center', fontSize: '24px' }}>Loading test... Please wait.</div>
      ) : (
        <>
          {testDetails && (
            <>
              <h1 style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '20px', textAlign: 'center' }}>
                {testDetails.name}
              </h1>
              <p style={{ textAlign: 'center', fontSize: '1.2rem' }}>Duration: {testDetails.duration} minutes</p>
              <div className="text-right" style={{ fontSize: '1.25rem', color: '#e74c3c', fontWeight: 'bold', marginBottom: '2rem' }}>
                Timer: {formatTimeLeft(timeLeft)}
              </div>
  
              <h3 style={{ fontSize: '1.8rem', color: '#34495e', marginBottom: '15px' }}>
                {currentSection === 'objective' ? 'Objective Questions' : currentSection === 'subjective' ? 'Subjective Questions' : 'Coding Questions'}
              </h3>
              <ul style={{ listStyleType: 'none', paddingLeft: 0, textAlign: 'left' }}>
                {testDetails.questions
                  .filter((question) => question.type === currentSection)
                  .map((question) => (
                    <li key={question._id} style={{ backgroundColor: '#f1f1f1', borderRadius: '8px', padding: '15px', marginBottom: '15px', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' }}>
                      <strong>{question.question}</strong>
  
                      {/* Objective Questions */}
                      {question.type === 'objective' && (
                        <ul>
                          {question.options.map((option, index) => (
                            <li key={index} style={{ listStyleType: 'none' }}>
                              <Form.Check
                                type="radio"
                                label={option}
                                name={question._id}
                                value={option}
                                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                                checked={answers[question._id] === option}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
  
                      {/* Subjective Questions */}
                      {question.type === 'subjective' && (
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Type your answer..."
                          onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                          value={answers[question._id] || ''}
                        />
                      )}
  
                      {/* Coding Questions */}
                      {question.type === 'coding' && (
                        <>
                          <br />
                          <select onChange={handleLanguageChange} value={codeLanguage} style={{ marginBottom: '15px', padding: '10px', borderRadius: '5px', border: '1px solid #ced4da' }}>
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                          </select>
                          <AceEditor
                            mode={codeLanguage === 'javascript' ? 'javascript' : 'python'}
                            theme="light"
                            name="codeEditor"
                            onChange={(value) => handleAnswerChange(question._id, value)}
                            fontSize={16}
                            width="100%"
                            height="300px"
                            showGutter={true}
                            highlightActiveLine={true}
                            value={answers[question._id] || ''}
                            setOptions={{
                              enableBasicAutocompletion: true,
                              enableLiveAutocompletion: true,
                              enableSnippets: true,
                              showLineNumbers: true,
                              tabSize: 2,
                            }}
                          />
                          <br />
                          <Button onClick={() => executeCode(answers[question._id])} style={{ fontSize: '1.1rem', padding: '10px 20px', borderRadius: '5px', transition: 'background-color 0.3s' }}>
                            Run Code
                          </Button>
                          <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', marginTop: '10px', border: '1px solid #ced4da' }}>
                            Output: {output}
                          </div>
                        </>
                      )}
                    </li>
                  ))}
              </ul>
  
              {/* Only show Next Section button if not in coding section */}
              {currentSection !== 'coding' && (
                <Button onClick={handleNextSection} className="mb-4" style={{ fontSize: '1.1rem', padding: '10px 20px', borderRadius: '5px', transition: 'background-color 0.3s' }}>
                  Next Section
                </Button>
              )}
  
              <Button onClick={handleSubmitTest} className="mb-4" style={{ fontSize: '1.1rem', padding: '10px 20px', borderRadius: '5px', transition: 'background-color 0.3s' }}>
                Submit Test
              </Button>
            </>
          )}
        </>
      )}
    </Container>
  );
  
  

};

export default TestPage;
