import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Trash2, Edit2, Lock, LogOut, Eye, EyeOff, Loader, RefreshCw, CheckCircle, AlertCircle, Settings, Share2, Copy, Mail, Calendar, User, FileText } from 'lucide-react';

const LegalProcessDashboardV3 = () => {
  const [mode, setMode] = useState('login');
  const [adminPassword, setAdminPassword] = useState('1234');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [clientToken, setClientToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [clients, setClients] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [currentClient, setCurrentClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState({});
  const [backendUrl, setBackendUrl] = useState('http://localhost:3001');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [showSettings, setShowSettings] = useState(false);
  const [newBackendUrl, setNewBackendUrl] = useState('http://localhost:3001');

  const [newClient, setNewClient] = useState({ name: '', email: '' });
  const [newProcessNumber, setNewProcessNumber] = useState('');
  const [selectedClientForProcess, setSelectedClientForProcess] = useState('');

  const [showShareModal, setShowShareModal] = useState(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check backend
  useEffect(() => {
    checkBackendConnection();
  }, [backendUrl]);

  // Initialize
  useEffect(() => {
    const stored = localStorage.getItem('legalProcessV3');
    if (stored) {
      const data = JSON.parse(stored);
      setClients(data.clients || []);
      setProcesses(data.processes || []);
      setAdminPassword(data.adminPassword || '1234');
    }

    const storedUrl = localStorage.getItem('backendUrlV3');
    if (storedUrl) {
      setBackendUrl(storedUrl);
      setNewBackendUrl(storedUrl);
    }
  }, []);

  // Save
  useEffect(() => {
    if (clients.length > 0 || processes.length > 0) {
      localStorage.setItem('legalProcessV3', JSON.stringify({
        clients,
        processes,
        adminPassword
      }));
      localStorage.setItem('backendUrlV3', backendUrl);
    }
  }, [clients, processes, adminPassword, backendUrl]);

  const checkBackendConnection = async () => {
    try {
      setBackendStatus('checking');
      const response = await fetch(`${backendUrl}/health`);
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('error');
    }
  };

  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const searchProcessData = async (numero) => {
    if (backendStatus !== 'connected') {
      throw new Error('Backend não conectado');
    }

    try {
      const response = await fetch(`${backendUrl}/api/search-process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processNumber: numero })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Erro: ${error.message}`);
    }
  };

  const handleSaveSettings = () => {
    setBackendUrl(newBackendUrl);
    setShowSettings(false);
  };

  // Add client
  const handleAddClient = (e) => {
    e.preventDefault();
    if (newClient.name && newClient.email) {
      const client = {
        id: generateToken(),
        ...newClient,
        token: generateToken(),
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      setClients([...clients, client]);
      setNewClient({ name: '', email: '' });
    }
  };

  const handleDeleteClient = (id) => {
    setClients(clients.filter(c => c.id !== id));
    setProcesses(processes.filter(p => p.clientId !== id));
  };

  // Search and add process
  const handleSearchProcess = async (e) => {
    e.preventDefault();
    if (!newProcessNumber || !selectedClientForProcess) {
      alert('Preencha todos os campos');
      return;
    }

    setLoading(true);
    const searchId = Math.random().toString();
    setSearchStatus(prev => ({ ...prev, [searchId]: 'searching' }));

    try {
      const processData = await searchProcessData(newProcessNumber);

      const process = {
        id: generateToken(),
        clientId: selectedClientForProcess,
        ...processData,
        createdAt: new Date().toISOString()
      };

      setProcesses([...processes, process]);
      setNewProcessNumber('');
      setSelectedClientForProcess('');
      setSearchStatus(prev => ({ ...prev, [searchId]: 'success' }));
      
      setTimeout(() => {
        setSearchStatus(prev => ({ ...prev, [searchId]: null }));
      }, 3000);
    } catch (error) {
      alert(`Erro: ${error.message}`);
      setSearchStatus(prev => ({ ...prev, [searchId]: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshProcess = async (processId) => {
    const process = processes.find(p => p.id === processId);
    if (!process) return;

    setSearchStatus(prev => ({ ...prev, [processId]: 'refreshing' }));
    setLoading(true);

    try {
      const updated = await searchProcessData(process.numero);
      setProcesses(processes.map(p => p.id === processId ? { ...p, ...updated, id: processId } : p));
      setSearchStatus(prev => ({ ...prev, [processId]: 'refreshed' }));
      
      setTimeout(() => {
        setSearchStatus(prev => ({ ...prev, [processId]: null }));
      }, 3000);
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProcess = (id) => {
    setProcesses(processes.filter(p => p.id !== id));
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      alert('Preencha todos os campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('As senhas não conferem');
      return;
    }
    setAdminPassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setShowEditPassword(false);
    alert('✅ Senha alterada com sucesso!');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassInput === adminPassword) {
      setMode('admin');
      setAdminPassInput('');
    } else {
      alert('Senha incorreta');
    }
  };

  const handleClientAccess = (e) => {
    e.preventDefault();
    const client = clients.find(c => c.token === clientToken);
    if (client) {
      setCurrentClient(client);
      setMode('client');
      setClientToken('');
    } else {
      alert('Código inválido');
    }
  };

  const getClientProcesses = () => {
    return processes.filter(p => p.clientId === currentClient?.id);
  };

  const generateShareMessage = (client) => {
    const baseUrl = window.location.origin || 'https://seu-app.com';
    
    const whatsappMessage = `Olá ${client.name}! 👋\n\nSeu advogado disponibilizou um portal seguro para acompanhar seus processos em tempo real.\n\n📱 Como acessar:\n\n1️⃣ Acesse: ${baseUrl}\n2️⃣ Clique em "Acessar Meus Processos"\n3️⃣ Cole este código: ${client.token}\n\n✅ Você verá:\n✓ Status atual do processo\n✓ Última movimentação\n✓ Próximos prazos\n✓ Resumo detalhado\n\nDúvidas? Contate seu advogado.`;

    const emailMessage = `PORTAL DE ACOMPANHAMENTO DE PROCESSOS\n\nCaro(a) ${client.name},\n\nSeu advogado habilitou acesso a um portal seguro para acompanhar seu processo judicial de forma transparente e em tempo real.\n\nPARA ACESSAR:\n\n1. Abra: ${baseUrl}\n2. Clique em "Acessar Meus Processos"\n3. Cole seu código: ${client.token}\n\nVOCÊ VERÁ:\n✓ Status atual do processo\n✓ Última movimentação\n✓ Próximos prazos\n✓ Resumo detalhado\n✓ Histórico de movimentações\n\nSeu código é PESSOAL e SECRETO.\n\nAtenciosamente,\nSeu Advogado`;

    return { whatsappMessage, emailMessage, code: client.token };
  };

  const getPhaseColor = (phase) => {
    const colors = {
      'Distribuição': 'bg-blue-100 text-blue-800',
      'Fase inicial': 'bg-indigo-100 text-indigo-800',
      'Instrução': 'bg-purple-100 text-purple-800',
      'Saneamento': 'bg-pink-100 text-pink-800',
      'Sentença': 'bg-amber-100 text-amber-800',
      'Recurso': 'bg-orange-100 text-orange-800',
      'Execução': 'bg-green-100 text-green-800',
      'Em Andamento': 'bg-blue-100 text-blue-800'
    };
    return colors[phase] || 'bg-gray-100 text-gray-800';
  };

  // ============ LOGIN ============
  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-2xl p-8 relative">
            {/* Botão Configurações */}
            <button
              onClick={() => setShowSettings(true)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
              title="Configurações"
            >
              <Settings size={24} className="text-gray-600" />
            </button>

            <div className="text-center mb-8">
              <Lock className="w-12 h-12 text-blue-700 mx-auto mb-3" />
              <h1 className="text-3xl font-bold text-slate-900">Portal Jurídico</h1>
              <p className="text-slate-600 text-sm mt-2">v3.0 - Informações Completas</p>
            </div>

            <div className="mb-6 p-3 rounded-lg border-2 flex items-center gap-2 text-sm" 
              style={{
                borderColor: backendStatus === 'connected' ? '#10b981' : '#ef4444',
                backgroundColor: backendStatus === 'connected' ? '#ecfdf5' : '#fef2f2'
              }}>
              <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={backendStatus === 'connected' ? 'text-green-800' : 'text-red-800'}>
                {backendStatus === 'checking' && '⏳ Verificando...'}
                {backendStatus === 'connected' && '✅ Backend conectado'}
                {backendStatus === 'error' && '❌ Backend indisponível'}
              </span>
            </div>

            <div className="space-y-6">
              <form onSubmit={handleAdminLogin}>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Acesso do Advogado
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={adminPassInput}
                    onChange={(e) => setAdminPassInput(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-700 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={backendStatus !== 'connected'}
                  className="w-full mt-4 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition"
                >
                  Entrar
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-600">ou</span>
                </div>
              </div>

              <form onSubmit={handleClientAccess}>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Acesso do Cliente
                </label>
                <input
                  type="text"
                  placeholder="Seu código de acesso"
                  value={clientToken}
                  onChange={(e) => setClientToken(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-700 outline-none"
                />
                <button
                  type="submit"
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  Acessar Meus Processos
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Modal Configurações */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Settings size={24} />
                Configurações
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    URL do Backend
                  </label>
                  <input
                    type="text"
                    value={newBackendUrl}
                    onChange={(e) => setNewBackendUrl(e.target.value)}
                    placeholder="https://legal-app-backend-8jxx.onrender.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-700 outline-none text-sm"
                  />
                  <p className="text-xs text-slate-600 mt-2">
                    Cole a URL do seu Render aqui
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveSettings}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded transition"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold py-2 rounded transition"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="p-3 bg-blue-50 rounded border border-blue-200 text-xs text-blue-900">
                  <p className="font-semibold mb-1">💡 Dica:</p>
                  <p>Cole a URL do seu backend Render aqui. Exemplo:</p>
                  <code className="bg-white px-2 py-1 rounded block mt-1 break-all">
                    https://legal-app-backend-8jxx.onrender.com
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ ADMIN MODE ============
  if (mode === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Painel do Advogado</h1>
              <p className="text-slate-600 text-sm">v3.0 - Busca Completa</p>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => setShowEditPassword(true)}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 font-semibold border border-slate-300 rounded-lg"
              >
                <Lock size={18} />
                Alterar Senha
              </button>
              <button
                onClick={() => {
                  setMode('login');
                  setAdminPassInput('');
                }}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold"
              >
                <LogOut size={20} />
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Modal Alterar Senha */}
        {showEditPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Alterar Senha</h2>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Confirmar Senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-700 outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded transition"
                  >
                    Alterar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditPassword(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold py-2 rounded transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Compartilhar */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-96 overflow-y-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Compartilhar com {showShareModal.name}</h2>
              
              {(() => {
                const { whatsappMessage, emailMessage, code } = generateShareMessage(showShareModal);
                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Código de Acesso:</p>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-white px-3 py-2 rounded border border-slate-300 font-mono text-sm break-all">
                          {code}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(code);
                            alert('✅ Código copiado!');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-semibold text-slate-700 mb-2">📱 WhatsApp:</p>
                      <textarea
                        readOnly
                        value={whatsappMessage}
                        className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs h-24 bg-white"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(whatsappMessage);
                          alert('✅ Mensagem copiada!');
                        }}
                        className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded flex items-center justify-center gap-2"
                      >
                        <Copy size={16} />
                        Copiar Mensagem
                      </button>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm font-semibold text-slate-700 mb-2">📧 Email:</p>
                      <textarea
                        readOnly
                        value={emailMessage}
                        className="w-full px-3 py-2 rounded border border-slate-300 font-mono text-xs h-24 bg-white"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(emailMessage);
                          alert('✅ Mensagem copiada!');
                        }}
                        className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded flex items-center justify-center gap-2"
                      >
                        <Copy size={16} />
                        Copiar Mensagem
                      </button>
                    </div>

                    <button
                      onClick={() => setShowShareModal(null)}
                      className="w-full mt-4 bg-slate-300 hover:bg-slate-400 text-slate-900 font-semibold py-2 rounded"
                    >
                      Fechar
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Clientes */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Novo Cliente</h2>
                <form onSubmit={handleAddClient} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-700 outline-none text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-700 outline-none text-sm"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 rounded transition text-sm"
                  >
                    Adicionar Cliente
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">Clientes ({clients.length})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {clients.map(client => (
                      <div key={client.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-900">{client.name}</p>
                            <p className="text-xs text-slate-600">{client.email}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => setShowShareModal(client)}
                          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1 rounded"
                        >
                          Compartilhar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Processos */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Adicionar Processo</h2>
                <form onSubmit={handleSearchProcess} className="space-y-3 mb-6">
                  <select
                    value={selectedClientForProcess}
                    onChange={(e) => setSelectedClientForProcess(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-700 outline-none text-sm"
                  >
                    <option value="">Selecione o cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Número do processo (ex: 0000001-00.0000.1.00.0000)"
                    value={newProcessNumber}
                    onChange={(e) => setNewProcessNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-700 outline-none text-sm font-mono"
                  />

                  <div className="bg-blue-50 p-3 rounded border border-blue-200 text-xs text-blue-900">
                    💡 Informações do processo serão preenchidas automaticamente!
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-semibold py-2 rounded transition text-sm flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      '🔍 Buscar Processo Completo'
                    )}
                  </button>
                </form>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="font-semibold text-slate-900 mb-3">Processos ({processes.length})</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {processes.map(process => {
                      const client = clients.find(c => c.id === process.clientId);
                      return (
                        <div key={process.id} className="p-4 border border-slate-200 rounded hover:bg-slate-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 font-mono text-sm">{process.formatado}</p>
                              <p className="text-xs text-slate-600">{client?.name}</p>
                              <p className="text-xs text-blue-600 mt-1">📋 {process.plaintiff || 'Carregando...'}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRefreshProcess(process.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                              </button>
                              <button
                                onClick={() => handleDeleteProcess(process.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded font-semibold ${getPhaseColor(process.currentPhase)}`}>
                              {process.currentPhase}
                            </span>
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
      </div>
    );
  }

  // ============ CLIENT MODE ============
  if (mode === 'client') {
    const clientProcesses = getClientProcesses();

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Meus Processos</h1>
              <p className="text-slate-600 text-sm">{currentClient?.name}</p>
            </div>
            <button
              onClick={() => {
                setMode('login');
                setCurrentClient(null);
              }}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {clientProcesses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-semibold">Nenhum processo disponível</p>
              <p className="text-slate-500 text-sm mt-2">Seu advogado em breve adicionará seus processos</p>
            </div>
          ) : (
            <div className="space-y-6">
              {clientProcesses.map(process => (
                <div key={process.id} className="bg-white rounded-lg shadow hover:shadow-md transition">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-200">
                      <div>
                        <p className="text-sm text-slate-600 font-semibold">Processo nº</p>
                        <p className="text-xl font-bold text-slate-900 font-mono">{process.formatado}</p>
                      </div>
                      <span className={`inline-block text-xs px-3 py-1 rounded-full font-semibold ${getPhaseColor(process.currentPhase)}`}>
                        {process.currentPhase}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {process.plaintiff && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-2 mb-2">
                            <User size={14} />
                            Autor/Reclamante
                          </p>
                          <p className="text-slate-900 font-semibold">{process.plaintiff}</p>
                        </div>
                      )}
                      {process.defendant && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-2 mb-2">
                            <User size={14} />
                            Réu/Reclamada
                          </p>
                          <p className="text-slate-900 font-semibold">{process.defendant}</p>
                        </div>
                      )}
                      {process.judge && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-2 mb-2">
                            <FileText size={14} />
                            Juiz/Desembargador
                          </p>
                          <p className="text-slate-900 font-semibold">{process.judge}</p>
                        </div>
                      )}
                      {process.nextDeadline && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase flex items-center gap-2 mb-2">
                            <Calendar size={14} />
                            Próximo Prazo
                          </p>
                          <p className="text-slate-900 font-semibold">
                            {new Date(process.nextDeadline).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">{process.nextDeadlineDescription}</p>
                        </div>
                      )}
                    </div>

                    {process.summary && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-slate-700 uppercase mb-2">📋 Resumo do Processo</p>
                        <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">{process.summary}</p>
                      </div>
                    )}

                    {process.lastMovement && (
                      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs font-semibold text-slate-700 uppercase mb-2 flex items-center gap-2">
                          🔄 Última Movimentação
                        </p>
                        <p className="font-semibold text-slate-900">{process.lastMovement.titulo}</p>
                        <p className="text-sm text-slate-700 mt-1">{process.lastMovement.descricao}</p>
                        <p className="text-xs text-slate-600 mt-2">📅 {process.lastMovement.data}</p>
                      </div>
                    )}

                    {process.movements && process.movements.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-slate-700 uppercase mb-3">📋 Histórico de Movimentações</p>
                        <div className="space-y-2">
                          {process.movements.map((mov, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-sm text-slate-900">{mov.titulo}</p>
                                  <p className="text-xs text-slate-700 mt-1">{mov.descricao}</p>
                                </div>
                                <span className="text-xs text-slate-600 whitespace-nowrap ml-2">{mov.data}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {process.nextSteps && process.nextSteps.length > 0 && (
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs font-semibold text-slate-700 uppercase mb-3">⏭️ Próximos Passos</p>
                        <ul className="space-y-2">
                          {process.nextSteps.map((step, idx) => (
                            <li key={idx} className="text-sm text-slate-700 flex gap-2">
                              <span className="text-amber-600 font-bold">•</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <p className="text-xs text-slate-600">
                        <strong>Tribunal:</strong> {process.tribunalCompleto} • <strong>Segmento:</strong> {process.segmento}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default LegalProcessDashboardV3;
