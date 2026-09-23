import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import api from '../services/api';
import { FiPlay, FiGithub, FiTerminal, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const Compiler = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [fileName, setFileName] = useState('main.js');
  const [code, setCode] = useState('// Write your code here\nconsole.log("Hello, World!");');
  const [commitMessage, setCommitMessage] = useState('Add new code via OSTracker');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isPushing, setIsPushing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLang, setSelectedLang] = useState('javascript');

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const res = await api.get('/repos');
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
      const res = await api.post('/compiler/run', {
        language: selectedLang,
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
      });

      setStatus({ type: 'success', message: `Successfully pushed ${fileName} to ${selectedRepo}!` });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to push to GitHub.' });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeInUp">
      {status.message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          {status.type === 'error' ? <FiAlertCircle size={18} /> : <FiCheckCircle size={18} />}
          <span className="text-sm">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Config Panel */}
        <div className="lg:col-span-1">
          <div className="dashboard-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Configuration</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target Repository</label>
                <select
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
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
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Language</label>
                <select
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">File Name</label>
                <input
                  type="text"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder-slate-600"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g., solution.js"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Commit Message</label>
                <input
                  type="text"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder-slate-600"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Initial commit"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/15 rounded-lg text-sm font-medium transition-all disabled:opacity-50 border border-indigo-500/15"
              >
                <FiPlay size={14} /> {isRunning ? 'Running...' : 'Run Code'}
              </button>
              <button
                onClick={handlePush}
                disabled={isPushing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                <FiGithub size={14} /> {isPushing ? 'Pushing...' : 'Push to GitHub'}
              </button>
            </div>
          </div>
        </div>

        {/* Editor Panel */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <div className="dashboard-card overflow-hidden h-[480px]">
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
                cursorBlinking: 'smooth',
                formatOnPaste: true,
              }}
            />
          </div>

          {/* Console */}
          <div className="dashboard-card p-4 min-h-[140px] font-mono text-sm">
            <div className="text-slate-600 mb-2 border-b border-white/[0.04] pb-2 flex items-center gap-2 text-xs">
              <FiTerminal size={12} /> Output
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap text-xs">{output || 'Ready.'}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compiler;
