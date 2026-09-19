import React, { useState, useEffect, useContext } from 'react';
import { Editor } from '@monaco-editor/react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiPlay, FiGithub, FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const Compiler = () => {
  const { t } = useTranslation();
  const { token } = useContext(AuthContext);
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [fileName, setFileName] = useState('main.js');
  const [code, setCode] = useState('// Write your code here\nconsole.log("Hello, World!");');
  const [commitMessage, setCommitMessage] = useState('Add new code via Online Compiler');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isPushing, setIsPushing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Supported languages for the runner mapped to Monaco editor languages
  const languageMap = {
    'javascript': { piston: 'javascript', version: '18.15.0' },
    'python': { piston: 'python', version: '3.10.0' },
    'java': { piston: 'java', version: '15.0.2' },
    'cpp': { piston: 'c++', version: '10.2.0' }
  };
  const [selectedLang, setSelectedLang] = useState('javascript');

  useEffect(() => {
    fetchRepos();
  }, [token]);

  const fetchRepos = async () => {
    try {
      const res = await api.get('/repos', {
        headers: { 'x-auth-token': token }
      });
      setRepos(res.data);
      if (res.data.length > 0) {
        setSelectedRepo(res.data[0].repoName);
      }
    } catch (err) {
      console.error('Failed to fetch repos', err);
      setStatus({ type: 'error', message: 'Failed to load repositories.' });
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setStatus({ type: '', message: '' });
    setOutput('Running...');
    
    try {
      const langConfig = languageMap[selectedLang];
      const res = await api.post('/compiler/run', {
        language: langConfig.piston,
        version: langConfig.version,
        files: [{ name: fileName, content: code }]
      });

      if (res.data.run && res.data.run.output) {
        setOutput(res.data.run.output);
      } else {
        setOutput(res.data.message || 'Execution finished with no output.');
      }
    } catch (err) {
      setOutput('Error running code:\n' + (err.response?.data?.error || err.message));
    } finally {
      setIsRunning(false);
    }
  };

  const handlePush = async () => {
    if (!selectedRepo || !fileName || !code) {
      setStatus({ type: 'error', message: 'Please select a repo, specify a file name, and write some code.' });
      return;
    }

    setIsPushing(true);
    setStatus({ type: '', message: '' });

    try {
      await api.post('/compiler/push', {
        repoName: selectedRepo,
        filePath: fileName,
        content: code,
        commitMessage
      }, {
        headers: { 'x-auth-token': token }
      });

      setStatus({ type: 'success', message: `Successfully pushed ${fileName} to ${selectedRepo}!` });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to push to GitHub. (Ensure the app has GitHub permissions)' });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Online Compiler</h1>
          <p className="mt-2 text-sm text-gray-400">Write code, test it, and push directly to your tracked GitHub repositories.</p>
        </div>
      </div>

      {status.message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          {status.type === 'error' ? <FiAlertCircle size={20} /> : <FiCheckCircle size={20} />}
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-medium text-white mb-4">Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Target Repository</label>
                <select 
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                >
                  <option value="" disabled>Select a tracked repo...</option>
                  {repos.map(r => (
                    <option key={r._id} value={r.repoName}>{r.repoName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Language</label>
                <select 
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">File Name</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder-gray-500"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g., solution.js"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Commit Message</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder-gray-500"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Initial commit"
                />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <button 
                onClick={handleRun}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 hover:text-indigo-300 rounded-xl font-medium transition-all disabled:opacity-50 border border-indigo-500/20"
              >
                <FiPlay /> {isRunning ? 'Running...' : 'Run Code'}
              </button>

              <button 
                onClick={handlePush}
                disabled={isPushing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                <FiGithub /> {isPushing ? 'Pushing...' : 'Push to GitHub'}
              </button>
            </div>
          </div>
        </div>

        {/* Editor Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl h-[500px]">
            <Editor
              height="100%"
              language={selectedLang}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16, bottom: 16 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: true,
                formatOnPaste: true,
              }}
              className="mt-2"
            />
          </div>

          {/* Console Output */}
          <div className="bg-black/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 shadow-2xl min-h-[150px] font-mono text-sm">
            <div className="text-gray-500 mb-2 border-b border-gray-800 pb-2 flex items-center gap-2">
              <FiSave /> Terminal Output
            </div>
            <pre className="text-gray-300 whitespace-pre-wrap">{output || 'Ready.'}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compiler;
