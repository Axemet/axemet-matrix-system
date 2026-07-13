/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  LogIn, 
  UserPlus, 
  CheckCircle2, 
  ChevronLeft, 
  Mail, 
  Key, 
  RefreshCw 
} from 'lucide-react';
import { isSupabaseConfigured, signInUser, signUpUser, supabase } from '../lib/supabase';

interface LoginScreenProps {
  onLogin: (user: string, pass: string, rememberMe: boolean) => boolean;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [isForgotPassword, setIsForgotPassword] = React.useState(false);
  
  // Form states
  const [usernameOrEmail, setUsernameOrEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(true);
  
  // UI helper states
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Recovery flows
  const [recoveryView, setRecoveryView] = React.useState<'input_email' | 'email_sent' | 'enter_code' | 'success_reset'>('input_email');
  const [recoveryEmail, setRecoveryEmail] = React.useState('');
  const [recoveryCode, setRecoveryCode] = React.useState('');
  const [generatedCode, setGeneratedCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmNewPassword, setConfirmNewPassword] = React.useState('');
  const [showNewPassword, setShowNewPassword] = React.useState(false);

  // Load saved credentials on mount (Remember credentials feature)
  React.useEffect(() => {
    const savedRemember = localStorage.getItem('mm_remember_me') !== 'false';
    setRememberMe(savedRemember);
    if (savedRemember) {
      const savedUser = localStorage.getItem('mm_saved_username') || '';
      if (savedUser) setUsernameOrEmail(savedUser);
    }
  }, []);

  // Supabase exchanges the secure e-mail link for a recovery session. The user
  // must never type a fabricated code; the link itself is the verification.
  React.useEffect(() => {
    if (!isSupabaseConfigured) return;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const isRecoveryLink = hash.get('type') === 'recovery' || (new URLSearchParams(window.location.search).get('recovery') === '1' && !!hash.get('access_token'));
    if (isRecoveryLink) {
      setIsForgotPassword(true);
      setRecoveryView('enter_code');
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsForgotPassword(true);
        setRecoveryView('enter_code');
        setError(null);
        setSuccess(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const credential = usernameOrEmail.trim();
    const pwd = password.trim();

    if (!credential || !pwd || (isSignUp && !fullName.trim())) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Flow with Supabase
        if (!isSupabaseConfigured) {
          setError('O Supabase não está configurado para cadastro de usuários reais.');
          setIsLoading(false);
          return;
        }

        // Email validation
        if (!credential.includes('@')) {
          setError('Por favor, insira um endereço de e-mail válido para o cadastro.');
          setIsLoading(false);
          return;
        }

        await signUpUser(credential, pwd, fullName.trim());
        setSuccess('Solicitação de cadastro recebida! Verifique seu e-mail de confirmação. Um administrador precisará ativar sua conta antes do primeiro acesso.');
        setIsSignUp(false); // Switch to login tab
        setPassword(''); // Clear password
      } else {
        // Corporate login is always authenticated by Supabase. Credentials are never stored locally.
        if (credential.includes('@') && isSupabaseConfigured) {
          localStorage.setItem('mm_remember_me', rememberMe ? 'true' : 'false');
          if (rememberMe) {
            localStorage.setItem('mm_saved_username', credential);
          } else {
            localStorage.removeItem('mm_saved_username');
          }
          await signInUser(credential, pwd);
          // App state is handled reactively by onAuthStateChange in App.tsx
        } else {
          setError('Use um e-mail corporativo válido. O acesso exige autenticação Supabase configurada.');
        }
      }
    } catch (err: any) {
      let errorMsg = err.message || 'Ocorreu um erro ao processar sua solicitação.';
      
      const isExpectedAuthError = 
        errorMsg.includes('already registered') || 
        errorMsg.includes('not confirmed') || 
        errorMsg.includes('Invalid login credentials') ||
        errorMsg.includes('invalid') ||
        errorMsg.includes('requires a valid email');

      if (isExpectedAuthError) {
        console.warn('Erro esperado de autenticação (cliente):', errorMsg);
      } else {
        console.error('Erro de autenticação inesperado:', err);
      }
      
      if (errorMsg === 'Email not confirmed') {
        errorMsg = 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada para confirmar o cadastro no Supabase, ou desative a opção "Confirm email" no painel do Supabase (Authentication -> Provider Settings -> Email).';
      } else if (errorMsg === 'Invalid login credentials') {
        errorMsg = 'E-mail ou senha inválidos. Certifique-se de que digitou corretamente ou crie uma nova conta.';
      } else if (errorMsg === 'Signup requires a valid email') {
        errorMsg = 'O cadastro exige um e-mail válido.';
      } else if (errorMsg.includes('User already registered')) {
        errorMsg = 'Este e-mail já está cadastrado. Tente fazer o login ou recupere sua senha.';
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle send recovery code
  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const emailOrUser = recoveryEmail.trim();
    if (!emailOrUser) {
      setError('Por favor, informe seu usuário ou e-mail.');
      return;
    }

    setIsLoading(true);

    try {
      // If it's a Supabase email and configured, send real request
      if (emailOrUser.includes('@') && isSupabaseConfigured) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(emailOrUser, {
          redirectTo: `${window.location.origin}/?recovery=1`,
        });
        if (resetErr) throw resetErr;

        setSuccess(`Enviamos um link seguro para ${emailOrUser}. Abra esse link no mesmo navegador para definir a nova senha.`);
        setRecoveryView('email_sent');
      } else setError('A recuperação de senha exige o Supabase configurado e um e-mail corporativo.');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar solicitação de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset validation & update
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 5) {
      setError('A nova senha deve possuir pelo menos 5 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { error: updateErr } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (updateErr) throw updateErr;

        setRecoveryView('success_reset');
      } else setError('A redefinição de senha exige o link seguro enviado pelo Supabase.');
    } catch (err: any) {
      setError(err.message || 'Não foi possível redefinir sua senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ax-login min-h-screen flex flex-col lg:flex-row font-sans">
      
      {/* PAINEL ESQUERDO: Visual & Identidade (45% no desktop) */}
      <div className="ax-login-showcase lg:w-[53%] text-white p-7 md:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden shrink-0">
        {/* Background decorative vector elements */}
        <div className="ax-login-grid absolute inset-0 pointer-events-none" />
        <div className="absolute -top-32 -right-24 w-96 h-96 bg-[#C8A435]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-12 left-12 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Top brand */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/axemet-system-logo.png?v=2" alt="Axemet System" className="h-12 w-12 rounded-xl object-cover shadow-2xl ring-1 ring-[#C8A435]/50" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-[#C8A435] uppercase font-mono leading-none">AXEMET SYSTEM</span>
            <span className="text-xs font-bold text-white uppercase mt-1 tracking-wider leading-none">
              Plataforma Industrial
            </span>
          </div>
        </div>

        {/* Center Title / Value Proposition */}
        <div className="relative z-10 my-12 md:my-auto space-y-7 max-w-xl">
          <div className="ax-login-kicker">MOLDES, MATRIZES E FERRAMENTARIA</div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-[-.04em] text-white font-display leading-[.96]">
            A operação inteira.<br/><span className="text-[#d5ad4a]">Uma única visão.</span>
          </h1>
          <p className="text-sm text-slate-300 font-normal leading-relaxed max-w-lg">
            Da proposta ao try-out, o Axemet System conecta engenharia, chão de fábrica, suprimentos e gestão em uma operação rastreável.
          </p>

          {/* Benefits/Features List */}
          <div className="grid sm:grid-cols-3 gap-3 pt-3 text-xs font-medium text-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#C8A435]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Comercial para fabricação sem ruptura</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Pessoas, máquinas e operações conectadas</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sky-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span>Gestão por indicadores e permissões</span>
            </div>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 font-bold">
          <span>v1.0.0</span>
          <span>Acesso Criptografado & Seguro</span>
        </div>
      </div>

      {/* PAINEL DIREITO: Formulário de Acesso (55% no desktop) */}
      <div className="ax-login-panel flex-1 p-6 md:p-10 lg:p-14 flex items-center justify-center">
        <div className="ax-login-card w-full max-w-md space-y-8 animate-fadeIn">
          
          {/* FORGOT PASSWORD SCREEN */}
          {isForgotPassword ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setRecoveryView('input_email');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar ao login
                </button>
                <h2 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
                  Recuperação de Senha
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Redefina sua chave de acesso corporativo de forma prática.
                </p>
              </div>

              {/* Status Alert Messages */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-start gap-2.5 font-semibold animate-fade-in">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-start gap-2.5 font-semibold animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* WIZARD VIEW 1: Input email/username */}
              {recoveryView === 'input_email' && (
                <form onSubmit={handleRequestRecovery} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Usuário ou E-mail Cadastrado
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={recoveryEmail}
                        onChange={(e) => {
                          setRecoveryEmail(e.target.value);
                          setError(null);
                        }}
                        placeholder="Ex: admin ou joao@empresa.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-[#1A3F6F] focus:border-[#1A3F6F] outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#1A3F6F] hover:bg-[#0F2A43] disabled:bg-slate-300 disabled:text-slate-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
                  >
                    {isLoading ? 'Aguarde...' : 'Enviar Código Corporativo'}
                  </button>
                </form>
              )}

              {recoveryView === 'email_sent' && (
                <div className="space-y-5 rounded-xl border border-sky-100 bg-sky-50/60 p-5 text-center">
                  <Mail className="mx-auto h-8 w-8 text-[#1A3F6F]" />
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Link de recuperação enviado</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">Abra o link recebido por e-mail. Ele valida sua identidade e trará você de volta a esta tela para escolher uma nova senha.</p>
                  </div>
                  <button type="button" onClick={() => setRecoveryView('input_email')} className="text-xs font-bold text-[#1A3F6F] hover:underline">Enviar novamente</button>
                </div>
              )}

              {/* WIZARD VIEW 2: secure e-mail link accepted, choose a new password */}
              {recoveryView === 'enter_code' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5 bg-amber-50/50 border border-amber-200/50 p-3 rounded-lg text-[11px] text-amber-800 font-semibold">
                    Link seguro validado. Defina sua nova senha corporativa.
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Nova Senha de Acesso
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError(null);
                        }}
                        placeholder="Mínimo 5 caracteres"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-[#1A3F6F] outline-none transition"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => {
                          setConfirmNewPassword(e.target.value);
                          setError(null);
                        }}
                        placeholder="Repita a senha digitada"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-[#1A3F6F] outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#1A3F6F] hover:bg-[#0F2A43] disabled:bg-slate-300 disabled:text-slate-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
                  >
                    {isLoading ? 'Redefinindo...' : 'Atualizar Senha'}
                  </button>
                </form>
              )}

              {/* WIZARD VIEW 3: Success feedback */}
              {recoveryView === 'success_reset' && (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">Senha Alterada com Sucesso!</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sua nova credencial corporativa foi devidamente salva e atualizada no ERP Matrix System.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsForgotPassword(false);
                      setRecoveryView('input_email');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="w-full py-3 bg-[#1A3F6F] hover:bg-[#0F2A43] text-white font-extrabold text-xs rounded-xl shadow-lg transition uppercase tracking-widest cursor-pointer"
                  >
                    Ir para Login
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* NORMAL LOGIN / SIGNUP SCREEN */}
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
                  {isSignUp ? 'Solicitar Acesso' : 'Bem-vindo de volta'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {isSignUp 
                    ? 'Insira seus dados para solicitar cadastro na plataforma.' 
                    : 'Insira suas credenciais corporativas para acessar o sistema.'}
                </p>
              </div>

              {/* Tab Selector if Supabase Configured */}
              {isSupabaseConfigured && (
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition uppercase tracking-wider ${
                      !isSignUp ? 'bg-[#1A3F6F] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Acessar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition uppercase tracking-wider ${
                      isSignUp ? 'bg-[#1A3F6F] text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Criar Conta
                  </button>
                </div>
              )}

              {/* Security Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                <div className="p-2 bg-[#1A3F6F]/5 rounded-lg text-[#1A3F6F]">
                  <Lock className="w-4 h-4 shrink-0" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {isSignUp ? 'Cadastro de Colaborador' : 'Autenticação Certificada'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5 leading-snug">
                    {isSignUp 
                      ? 'Sua conta será submetida para ativação do Super-Admin.' 
                      : 'Os níveis de permissão serão carregados dinamicamente com base no seu perfil.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Error State */}
                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-start gap-2.5 font-semibold animate-fade-in">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Success State */}
                {success && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-start gap-2.5 font-semibold animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Full Name (Only on Sign Up) */}
                {isSignUp && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setError(null);
                        }}
                        placeholder="Nome completo do colaborador"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-[#1A3F6F] focus:border-[#1A3F6F] outline-none transition"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Email / Username Input */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {isSignUp || (isSupabaseConfigured && usernameOrEmail.includes('@')) 
                      ? 'E-mail Corporativo' 
                      : 'Usuário ou E-mail'}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={usernameOrEmail}
                      onChange={(e) => {
                        setUsernameOrEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder={isSignUp ? "seu.nome@empresa.com" : "Ex: admin ou seu e-mail"}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-[#1A3F6F] focus:border-[#1A3F6F] outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Senha de Acesso
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          // Open forgot password wizard
                          setIsForgotPassword(true);
                          setRecoveryView('input_email');
                          setRecoveryEmail(usernameOrEmail);
                          setError(null);
                          setSuccess(null);
                        }}
                        className="text-[10px] text-[#1A3F6F] font-bold hover:underline cursor-pointer"
                      >
                        Esqueceu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-[#1A3F6F] focus:border-[#1A3F6F] outline-none transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me checkbox */}
                {!isSignUp && (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 bg-slate-50 text-[#1A3F6F] focus:ring-[#1A3F6F] h-4 w-4"
                      />
                      <span className="text-[11px] text-slate-500 font-bold group-hover:text-slate-700 transition">
                        Lembrar credenciais corporativas
                      </span>
                    </label>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#1A3F6F] hover:bg-[#0F2A43] disabled:bg-slate-300 disabled:text-slate-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2 uppercase tracking-widest mt-6 cursor-pointer border border-[#1A3F6F]/10"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processando...
                    </span>
                  ) : isSignUp ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Solicitar Cadastro
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Entrar no ERP
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Product credit */}
          <div className="pt-6 border-t border-slate-100 text-center space-y-1">
            <p className="text-[9px] text-slate-400">
              © {new Date().getFullYear()} AXEMET SYSTEM. Gestão Industrial de Precisão.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
