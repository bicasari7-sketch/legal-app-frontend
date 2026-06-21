import React, { useState, useEffect } from 'react';
import { Trash2, Lock, LogOut, Eye, EyeOff, Loader, RefreshCw, Settings, Copy, User, FileText, Share2 } from 'lucide-react';

const LegalProcessDashboardV3 = () => {
  const [mode, setMode] = useState('login');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem('adminPass') || '1234');
  const [clientToken, setClientToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [clients, setClients] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [currentClient, setCurrentClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem('backendUrlV3') || 'http://localhost:3001');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [showSettings, setShowSettings] = useState(false);
  const [newBackendUrl, setNewBackendUrl] = useState('');

  const [newClient, setNewClient] = useState({ name: '', email: '' });
  const [newProcessNumber, setNewProcessNumber] = useState('');
  const [selectedClientForProcess, setSelectedClientForProcess] = useState('');
  const [newProcessNotes, setNewProcessNotes] = useState('');
  const [showShareModal, setShowShareModal] = useState(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ===== API =====
  const api = async (method, path, body) => {
    const res = await fetch(`${backendUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(err.error || 'Erro na requisição');
    }
    return res.json();
  };

  // ===== BACKEND CHECK =====
  const checkBackend = async () => {
    try {
      setBackendStatus('checking');
      const res = await fetch(`${backendUrl}/health`, { signal: AbortSignal.timeout(5000) });
      setBackendStatus(res.ok ? 'connected' : 'error');
    } catch {
      setBackendStatus('error');
    }
  };

  useEffect(() => { checkBackend(); }, [backendUrl]);

  // ===== CARREGAR DADOS DO BACKEND (admin) =====
  const loadAdminData = async () => {
    try {
      const [cls, procs] = await Promise.all([
        api('GET', '/api/clients'),
        api('GET', '/api/processes')
      ]);
      setClients(cls);
      setProcesses(procs);
    } catch (e) {
      console.error('Erro ao carregar dados:', e.message);
    }
  };

  // ===== TOKEN GENERATOR =====
  const generateToken = () =>
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // ===== COPY =====
  const copyToClipboard = async (text, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`✅ ${msg}`);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      alert(`✅ ${msg}`);
    }
  };

  // ===== SHARE WHATSAPP =====
  // Usa Web Share API no celular (abre menu nativo) ou wa.me no desktop
  const shareViaWhatsApp = async (client) => {
    const { whatsapp } = generateShareMessage(client);

    if (navigator.share) {
      try {
        await navigator.share({ text: whatsapp });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // usuário cancelou
      }
    }

    // Fallback: abre WhatsApp Web com mensagem preenchida
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsapp)}`, '_blank');
  };

  // ===== LOGIN ADMIN =====
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (adminPassInput === adminPassword) {
      setAdminPassInput('');
      setMode('admin');
      await loadAdminData();
    } else {
      alert('❌ Senha incorreta');
    }
  };

  // ===== LOGIN CLIENTE (busca no backend) =====
  const handleClientAccess = async (e) => {
    e.preventDefault();
    try {
      const client = await api('GET', `/api/clients/token/${clientToken.trim()}`);
      setCurrentClient(client);
      const procs = await api('GET', `/api/processes/client/${client.id}`);
      setProcesses(procs);
      setClientToken('');
      setMode('client');
    } catch {
      alert('❌ Código inválido');
    }
  };

  // ===== ADD CLIENT =====
  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.email) return;
    try {
      const client = await api('POST', '/api/clients', {
        id: generateToken(),
        name: newClient.name,
        email: newClient.email,
        token: generateToken()
      });
      setClients(prev => [client, ...prev]);
      setNewClient({ name: '', email: '' });
    } catch (e) {
      alert('Erro ao adicionar cliente: ' + e.message);
    }
  };

  // ===== DELETE CLIENT =====
  const handleDeleteClient = async (id) => {
    if (!confirm('Excluir cliente e todos os processos?')) return;
    try {
      await api('DELETE', `/api/clients/${id}`);
      setClients(prev => prev.filter(c => c.id !== id));
      setProcesses(prev => prev.filter(p => p.clientId !== id));
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  };

  // ===== SEARCH & ADD PROCESS =====
  const handleSearchProcess = async (e) => {
    e.preventDefault();
    if (!newProcessNumber || !selectedClientForProcess) {
      alert('Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      const processData = await api('POST', '/api/search-process', { processNumber: newProcessNumber });
      const saved = await api('POST', '/api/processes', {
        id: generateToken(),
        clientId: selectedClientForProcess,
        advogadoNotes: newProcessNotes,
        ...processData,
        createdAt: new Date().toISOString()
      });
      setProcesses(prev => [saved, ...prev]);
      setNewProcessNumber('');
      setSelectedClientForProcess('');
      setNewProcessNotes('');
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== REFRESH PROCESS =====
  const handleRefreshProcess = async (processId) => {
    const process = processes.find(p => p.id === processId);
    if (!process) return;
    setLoading(true);
    try {
      const updated = await api('POST', '/api/search-process', { processNumber: process.numero });
      const saved = await api('PUT', `/api/processes/${processId}`, { ...updated });
      setProcesses(prev => prev.map(p => p.id === processId ? { ...p, ...saved } : p));
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== DELETE PROCESS =====
  const handleDeleteProcess = async (id) => {
    try {
      await api('DELETE', `/api/processes/${id}`);
      setProcesses(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert('Erro: ' + e.message);
    }
  };

  // ===== CHANGE PASSWORD =====
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      alert(newPassword ? 'As senhas não conferem' : 'Preencha todos os campos');
      return;
    }
    setAdminPassword(newPassword);
    localStorage.setItem('adminPass', newPassword);
    setNewPassword(''); setConfirmPassword('');
    setShowEditPassword(false);
    alert('✅ Senha alterada!');
  };

  // ===== SETTINGS =====
  const handleSaveSettings = () => {
    localStorage.setItem('backendUrlV3', newBackendUrl);
    setBackendUrl(newBackendUrl);
    setShowSettings(false);
  };

  // ===== SHARE MESSAGE =====
  const generateShareMessage = (client) => {
    const baseUrl = window.location.origin;
    const whatsapp = `Olá ${client.name}! 👋\n\nSeu advogado disponibilizou um portal seguro para acompanhar seus processos.\n\n📱 Como acessar:\n1️⃣ Acesse: ${baseUrl}\n2️⃣ Clique em "Acessar Meus Processos"\n3️⃣ Cole este código: ${client.token}\n\nDúvidas? Contate seu advogado.`;
    const email = `Caro(a) ${client.name},\n\nSeu advogado habilitou acesso ao portal de acompanhamento processual.\n\nAcesse: ${baseUrl}\nSeu código: ${client.token}\n\nAtenciosamente.`;
    return { whatsapp, email, code: client.token };
  };

  const getPhaseColor = (phase) => {
    const colors = {
      'Sentença': 'bg-amber-100 text-amber-800',
      'Recurso': 'bg-orange-100 text-orange-800',
      'Execução': 'bg-green-100 text-green-800',
    };
    return colors[phase] || 'bg-blue-100 text-blue-800';
  };

  // ============ LOGIN ============
  if (mode === 'login') return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8 relative">
          <button onClick={() => { setShowSettings(true); setNewBackendUrl(backendUrl); }}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full">
            <Settings size={24} className="text-gray-600" />
          </button>

          <div className="text-center mb-8">
            <Lock className="w-12 h-12 text-blue-700 mx-auto mb-3" />
            <h1 className="text-3xl font-bold text-slate-900">Portal Jurídico</h1>
          </div>

          <div className={`mb-6 p-3 rounded-lg border-2 flex items-center gap-2 text-sm ${backendStatus === 'connected' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
            <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={backendStatus === 'connected' ? 'text-green-800' : 'text-red-800'}>
              {backendStatus === 'checking' && '⏳ Verificando...'}
              {backendStatus === 'connected' && '✅ Backend conectado'}
              {backendStatus === 'error' && '❌ Backend indisponível'}
            </span>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleAdminLogin}>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Acesso do Advogado</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Senha"
                  value={adminPassInput} onChange={e => setAdminPassInput(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-700 outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-600">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <button type="submit" disabled={backendStatus !== 'connected'}
                className="w-full mt-4 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition">
                Entrar
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-300"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-600">ou</span></div>
            </div>

            <form onSubmit={handleClientAccess}>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Acesso do Cliente</label>
              <input type="text" placeholder="Seu código de acesso"
                value={clientToken} onChange={e => setClientToken(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-700 outline-none" />
              <button type="submit"
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
                Acessar Meus Processos
              </button>
            </form>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Configurações</h2>
            <label className="block text-sm font-semibold text-slate-700 mb-2">URL do Backend</label>
            <input type="text" value={newBackendUrl} onChange={e => setNewBackendUrl(e.target.value)}
              placeholder="https://legal-app-backend-xxxxx.onrender.com"
              className="w-full px-3 py-2 border border-slate-300 rounded outline-none text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={handleSaveSettings} className="flex-1 bg-blue-700 text-white font-semibold py-2 rounded">Salvar</button>
              <button onClick={() => setShowSettings(false)} className="flex-1 bg-slate-300 text-slate-900 font-semibold py-2 rounded">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ============ ADMIN ============
  if (mode === 'admin') {
    const clientProcesses = (clientId) => processes.filter(p => p.clientId === clientId);

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">Painel do Advogado</h1>
            <div className="flex gap-3">
              <button onClick={() => setShowEditPassword(true)}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 border border-slate-300 rounded-lg text-sm">
                <Lock size={16} /> Alterar Senha
              </button>
              <button onClick={() => { setMode('login'); setClients([]); setProcesses([]); }}
                className="flex items-center gap-2 text-slate-600 font-semibold">
                <LogOut size={20} /> Sair
              </button>
            </div>
          </div>
        </div>

        {showEditPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Alterar Senha</h2>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <input type="password" placeholder="Nova senha" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded outline-none" />
                <input type="password" placeholder="Confirmar senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded outline-none" />
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-blue-700 text-white font-semibold py-2 rounded">Alterar</button>
                  <button type="button" onClick={() => setShowEditPassword(false)} className="flex-1 bg-slate-300 text-slate-900 font-semibold py-2 rounded">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showShareModal && (() => {
          const { whatsapp, email, code } = generateShareMessage(showShareModal);
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg my-8">
                <h2 className="text-xl font-bold mb-4">Compartilhar com {showShareModal.name}</h2>
                <div className="space-y-4">

                  {/* Código de acesso */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-semibold mb-2">🔑 Código de Acesso:</p>
                    <div className="flex gap-2 items-center">
                      <code className="flex-1 bg-white px-3 py-2 rounded border font-mono text-sm break-all select-all">
                        {code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(code, 'Código copiado!')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-1 text-sm whitespace-nowrap"
                      >
                        <Copy size={14} /> Copiar
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">💡 Toque no código para selecionar e copiar manualmente</p>
                  </div>

                  {/* WhatsApp — usa Web Share API no celular */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-semibold mb-3">📱 Enviar pelo WhatsApp:</p>
                    <button
                      onClick={() => shareViaWhatsApp(showShareModal)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 text-base"
                    >
                      <Share2 size={18} /> Compartilhar via WhatsApp
                    </button>
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      No celular abre o menu nativo • No computador abre o WhatsApp Web
                    </p>
                  </div>

                  {/* Email */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm font-semibold mb-2">📧 Mensagem para Email:</p>
                    <textarea readOnly value={email}
                      className="w-full px-3 py-2 rounded border text-xs h-20 bg-white resize-none" />
                    <button
                      onClick={() => copyToClipboard(email, 'Email copiado!')}
                      className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded flex items-center justify-center gap-2"
                    >
                      <Copy size={16} /> Copiar Email
                    </button>
                  </div>

                  <button onClick={() => setShowShareModal(null)}
                    className="w-full bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold py-2 rounded">
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Novo Cliente</h2>
              <form onSubmit={handleAddClient} className="space-y-3">
                <input type="text" placeholder="Nome completo" value={newClient.name}
                  onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded outline-none text-sm" />
                <input type="email" placeholder="Email" value={newClient.email}
                  onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded outline-none text-sm" />
                <button type="submit" className="w-full bg-blue-700 text-white font-semibold py-2 rounded text-sm">
                  Adicionar Cliente
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="font-semibold mb-3">Clientes ({clients.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {clients.map(client => (
                    <div key={client.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{client.name}</p>
                          <p className="text-xs text-slate-600">{client.email}</p>
                          <p className="text-xs text-slate-500 mt-1">{clientProcesses(client.id).length} processo(s)</p>
                        </div>
                        <button onClick={() => handleDeleteClient(client.id)} className="text-red-600 ml-2">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <button onClick={() => setShowShareModal(client)}
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 rounded flex items-center justify-center gap-1">
                        <Share2 size={12} /> Compartilhar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Adicionar Processo</h2>
              <form onSubmit={handleSearchProcess} className="space-y-3 mb-6">
                <select value={selectedClientForProcess} onChange={e => setSelectedClientForProcess(e.target.value)}
                  className="w-full px-3 py-2 border rounded outline-none text-sm">
                  <option value="">Selecione o cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="text" placeholder="Número do processo (20 dígitos)" value={newProcessNumber}
                  onChange={e => setNewProcessNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded outline-none text-sm font-mono" />
                <textarea placeholder="Notas do advogado" value={newProcessNotes}
                  onChange={e => setNewProcessNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded outline-none text-sm resize-none" rows="2" />
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-2 rounded flex items-center justify-center gap-2">
                  {loading ? <><Loader size={16} className="animate-spin" /> Buscando...</> : '🔍 Buscar e Salvar Processo'}
                </button>
              </form>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Processos ({processes.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {processes.map(proc => {
                    const client = clients.find(c => c.id === proc.clientId);
                    return (
                      <div key={proc.id} className="p-3 border rounded hover:bg-slate-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-mono text-sm font-semibold">{proc.formatado}</p>
                            <p className="text-xs text-slate-600">{client?.name}</p>
                            {proc.grau && <p className="text-xs text-blue-600 mt-1">{proc.grau}</p>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleRefreshProcess(proc.id)} className="text-blue-600" title="Atualizar">
                              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button onClick={() => handleDeleteProcess(proc.id)} className="text-red-600" title="Excluir">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ CLIENT ============
  if (mode === 'client') return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Meus Processos</h1>
            <p className="text-slate-600 text-sm">{currentClient?.name}</p>
          </div>
          <button onClick={() => { setMode('login'); setCurrentClient(null); setProcesses([]); }}
            className="flex items-center gap-2 text-slate-600 font-semibold">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {processes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-semibold">Nenhum processo disponível ainda</p>
          </div>
        ) : (
          <div className="space-y-6">
            {processes.map(proc => (
              <div key={proc.id} className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6 pb-6 border-b">
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">Processo nº</p>
                      <p className="text-xl font-bold font-mono">{proc.formatado}</p>
                      {proc.grau && (
                        <span className={`inline-block mt-2 text-xs px-2 py-1 rounded font-semibold ${proc.emRecurso ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                          {proc.grau}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getPhaseColor(proc.currentPhase)}`}>
                      {proc.currentPhase}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {proc.plaintiff && proc.plaintiff !== 'Não informado' && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1 mb-1"><User size={12} /> Autor</p>
                        <p className="font-semibold text-slate-900">{proc.plaintiff}</p>
                      </div>
                    )}
                    {proc.defendant && proc.defendant !== 'Não informado' && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1 mb-1"><User size={12} /> Réu</p>
                        <p className="font-semibold text-slate-900">{proc.defendant}</p>
                      </div>
                    )}
                    {proc.judge && proc.judge !== 'Não informado' && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-1 mb-1"><FileText size={12} /> Juiz</p>
                        <p className="font-semibold text-slate-900">{proc.judge}</p>
                      </div>
                    )}
                  </div>

                  {proc.advogadoNotes && (
                    <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs font-semibold uppercase mb-2">📝 Observações do Advogado</p>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{proc.advogadoNotes}</p>
                    </div>
                  )}

                  {proc.summary && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-semibold uppercase mb-2">📋 Assunto</p>
                      <p className="text-slate-700 text-sm">{proc.summary}</p>
                    </div>
                  )}

                  {proc.lastMovement && (
                    <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs font-semibold uppercase mb-2">🔄 Última Movimentação</p>
                      <p className="font-semibold text-slate-900">{proc.lastMovement.titulo}</p>
                      {proc.lastMovement.descricao && <p className="text-sm text-slate-700 mt-1">{proc.lastMovement.descricao}</p>}
                      <p className="text-xs text-slate-500 mt-2">📅 {proc.lastMovement.data}</p>
                    </div>
                  )}

                  {proc.movements?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase mb-3">📋 Histórico de Movimentações</p>
                      <div className="space-y-2">
                        {proc.movements.map((mov, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-sm">{mov.titulo}</p>
                                {mov.descricao && <p className="text-xs text-slate-700 mt-1">{mov.descricao}</p>}
                              </div>
                              <span className="text-xs text-slate-500 whitespace-nowrap ml-2">{mov.data}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {proc.nextSteps?.length > 0 && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-xs font-semibold uppercase mb-2">⏭️ Próximos Passos</p>
                      <ul className="space-y-1">
                        {proc.nextSteps.map((step, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex gap-2">
                            <span className="text-amber-600">•</span>{step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t text-xs text-slate-500">
                    <strong>Tribunal:</strong> {proc.tribunalCompleto} • <strong>Segmento:</strong> {proc.segmento}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalProcessDashboardV3;
