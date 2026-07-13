import React from 'react';
import { Building, Upload, Trash2, Mail, Phone, MapPin, FileText, ChevronLeft, Save } from 'lucide-react';
import { getOrganizationProfile, updateOrganizationProfile } from '../lib/organization';

interface OrganizationConfig {
  id?: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  logo: string;
  logoWidth?: number;
  logoHeight?: number;
}

interface OrganizationAdminScreenProps {
  onBack: () => void;
  showToast: (text: string, type: 'success' | 'info' | 'error') => void;
}

export default function OrganizationAdminScreen({ onBack, showToast }: OrganizationAdminScreenProps) {
  const [config, setConfig] = React.useState<OrganizationConfig>({
    name: 'Axemet Solution LTDA',
    cnpj: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    logo: ''
  });

  const [dragActive, setDragActive] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const loadedRef = React.useRef(false);

  // Load once only. `showToast` is recreated by the parent on every render;
  // using it as a dependency was reloading the database while the user typed.
  React.useEffect(() => {
    let active = true;
    getOrganizationProfile()
      .then(profile => {
        if (active && profile) setConfig(prev => ({
          ...prev,
          id: profile.id,
          name: profile.name || prev.name,
          cnpj: profile.cnpj || '',
          phone: profile.phone || '',
          email: profile.email || '',
          website: profile.website || '',
          address: profile.address || '',
          logo: profile.logo_url || '',
        }));
      })
      .catch((error:any) => { if (active) showToast(error.message || 'Não foi possível carregar a organização.', 'error'); })
      .finally(() => { loadedRef.current = true; });
    return () => { active = false; };
  }, []);

  const persistConfig = async (nextConfig: OrganizationConfig, successMessage = 'Dados da organização salvos no banco corporativo.') => {
    setSaving(true);
    try {
      const saved = await updateOrganizationProfile({ id: nextConfig.id, name: nextConfig.name, cnpj: nextConfig.cnpj, phone: nextConfig.phone, email: nextConfig.email, website: nextConfig.website, address: nextConfig.address, logo_url: nextConfig.logo || null });
      setConfig(current => ({
        ...current,
        id: saved.id || current.id,
        name: saved.name || current.name,
        cnpj: saved.cnpj || '',
        phone: saved.phone || '',
        email: saved.email || '',
        website: saved.website || '',
        address: saved.address || '',
        logo: saved.logo_url || '',
        logoWidth: nextConfig.logoWidth,
        logoHeight: nextConfig.logoHeight,
      }));
      showToast(successMessage, 'success');
    } catch (error:any) { showToast(error.message || 'Não foi possível salvar a organização.', 'error'); }
    finally { setSaving(false); }
  };
  const handleSave = async () => { await persistConfig(config); };

  const handleLogoUpload = (file: File) => {
    if (!loadedRef.current) {
      showToast('Aguarde os dados da organização terminarem de carregar.', 'info');
      return;
    }
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('O arquivo original do logotipo deve ter no máximo 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const logoDataUrl = e.target.result as string;
        
        // Use an image and canvas to convert to a standardized PNG
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // Downscale slightly to keep storage size small (max width 400px)
          const maxDim = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Standardize as PNG (which preserves transparency and is universally supported in jsPDF)
            const cleanDataUrl = canvas.toDataURL('image/png');
            
            const nextConfig = { ...config, logo: cleanDataUrl, logoWidth: width, logoHeight: height };
            setConfig(nextConfig);
            void persistConfig(nextConfig, 'Logotipo salvo e vinculado à organização.');
          } else {
            // Fallback if canvas context is not available
            const nextConfig = { ...config, logo: logoDataUrl, logoWidth: img.width, logoHeight: img.height };
            setConfig(nextConfig);
            void persistConfig(nextConfig, 'Logotipo salvo e vinculado à organização.');
          }
        };
        img.onerror = () => {
          showToast('Erro ao processar a imagem. Certifique-se de que é um arquivo de imagem válido.', 'error');
        };
        img.src = logoDataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    const nextConfig = { ...config, logo: '', logoWidth: undefined, logoHeight: undefined };
    setConfig(nextConfig);
    void persistConfig(nextConfig, 'Logotipo removido da organização.');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-orange-950 font-heading uppercase tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 text-[#EA580C]" />
            Dados da Organização & Identidade Visual
          </h2>
          <p className="text-xs text-slate-500">
            Cadastre os dados oficiais da sua empresa e o logotipo para cabeçalhos de orçamentos e relatórios PDF.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para Home
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Logo Upload card */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Logotipo da Empresa</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Faça upload de uma imagem com fundo transparente ou branco para garantir o alinhamento visual nos documentos impressos e em PDFs.
          </p>

          {config.logo ? (
            <div className="relative border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center min-h-[160px] group">
              <img src={config.logo} alt="Organization Logo" className="max-h-[100px] max-w-full object-contain" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 px-3 py-1.5 bg-white border border-slate-200 hover:border-orange-300 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
              >
                Trocar logotipo
              </button>
              <button
                onClick={handleRemoveLogo}
                className="absolute top-2 right-2 p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition cursor-pointer"
                title="Remover Logotipo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[160px] transition text-center ${
                dragActive ? 'border-[#EA580C] bg-orange-50 text-[#EA580C]' : 'border-slate-300 hover:border-slate-400 text-slate-500 bg-slate-50'
              }`}
            >
              <Upload className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-700">Arraste seu logotipo ou clique para buscar</p>
                <p className="text-[10px] text-slate-400 mt-1">Formatos PNG, JPG ou WEBP (máx. 5MB)</p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) handleLogoUpload(e.target.files[0]);
              e.currentTarget.value = '';
            }}
          />

          <div className="p-3 bg-orange-50/60 border border-orange-100 rounded-lg space-y-1.5">
            <h4 className="text-[11px] font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
              📏 Dimensões Recomendadas (Padrão Industrial)
            </h4>
            <ul className="text-[10px] text-slate-600 space-y-1 list-disc list-inside leading-relaxed pl-1">
              <li>Área de impressão no PDF: <strong className="text-orange-950">38 mm × 18 mm</strong></li>
              <li>Proporção ideal: <strong className="text-orange-950">2,2:1 (Horizontal)</strong></li>
              <li>Resolução de arquivo: <strong className="text-orange-950">350px × 160px</strong> (ou equivalente proporcional, ex: 700px × 320px)</li>
              <li>
                <strong className="text-orange-900">Ajuste Inteligente:</strong> O PDF preserva a proporção original e centraliza o logo dentro da cota máxima de 18 mm de altura ou 38 mm de largura, sem distorção.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Form details */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dados Corporativos</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Razão Social / Nome de Exibição</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Building className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Axemet Solution LTDA"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#EA580C] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Site da Empresa</label>
              <input
                type="url"
                value={config.website}
                onChange={(e) => setConfig(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.suaempresa.com.br"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#EA580C] focus:border-transparent outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">CNPJ</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <FileText className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={config.cnpj}
                  onChange={(e) => setConfig(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0001-00"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#EA580C] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telefone / WhatsApp</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => setConfig(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#EA580C] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-mail Comercial</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={config.email}
                  onChange={(prev) => setConfig(prevVal => ({ ...prevVal, email: prev.target.value }))}
                  placeholder="comercial@empresa.com"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#EA580C] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Endereço Completo</label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <textarea
                  value={config.address}
                  onChange={(e) => setConfig(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua Industrial, 123 - Centro, Joinville - SC, CEP 89200-000"
                  rows={2}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#EA580C] focus:border-transparent outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold tracking-wider uppercase transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
