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

      const response = await fetch(\`\${backendUrl}/health\`);

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

      const response = await fetch(\`\${backendUrl}/api/search-process\`, {

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

      throw new Error(\`Erro: \${error.message}\`);

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

      alert(\`Erro: \${error.message}\`);

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

      alert(\`Erro: \${error.message}\`);

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

    

    const whatsappMessage = \`Olá \${client.name}! 👋\\n\\nSeu advogado disponibilizou um portal seguro para acompanhar seus processos em tempo real.\\n\\n📱 Como acessar:\\n\\n1️⃣ Acesse: \${baseUrl}\\n2️⃣ Clique em "Acessar Meus Processos"\\n3️⃣ Cole este código: \${client.token}\\n\\n✅ Você verá:\\n✓ Status atual do processo\\n✓ Última movimentação\\n✓ Próximos prazos\\n✓ Resumo detalhado\\n\\nDúvidas? Contate seu advogado.\`;

    const emailMessage = \`PORTAL DE ACOMPANHAMENTO DE PROCESSOS\\n\\nCaro(a) \${client.name},\\n\\nSeu advogado habilitou acesso a um portal seguro para acompanhar seu processo judicial de forma transparente e em tempo real.\\n\\nPARA ACESSAR:\\n\\n1. Abra: \${baseUrl}\\n2. Clique em "Acessar Meus Processos"\\n3. Cole seu código: \${client.token}\\n\\nVOCÊ VERÁ:\\n✓ Status atual do processo\\n✓ Última movimentação\\n✓ Próximos prazos\\n✓ Resumo detalhado\\n✓ Histórico de movimentações\\n\\nSeu código é PESSOAL e SECRETO.\\n\\nAtenciosamente,\\nSeu Advogado\`;

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

  // ... rest of component
  return <div>App Loading...</div>;
};

export default LegalProcessDashboardV3;